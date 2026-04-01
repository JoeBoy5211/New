
import { Router } from 'express';
import { getPromotions, addPromotion, deletePromotion, toggleLike, toggleSave, toggleFollow, incrementShareCount, getVendorPromotionStats, getComments, addComment } from '../controllers/promotionController';
import { upload } from '../config/upload';

const router = Router();

router.get('/', getPromotions);
router.post('/', upload.single('media'), addPromotion);
router.get('/stats/:vendorId', getVendorPromotionStats);
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.delete('/:id/:vendorId', deletePromotion);

router.post('/:id/like', toggleLike);
router.post('/:id/save', toggleSave);
router.post('/:catererId/follow', toggleFollow);
router.post('/:id/share', incrementShareCount);

export default router;
