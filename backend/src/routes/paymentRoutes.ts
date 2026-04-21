import { Router } from 'express';
import { initiateChapaPayment, chapaWebhook, returnPage, verifyPayment } from '../controllers/paymentController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Initiating a payment requires a valid customer session
router.post('/initiate', authenticate, initiateChapaPayment);
router.get('/verify/:bookingId', authenticate, verifyPayment);

// Webhook is called by Chapa's servers (no user token) — must stay public
router.post('/webhook', chapaWebhook);
router.get('/webhook', chapaWebhook); // heartbeat

// Return page is a browser redirect from Chapa — no token available
router.get('/return', returnPage);

export default router;
