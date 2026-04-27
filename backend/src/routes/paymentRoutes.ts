import { Router } from 'express';
import { initiateChapaPayment, chapaWebhook, returnPage } from '../controllers/paymentController';
import { subscriptionReturnPage } from '../controllers/vendorSubscriptionController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Initiating a payment requires a valid customer session
router.post('/initiate', authenticate, initiateChapaPayment);

// Webhook is called by Chapa's servers (no user token) — must stay public
router.post('/webhook', chapaWebhook);
router.get('/webhook', chapaWebhook); // heartbeat

// Return page is a browser redirect from Chapa — no token available
router.get('/return', returnPage);
router.get('/return-subscription', subscriptionReturnPage);

export default router;
