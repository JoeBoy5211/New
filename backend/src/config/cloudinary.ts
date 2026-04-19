
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder based on route or fieldname
        let folder = 'catering_app/others';
        if (file.fieldname === 'image') {
            if (req.path.includes('cover-image')) folder = 'catering_app/covers';
            else if (req.path.includes('menu-item-image')) folder = 'catering_app/menu_items';
            else if (req.path.includes('avatar')) folder = 'catering_app/avatars';
        }

        return {
            folder: folder,
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov'],
            resource_type: 'auto', // Support both images and videos
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        };
    },
});

export const cloudinaryUpload = multer({ storage: storage });
export { cloudinary };
