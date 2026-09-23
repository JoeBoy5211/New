
import { Router } from 'express';
import { getCaterers, getCatererById } from '../controllers/catererController';

const router = Router();

router.get('/', getCaterers);
router.get('/:id', getCatererById);

export default router;
