
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
    toggleServiceStatus,
    uploadVerificationDocuments,
    addVendorUnavailability,
    deleteVendorUnavailability
} from '../controllers/vendorController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { cloudinaryUpload } from '../config/cloudinary';
import { checkSubscriptionLimit } from '../middleware/subscriptionLimits';

const router = Router();

// All vendor routes require authentication AND vendor role
router.use(authenticate, authorize('vendor'));

router.get('/dashboard/:userId', getVendorDashboard);
router.get('/analytics/:userId', getVendorAnalytics);
router.patch('/bookings/:bookingId/status', checkSubscriptionLimit('bookings'), updateBookingStatus);
router.post('/menu', checkSubscriptionLimit('menu_items'), addMenuItem);
router.patch('/menu/:itemId', updateMenuItem);
router.delete('/menu/:itemId', deleteMenuItem);
router.patch('/profile/:catererId', updateCatererProfile);
router.post('/services', cloudinaryUpload.array('images', 10), checkSubscriptionLimit('services'), addVendorService);
router.delete('/services/:serviceId', deleteVendorService);
router.patch('/services/:serviceId/toggle', toggleServiceStatus);
router.patch('/profile/:catererId/toggle', toggleCatererStatus);
router.post('/verification/:catererId', cloudinaryUpload.fields([
    { name: 'competencyCertificate', maxCount: 1 },
    { name: 'tradeLicense', maxCount: 1 }
]), uploadVerificationDocuments);
router.post('/unavailability', addVendorUnavailability);
router.delete('/unavailability/:id', deleteVendorUnavailability);

export default router;
