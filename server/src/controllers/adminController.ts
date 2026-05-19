import { Request, Response } from 'express';
import PriceRange from '../models/PriceRange';
import Listing from '../models/Listing';

// Price Management
export const addPriceRange = async (req: Request, res: Response) => {
    try {
        const { cropName, minPrice, maxPrice, avgPrice, date } = req.body;
        // Upsert to ensure one record per crop per day? Or just create?
        // User requirement: "Update price daily", "Store historical price records".
        // We'll create a new record or update existing for the day.
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(targetDate.getDate() + 1);

        const priceRange = await PriceRange.findOneAndUpdate(
            {
                cropName,
                date: { $gte: targetDate, $lt: nextDay }
            },
            { cropName, minPrice, maxPrice, avgPrice, date: targetDate },
            { upsert: true, new: true }
        );
        res.json(priceRange);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getPriceHistory = async (req: Request, res: Response) => {
    try {
        const { crop } = req.params;
        // Get last 30 days or all history?
        const history = await PriceRange.find({ cropName: { $regex: new RegExp(`^${crop}$`, 'i') } })
            .sort({ date: 1 })
            .limit(30); // Limit to recent history for chart

        // Also return current day's (last record) stats specifically if needed, 
        // but array is fine for chart.

        // If no history, return empty
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Listing Approval
export const getPendingListings = async (req: Request, res: Response) => {
    try {
        const listings = await Listing.find({ status: 'PENDING_APPROVAL' })
            .populate('farmerId', 'name email');
        res.json(listings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const approveListing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findByIdAndUpdate(
            id,
            { status: 'APPROVED' },
            { new: true }
        );
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.json(listing);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const rejectListing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findByIdAndUpdate(
            id,
            { status: 'REJECTED' },
            { new: true }
        );
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.json(listing);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const modifyListingPrice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { suggestedPrice } = req.body;
        const listing = await Listing.findByIdAndUpdate(
            id,
            { suggestedPrice, adminPriceOverride: suggestedPrice },
            { new: true }
        );
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.json(listing);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
