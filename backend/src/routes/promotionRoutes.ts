
import { Router } from 'express';
import { getPromotions, addPromotion, deletePromotion, toggleLike, toggleSave, toggleFollow, incrementShareCount, getVendorPromotionStats, getComments, addComment } from '../controllers/promotionController';
import { cloudinaryUpload } from '../config/cloudinary';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// ── Public (no auth required) ──────────────────────────────────────────────
router.get('/', getPromotions);
router.get('/:id/comments', getComments);
router.post('/:id/share', incrementShareCount); // sharing does not require an account

// ── Authenticated (any logged-in user) ────────────────────────────────────
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/save', authenticate, toggleSave);
router.post('/:catererId/follow', authenticate, toggleFollow);
router.post('/:id/comments', authenticate, addComment);

// ── Vendor only ────────────────────────────────────────────────────────────
router.get('/stats/:vendorId', authenticate, authorize('vendor'), getVendorPromotionStats);
router.post('/', authenticate, authorize('vendor'), cloudinaryUpload.single('media'), addPromotion);
router.delete('/:id/:vendorId', authenticate, authorize('vendor'), deletePromotion);

export default router;
