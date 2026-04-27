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
    updateUserRole,
    getAllAdmins,
    promoteToAdmin,
    deleteAdmin,
    getAdminNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getSubscriptionAnalytics
} from '../controllers/adminController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { superAdminOnly } from '../middleware/superAdminOnly';

const router = Router();

// All admin routes require authentication AND admin role
router.use(authenticate, authorize('admin'));

// Stats
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/subscription-analytics', getSubscriptionAnalytics);

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

// Admin Management (Super Admin Only)
router.get('/admins', superAdminOnly, getAllAdmins);
router.post('/users/:userId/promote', superAdminOnly, promoteToAdmin);
router.delete('/admins/:adminId', superAdminOnly, deleteAdmin);

// Notifications (All Admins)
router.get('/notifications', getAdminNotifications);
router.patch('/notifications/:notificationId/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);

export default router;
