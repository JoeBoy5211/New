
import { Router } from 'express';
import {
    getVendorDashboard,
    updateBookingStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateCatererProfile,
    getVendorAnalytics,
    addVendorService,
    deleteVendorService,
    toggleCatererStatus,
    toggleServiceStatus
} from '../controllers/vendorController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { cloudinaryUpload } from '../config/cloudinary';

const router = Router();

// All vendor routes require authentication AND vendor role
router.use(authenticate, authorize('vendor'));

router.get('/dashboard/:userId', getVendorDashboard);
router.get('/analytics/:userId', getVendorAnalytics);
router.patch('/bookings/:bookingId/status', updateBookingStatus);
router.post('/menu', addMenuItem);
router.patch('/menu/:itemId', updateMenuItem);
router.delete('/menu/:itemId', deleteMenuItem);
router.patch('/profile/:catererId', updateCatererProfile);
router.post('/services', cloudinaryUpload.array('images', 10), addVendorService);
router.delete('/services/:serviceId', deleteVendorService);
router.patch('/services/:serviceId/toggle', toggleServiceStatus);
router.patch('/profile/:catererId/toggle', toggleCatererStatus);

export default router;
