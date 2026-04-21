
import { Router } from 'express';
import {
    getVendorDashboard,
    updateBookingStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateCatererProfile
} from '../controllers/vendorController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All vendor routes require authentication AND vendor role
router.use(authenticate, authorize('vendor'));

router.get('/dashboard/:userId', getVendorDashboard);
router.patch('/bookings/:bookingId/status', updateBookingStatus);
router.post('/menu', addMenuItem);
router.patch('/menu/:itemId', updateMenuItem);
router.delete('/menu/:itemId', deleteMenuItem);
router.patch('/profile/:catererId', updateCatererProfile);

export default router;
