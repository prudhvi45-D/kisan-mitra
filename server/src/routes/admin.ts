import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import MarketPrice from '../models/MarketPrice';
import User from '../models/User';
import Listing from '../models/Listing';
import Feedback from '../models/Feedback';

const router = Router();

router.use(authenticate, authorize(['admin']));

router.get('/market-prices', async (req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0,10);
  let doc = await MarketPrice.findOne({ date: today });
  if (!doc) doc = await MarketPrice.create({ date: today, items: [] });
  res.json(doc);
});

router.put('/market-prices', async (req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0,10);
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const doc = await MarketPrice.findOneAndUpdate(
    { date: today },
    { $set: { items } },
    { upsert: true, new: true }
  );
  res.json(doc);
});

// GET /admin/analytics/summary
router.get('/analytics/summary', async (req: Request, res: Response) => {
  const [totalUsers, farmers, buyers] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'buyer' })
  ]);

  const [totalListings, soldCount] = await Promise.all([
    Listing.countDocuments({}),
    Listing.countDocuments({ status: 'sold' })
  ]);

  // Top-rated farmers computed from buyer feedback (listing-based)
  const topFarmers = await Feedback.aggregate([
    { $group: { _id: '$farmerId', ratingAverage: { $avg: '$rating' }, ratingCount: { $sum: 1 } } },
    { $match: { ratingAverage: { $gte: 3 }, ratingCount: { $gt: 0 } } },
    { $sort: { ratingAverage: -1, ratingCount: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: 1, name: '$user.name', ratingAverage: 1, ratingCount: 1 } }
  ]);

  res.json({
    users: { total: totalUsers, farmers, buyers },
    listings: { total: totalListings, sold: soldCount },
    topRatedFarmers: topFarmers,
    charts: {
      revenueDaily: [],
      revenueWeekly: [],
      revenueMonthly: []
    }
  });
});

export default router;
