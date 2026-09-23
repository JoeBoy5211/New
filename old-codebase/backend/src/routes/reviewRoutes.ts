import { Router } from 'express';
import { createReview, getCatererReviews } from '../controllers/reviewController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Reading reviews is public; writing requires a session
router.get('/caterer/:caterer_id', getCatererReviews);
router.post('/', authenticate, createReview);

export default router;
