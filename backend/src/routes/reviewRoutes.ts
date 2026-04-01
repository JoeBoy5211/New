import { Router } from 'express';
import { createReview, getCatererReviews } from '../controllers/reviewController';

const router = Router();

router.post('/', createReview);
router.get('/caterer/:caterer_id', getCatererReviews);

export default router;
