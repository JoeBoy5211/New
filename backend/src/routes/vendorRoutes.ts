
import { Router } from 'express';
import {
    getVendorDashboard,
    updateBookingStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateCatererProfile
} from '../controllers/vendorController';

const router = Router();

router.get('/dashboard/:userId', getVendorDashboard);
router.patch('/bookings/:bookingId/status', updateBookingStatus);
router.post('/menu', addMenuItem);
router.patch('/menu/:itemId', updateMenuItem);
router.delete('/menu/:itemId', deleteMenuItem);
router.patch('/profile/:catererId', updateCatererProfile);

export default router;
