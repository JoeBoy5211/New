
import { Router } from 'express';
import { createBooking, getCustomerBookings, getBookingById, updateBookingStatus } from '../controllers/bookingController';

const router = Router();

router.post('/', createBooking);
router.get('/customer/:customerId', getCustomerBookings);
router.get('/:id', getBookingById);
router.patch('/:id/status', updateBookingStatus);

export default router;
