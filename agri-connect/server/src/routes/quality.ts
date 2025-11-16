import { Router, Request, Response } from 'express';
import multer from 'multer';
import { config } from '../config';
import fetch, { FormData, File, Blob } from 'node-fetch';
import MarketPrice from '../models/MarketPrice';

const router = Router();
const upload = multer();

router.get('/quality/ping', async (_req: Request, res: Response) => {
  const primary = `${config.mlServiceUrl.replace(/\/$/, '')}/`;
  const candidates = [primary];
  for (const url of candidates) {
    try {
      const r = await fetch(url);
      const text = await r.text();
      return res.json({ url, status: r.status, body: text.slice(0, 500) });
    } catch (e: any) {
      // continue
    }
  }
  return res.status(502).json({ message: 'ML unreachable on both primary and fallback' });
});

router.post('/quality/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'image file is required (field name: image)' });

    const form = new FormData();
    const bytes = new Uint8Array(file.buffer);
    const blob = new Blob([bytes], { type: file.mimetype || 'image/jpeg' });
    // Provide a filename explicitly for the blob
    form.append('file', blob as any, file.originalname || 'image.jpg');

    const primary = `${config.mlServiceUrl.replace(/\/$/, '')}/infer`;
    const candidates = [primary];

    let lastErr: any = null;
    for (const url of candidates) {
      console.log('[quality] trying ML', url);
      try {
        // Allow long time for first-time model downloads in ML service
        const ac = new AbortController();
        const timeoutMs = 5 * 60 * 1000; // 5 minutes
        const t = setTimeout(() => ac.abort(), timeoutMs);
        const r = await fetch(url, { method: 'POST', body: form as any, signal: ac.signal as any });
        clearTimeout(t);
        if (r.ok) {
          const data = await r.json();
          // Attach admin-configured price per kg based on final_quality label
          try {
            const today = new Date().toISOString().slice(0, 10);
            const doc = await MarketPrice.findOne({ date: today });
            const REQUIRED = ['Good/Fresh', 'Rotten/Spoiled', 'Completely Bad/Decomposed'];
            const pricesMap: Record<string, number | undefined> = {};
            for (const k of REQUIRED) pricesMap[k] = undefined;
            (doc?.items || []).forEach((it: any) => {
              const name = String(it?.name || '').trim();
              if (name in pricesMap && typeof it?.price === 'number') pricesMap[name] = it.price;
            });

            // Prefer weighted expected price if model provided probabilities
            const scores = (data?.vit_class?.scores) as Record<string, number> | undefined;
            if (scores && typeof scores === 'object') {
              let weighted = 0;
              let totalW = 0;
              for (const [k, p] of Object.entries(scores)) {
                const name = String(k).trim();
                const price = pricesMap[name];
                if (typeof p === 'number' && typeof price === 'number') {
                  weighted += price * p;
                  totalW += p;
                }
              }
              if (totalW > 0) {
                (data as any).suggestedPricePerKg = Math.round(weighted * 100) / 100;
              }
            }
            // Fallback: exact label match
            if ((data as any).suggestedPricePerKg == null) {
              const label = String((data?.final_quality || '')).trim();
              const p = pricesMap[label];
              if (typeof p === 'number') (data as any).suggestedPricePerKg = p;
            }
          } catch (e) {
            // ignore pricing lookup errors; still return ML data
          }
          console.log('[quality] ML ok from', url);
          return res.json(data);
        }
        const text = await r.text();
        lastErr = { status: r.status, body: text, url };
        console.warn('[quality] ML non-200', lastErr);
      } catch (e: any) {
        lastErr = { message: e?.message || String(e), url };
        console.error('[quality] ML fetch error', lastErr);
      }
    }
    console.error('[quality] ML service error after candidates', lastErr);
    return res.status(502).json({ message: 'ML service error', ...lastErr });
  } catch (err: any) {
    return res.status(500).json({ message: 'failed to analyze image', error: err?.message || String(err) });
  }
});

export default router;

