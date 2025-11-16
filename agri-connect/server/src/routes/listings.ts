import { Router, Request, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import Listing from '../models/Listing';
import User from '../models/User';
import Feedback from '../models/Feedback';
import MarketPrice from '../models/MarketPrice';
import axios from 'axios';
import { config } from '../config';
import fs from 'fs';
import path from 'path';
import fetch, { FormData, Blob } from 'node-fetch';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// Escape user input for safe use in regex
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.post('/listings',
  authenticate,
  authorize(['farmer']),
  upload.array('images', 5),
  body('title').isString().notEmpty(),
  body('cropType').isString().notEmpty(),
  body('quantity').isFloat({ gt: 0 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, cropType, quantity, unit, location } = req.body as any;
    const files = (req as any).files as any[] || [];
    const images = files.map((f: any) => '/' + f.path.replace(/\\/g, '/'));

    const today = new Date().toISOString().slice(0,10);
    const mp = await MarketPrice.findOne({ date: today });
    const adminCropPrice = mp?.items.find(i => i.name.toLowerCase() === String(cropType).toLowerCase())?.price;

    let qualityScore: number | undefined = undefined; // use Good% as qualityScore
    let suggestedPrice: number | undefined = undefined; // total price = perKg * quantity

    try {
      // Prefer using first uploaded image for ML /infer to get class probabilities
      const first = files[0];
      if (first?.path) {
        const abs = path.resolve(first.path);
        const buf = fs.readFileSync(abs);
        const form = new FormData();
        const blob = new Blob([buf], { type: first.mimetype || 'image/jpeg' });
        form.append('file', blob as any, path.basename(abs));
        const r = await fetch(`${config.mlServiceUrl}/infer`, { method: 'POST', body: form as any } as any);
        if (r.ok) {
          const data = await r.json() as any;
          const scores = (data?.vit_class?.scores) as Record<string, number> | undefined;
          const goodPct = typeof scores?.['Good/Fresh'] === 'number' ? scores['Good/Fresh'] : undefined;
          if (typeof goodPct === 'number') {
            qualityScore = goodPct; // 0..1
          }
        }
      }
      // If infer failed, fallback to lightweight analyze signal
      if (qualityScore == null) {
        const { data } = await axios.post(`${config.mlServiceUrl}/analyze`, { cropType, images });
        if (data && typeof data.qualityScore === 'number') qualityScore = data.qualityScore;
      }
    } catch {}

    // Compute total suggested price if we have admin crop price and qualityScore
    if (typeof adminCropPrice === 'number' && typeof qualityScore === 'number') {
      const perKg = Math.round(adminCropPrice * qualityScore * 100) / 100;
      const total = Math.round(perKg * parseFloat(quantity) * 100) / 100;
      suggestedPrice = total;
    } else if (typeof adminCropPrice === 'number') {
      // If no quality, default total = admin crop price * quantity
      suggestedPrice = Math.round(adminCropPrice * parseFloat(quantity) * 100) / 100;
    }

    const user = (req as any).user as { id: string } | undefined;
    const listing = await Listing.create({
      farmerId: user?.id,
      title,
      cropType,
      quantity: parseFloat(quantity),
      unit: unit || 'kg',
      images,
      location,
      suggestedPrice,
      qualityScore,
      marketPriceSnapshot: adminCropPrice
    });

    res.json(listing);
  }
);

router.get('/listings', async (req: Request, res: Response) => {
  const { q, cropType, minPrice, maxPrice } = req.query as any;
  const filter: any = {};
  if (q) {
    const rx = new RegExp(esc(String(q)), 'i');
    filter.$or = [{ title: rx }, { cropType: rx }];
  }
  if (cropType) {
    const rxType = new RegExp(esc(String(cropType)), 'i');
    filter.cropType = rxType;
  }
  if (minPrice || maxPrice) filter.suggestedPrice = { };
  if (minPrice) filter.suggestedPrice.$gte = parseFloat(minPrice);
  if (maxPrice) filter.suggestedPrice.$lte = parseFloat(maxPrice);
  const docs = await Listing.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('farmerId', 'name ratingAverage ratingCount');
  res.json(docs);
});

// Public: show admin-decided price per kg for quality categories
router.get('/public/quality-prices', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const doc = await MarketPrice.findOne({ date: today });
    const REQUIRED = ['Good/Fresh', 'Rotten/Spoiled', 'Completely Bad/Decomposed'];
    const map: Record<string, number | null> = {};
    for (const k of REQUIRED) map[k] = null;
    (doc?.items || []).forEach((it: any) => {
      const name = String(it?.name || '').trim();
      if (name in map && typeof it?.price === 'number') map[name] = it.price;
    });
    return res.json({ date: today, prices: map, unit: 'kg' });
  } catch (e: any) {
    return res.status(500).json({ message: 'failed to load quality prices' });
  }
});

// Farmer: get my listings
router.get('/my/listings', authenticate, authorize(['farmer']), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  const docs = await Listing.find({ farmerId: user?.id }).sort({ createdAt: -1 });
  res.json(docs);
});

// Farmer: update my listing
router.put(
  '/listings/:id',
  authenticate,
  authorize(['farmer']),
  body('title').optional().isString().notEmpty(),
  body('cropType').optional().isString().notEmpty(),
  body('quantity').optional().isFloat({ gt: 0 }),
  body('unit').optional().isString(),
  body('location').optional().isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const user = (req as any).user as { id: string } | undefined;
    const id = req.params.id;
    const listing = await Listing.findOne({ _id: id, farmerId: user?.id });
    if (!listing) return res.status(404).json({ message: 'Not found' });
    const fields = ['title','cropType','quantity','unit','location','status'];
    for (const f of fields) if (f in (req.body as any)) (listing as any)[f] = (req.body as any)[f];
    await listing.save();
    res.json(listing);
  }
);

// Farmer: delete my listing
router.delete('/listings/:id', authenticate, authorize(['farmer']), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  const id = req.params.id;
  const listing = await Listing.findOneAndDelete({ _id: id, farmerId: user?.id });
  if (!listing) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Farmer: mark as sold
router.post('/listings/:id/sold', authenticate, authorize(['farmer']), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  const id = req.params.id;
  const listing = await Listing.findOne({ _id: id, farmerId: user?.id });
  if (!listing) return res.status(404).json({ message: 'Not found' });
  listing.status = 'sold';
  await listing.save();
  res.json(listing);
});

export default router;

// Helper: recompute and persist farmer's ratingAverage and ratingCount from Feedback
async function updateFarmerRatings(farmerId: string) {
  const agg = await Feedback.aggregate([
    { $match: { farmerId: new (require('mongoose').Types.ObjectId)(farmerId) } },
    { $group: { _id: '$farmerId', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
  ]);
  const avg = agg[0]?.avg || 0;
  const cnt = agg[0]?.cnt || 0;
  await User.updateOne({ _id: farmerId }, { $set: { ratingAverage: avg, ratingCount: cnt } });
}

// Buyer: submit feedback on a listing (rating/comment)
router.post('/listings/:id/feedback', authenticate, authorize(['buyer']), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string } | undefined;
  const id = req.params.id;
  const { rating, comment } = req.body as any;
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) return res.status(400).json({ message: 'Invalid rating' });

  const listing = await Listing.findById(id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  // Upsert single feedback per buyer per listing
  const doc = await Feedback.findOneAndUpdate(
    { listingId: listing._id, buyerId: user?.id },
    { $set: { farmerId: listing.farmerId, rating: r, comment } },
    { upsert: true, new: true }
  );

  await updateFarmerRatings(String(listing.farmerId));
  res.json(doc);
});
