import { Router } from 'express';
import {
    getStats,
    getAnalytics,
    getCaterers,
    getCustomers,
    getBookings,
    getReviews,
    approveCaterer,
    rejectCaterer,
    deleteReview,
    updateUserRole
} from '../controllers/adminController';

const router = Router();

// Stats
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);

// Data lists
router.get('/caterers', getCaterers);
router.get('/customers', getCustomers);
router.get('/bookings', getBookings);
router.get('/reviews', getReviews);

// Actions
router.post('/caterers/:catererId/approve', approveCaterer);
router.delete('/caterers/:catererId', rejectCaterer);
router.delete('/reviews/:reviewId', deleteReview);
router.patch('/users/:userId/role', updateUserRole);

export default router;
