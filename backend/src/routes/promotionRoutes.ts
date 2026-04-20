
import { Router } from 'express';
import { getPromotions, addPromotion, deletePromotion, toggleLike, toggleSave, toggleFollow, incrementShareCount, getVendorPromotionStats, getComments, addComment } from '../controllers/promotionController';
import { cloudinaryUpload } from '../config/cloudinary';

const router = Router();

router.get('/', getPromotions);
// Use Cloudinary upload so the backend never writes video bytes to disk
router.post('/', cloudinaryUpload.single('media'), addPromotion);
router.get('/stats/:vendorId', getVendorPromotionStats);
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.delete('/:id/:vendorId', deletePromotion);

router.post('/:id/like', toggleLike);
router.post('/:id/save', toggleSave);
router.post('/:catererId/follow', toggleFollow);
router.post('/:id/share', incrementShareCount);

export default router;
