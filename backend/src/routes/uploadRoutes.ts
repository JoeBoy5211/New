
import express from 'express';
import { upload } from '../config/upload';
import { uploadCoverImage, uploadMenuItemImage, uploadAvatar } from '../controllers/uploadController';

const router = express.Router();

// Upload caterer cover image
router.post('/cover-image', upload.single('image'), uploadCoverImage);

// Upload menu item image
router.post('/menu-item-image', upload.single('image'), uploadMenuItemImage);

// Upload user avatar
router.post('/avatar', upload.single('image'), uploadAvatar);

export default router;
