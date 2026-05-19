import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Protect all admin routes
router.use(authenticate, authorize(['admin']));

router.post('/price-range', adminController.addPriceRange);
router.get('/price-range/:crop', adminController.getPriceHistory);
router.get('/pending-listings', adminController.getPendingListings);
router.patch('/approve/:id', adminController.approveListing);
router.patch('/reject/:id', adminController.rejectListing);
router.patch('/modify-price/:id', adminController.modifyListingPrice);

export default router;
