
import { Router } from 'express';
import { createBooking, getCustomerBookings, getBookingById, updateBookingStatus } from '../controllers/bookingController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All booking routes require a valid session
router.post('/', authenticate, authorize('customer'), createBooking);
router.get('/customer/:customerId', authenticate, getCustomerBookings);
router.get('/:id', authenticate, getBookingById);
router.patch('/:id/status', authenticate, authorize('vendor', 'admin'), updateBookingStatus);

export default router;
