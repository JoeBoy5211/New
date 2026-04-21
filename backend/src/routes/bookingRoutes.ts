
import { Router } from 'express';
import { createBooking, getCustomerBookings, getBookingById, updateBookingStatus } from '../controllers/bookingController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { verifyAndCompleteBooking } from '../controllers/paymentController';

const router = Router();

// All booking routes require a valid session
router.post('/', authenticate, authorize('customer'), createBooking);
router.get('/customer/:customerId', authenticate, getCustomerBookings);
router.get('/:id', authenticate, getBookingById);
// Vendor/admin can update any status; customers use the dedicated payment verify endpoint
router.patch('/:id/status', authenticate, authorize('vendor', 'admin'), updateBookingStatus);
// Called by the payment success page — verifies with Chapa and marks completed
router.post('/:id/verify-payment', authenticate, verifyAndCompleteBooking);

export default router;
