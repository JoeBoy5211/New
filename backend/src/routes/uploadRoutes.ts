
import express from 'express';
import { cloudinaryUpload } from '../config/cloudinary';
import { uploadCoverImage, uploadMenuItemImage, uploadAvatar } from '../controllers/uploadController';

const router = express.Router();

// Upload caterer cover image
router.post('/cover-image', cloudinaryUpload.single('image'), uploadCoverImage);

// Upload menu item image
router.post('/menu-item-image', cloudinaryUpload.single('image'), uploadMenuItemImage);

// Upload user avatar
router.post('/avatar', cloudinaryUpload.single('image'), uploadAvatar);


export default router;
