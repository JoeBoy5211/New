
import { Router } from 'express';
import { toggleFavorite, getFavorites, checkFavorite } from '../controllers/favoriteController';

const router = Router();

router.post('/toggle', toggleFavorite);
router.get('/user/:userId', getFavorites);
router.get('/check', checkFavorite);

export default router;
