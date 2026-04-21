
import express from 'express';
import { cloudinaryUpload } from '../config/cloudinary';
import { uploadCoverImage, uploadMenuItemImage, uploadAvatar } from '../controllers/uploadController';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

// All upload routes require a valid session
router.use(authenticate);

// Upload caterer cover image
router.post('/cover-image', cloudinaryUpload.single('image'), uploadCoverImage);

// Upload menu item image
router.post('/menu-item-image', cloudinaryUpload.single('image'), uploadMenuItemImage);

// Upload user avatar
router.post('/avatar', cloudinaryUpload.single('image'), uploadAvatar);

export default router;
