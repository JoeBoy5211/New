import { Router } from 'express';
import {
    getVendorSubscription,
    initiateSubscriptionPayment,
    verifySubscriptionPayment,
    subscriptionReturnPage
} from '../controllers/vendorSubscriptionController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All subscription routes require authentication AND vendor role
router.use(authenticate, authorize('vendor'));

router.get('/status', getVendorSubscription);
router.post('/initiate-payment', initiateSubscriptionPayment);
router.get('/verify-payment/:id', verifySubscriptionPayment);

export default router;
