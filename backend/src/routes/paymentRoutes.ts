import { Router } from 'express';
import { initiateChapaPayment, chapaWebhook, returnPage } from '../controllers/paymentController';

const router = Router();

router.post('/initiate', initiateChapaPayment);
router.post('/webhook', chapaWebhook);
router.get('/return', returnPage);
// Allow GET to webhook for basic heartbeat
router.get('/webhook', chapaWebhook);

export default router;
