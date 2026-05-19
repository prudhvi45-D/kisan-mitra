import { Request, Response } from 'express';
import Listing from '../models/Listing';
import PriceRange from '../models/PriceRange';
import axios from 'axios';
import { config } from '../config';

// Import fs and path for file handling if needed, similar to listings.ts
// But here we might just assume we pass image URLs or handle file upload in the route before calling controller.
// existing listings.ts handles upload using multer in the route.

import cloudinary from '../config/cloudinary';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

export const createListing = async (req: Request, res: Response) => {
    try {
        const { title, cropType, quantity, unit, location, suggestedPrice, qualityScore, qualityLabel, marketPriceSnapshot } = req.body;
        const user = (req as any).user;

        // Process uploaded images
        const files = (req as any).files as any[] || [];
        const imagePaths: string[] = [];

        // Upload to Cloudinary
        for (const file of files) {
            try {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'agri-connect/listings',
                    public_id: `listing_${Date.now()}_${file.filename}`
                });
                imagePaths.push(result.secure_url);

                // Remove local file after upload
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete local file:', err);
                });
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                // Try to clean up even if upload failed
                fs.unlink(file.path, () => { });
            }
        }

        const newListing = await Listing.create({
            farmerId: user.id,
            title,
            cropType,
            quantity: Number(quantity),
            unit,
            location,
            images: imagePaths,
            status: 'PENDING_APPROVAL',
            suggestedPrice: suggestedPrice ? Number(suggestedPrice) : 0,
            qualityScore: qualityScore ? Number(qualityScore) : 0,
            qualityLabel: qualityLabel || '',
            marketPriceSnapshot: marketPriceSnapshot ? Number(marketPriceSnapshot) : 0
        });

        res.json(newListing);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const analyzeImageAndSuggestPrice = async (req: Request, res: Response) => {
    console.log('[Analyze] Request received');
    try {
        const { cropName } = req.body;
        const files = (req as any).files as any[];

        if (!files || files.length === 0) {
            console.error('[Analyze] No files uploaded');
            return res.status(400).json({ message: 'No images uploaded' });
        }
        console.log(`[Analyze] Processing file: ${files[0].path}`);

        // 1. Get Price Data (fetch min, max, avg)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const priceData = await PriceRange.findOne({
            cropName: { $regex: new RegExp(`^${cropName}$`, 'i') },
            date: { $gte: today }
        }).sort({ date: -1 });

        const minPrice = priceData ? priceData.minPrice : 0;
        const avgPrice = priceData ? priceData.avgPrice : 0;
        const maxPrice = priceData ? priceData.maxPrice : 0;
        console.log(`[Analyze] Prices for ${cropName}: min=${minPrice}, avg=${avgPrice}, max=${maxPrice}`);

        // 2. Call ML Service
        let qualityScore = 0;
        let finalQuality = 'Good'; // default

        const form = new FormData();
        const file = files[0];

        if (!fs.existsSync(file.path)) {
            console.error(`[Analyze] File does not exist at path: ${file.path}`);
            throw new Error('Uploaded file not found');
        }

        // Use fs.createReadStream for better efficiency with form-data
        form.append('file', fs.createReadStream(file.path), {
            filename: file.originalname,
            contentType: file.mimetype
        });

        console.log(`[Analyze] Calling ML service at ${config.mlServiceUrl}/infer`);
        let response;
        try {
            response = await fetch(`${config.mlServiceUrl}/infer`, {
                method: 'POST',
                body: form,
                headers: form.getHeaders()
            });
            console.log(`[Analyze] ML Service responded with status: ${response.status}`);
        } catch (e) {
            console.error("[Analyze] ML Service call failed/network error", e);
        }

        // Clean up local file after analysis
        fs.unlink(file.path, (err) => {
            if (err) console.error('Failed to delete local analysis file:', err);
        });

        if (response) {
            if (!response.ok) {
                console.error(`ML Service returned error: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error('ML Response:', text);
            } else {
                const data = await response.json() as any;
                console.log('[Analyze] ML Data:', JSON.stringify(data));

                // Read final_quality label (Fresh / Good / Rotten)
                if (data && data.final_quality) {
                    const q = String(data.final_quality).toLowerCase();
                    if (q === 'fresh' || q.includes('fresh')) {
                        finalQuality = 'Fresh';
                    } else if (q === 'good' || q.includes('good')) {
                        finalQuality = 'Good';
                    } else {
                        finalQuality = 'Rotten';
                    }
                }

                // Derive qualityScore from vit_class.scores (where ML actually puts them)
                const rawScores: Record<string, number> =
                    data.vit_class?.scores || data.final_scores || {};
                const freshScore = rawScores['Fresh'] ?? rawScores['Good/Fresh'] ?? 0;
                const goodScore  = rawScores['Good']  ?? rawScores['Rotten/Spoiled'] ?? 0;
                const rottenScore = rawScores['Rotten'] ?? rawScores['Completely Bad/Decomposed'] ?? 0;
                if (finalQuality === 'Fresh')  qualityScore = 70 + freshScore  * 30;
                else if (finalQuality === 'Good') qualityScore = 40 + goodScore * 30;
                else qualityScore = Math.max(rottenScore * 40, 1);
            }
        }

        // 3. Assign price: Fresh → max, Good → avg, Rotten → min (same as Quality page)
        let suggestedPrice: number;
        if (finalQuality === 'Fresh') {
            suggestedPrice = maxPrice > 0 ? maxPrice : avgPrice * 1.2;
        } else if (finalQuality === 'Good') {
            suggestedPrice = avgPrice;
        } else {
            suggestedPrice = minPrice > 0 ? minPrice : avgPrice * 0.8;
        }

        console.log(`[Analyze] Quality: ${finalQuality} (score=${qualityScore.toFixed(1)}), Suggested: ${suggestedPrice}`);

        res.json({
            qualityScore,
            finalQuality,
            suggestedPrice,
            minPrice,
            avgPrice,
            maxPrice,
            priceData
        });

    } catch (error: any) {
        console.error('[Analyze] Controller Error:', error);
        // Clean up files in case of error if not already done
        if ((req as any).files) {
            ((req as any).files as any[]).forEach(f => fs.unlink(f.path, () => { }));
        }
        res.status(500).json({ message: error.message });
    }
};

export const getMarketPrices = async (req: Request, res: Response) => {
    try {
        const apiKey = req.query.apiKey as string || '579b464db66ec23bdd0000018a744841a4a64156517a6b08b620cc6a';
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

        const dateObj = new Date();
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        const response = await axios.get(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${limit}&filters[arrival_date]=${formattedDate}`);

        if (response.data && response.data.records) {
            res.json(response.data);
        } else {
            res.status(404).json({ message: 'No data found' });
        }

    } catch (error: any) {
        console.error('Error fetching market prices:', error.message);
        res.status(500).json({ message: 'Failed to fetch market prices', error: error.message });
    }
};
