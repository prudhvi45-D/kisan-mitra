import { Router } from 'express';
import * as listingController from '../controllers/listingController';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// Create listing (with PENDING_APPROVAL status logic)
// Helper to handle image array upload
router.post('/create',
    authenticate,
    authorize(['farmer']),
    // We might handle file upload here if the client sends files directly to this endpoint.
    // The user requirement says "POST /api/listings/create". 
    // Existing Upload.tsx sends FormData with 'images'.
    // So we should include multer here.
    upload.array('images', 5),
    listingController.createListing
);

// Analyze image for price suggestion
// This endpoint receives the image and crop type, calls ML service, returns quality and suggested price.
// User requirement: POST /ml/analyze (implied proxy or direct). 
// We'll expose this as /api/listings/analyze for the client to call.
router.post('/analyze',
    authenticate,
    authorize(['farmer']),
    upload.array('images', 1), // Expect 1 image for analysis usually, or multiple? "After image upload...". 
    listingController.analyzeImageAndSuggestPrice
);

// Get Market Prices
router.get('/market-prices',
    authenticate,
    // accessible to all authenticated users
    listingController.getMarketPrices
);

export default router;
