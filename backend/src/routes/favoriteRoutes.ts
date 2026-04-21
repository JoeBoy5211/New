
import { Router } from 'express';
import { toggleFavorite, getFavorites, checkFavorite } from '../controllers/favoriteController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Favorites require a logged-in user
router.use(authenticate);

router.post('/toggle', toggleFavorite);
router.get('/user/:userId', getFavorites);
router.get('/check', checkFavorite);

export default router;
