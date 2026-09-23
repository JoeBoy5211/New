
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
        const isVideo = file.mimetype.startsWith('video/');

        // Determine folder based on route or fieldname
        let folder = 'catering_app/others';
        if (req.path.includes('cover-image')) folder = 'catering_app/covers';
        else if (req.path.includes('menu-item-image')) folder = 'catering_app/menu_items';
        else if (req.path.includes('avatar')) folder = 'catering_app/avatars';
        else if (req.path.includes('/vendor/services')) folder = 'catering_app/services';
        else if (file.fieldname === 'competencyCertificate' || file.fieldname === 'tradeLicense') folder = 'catering_app/documents';
        else if (isVideo) folder = 'catering_app/videos';
        else folder = 'catering_app/promotions';

        const params: any = {
            folder,
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov', 'pdf'],
            resource_type: 'auto',
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        };

        // For videos: trigger Cloudinary to eagerly generate HLS adaptive streaming
        // sp_auto = streaming profile auto, f_auto = format auto, q_auto:eco = eco quality
        if (isVideo) {
            params.eager = [
                { streaming_profile: 'auto', format: 'm3u8' }
            ];
            params.eager_async = true; // Don't block the upload response
        }

        return params;
    },
});

export const cloudinaryUpload = multer({ storage: storage });

/**
 * Transform a raw Cloudinary video URL into an HLS manifest URL.
 * Input:  https://res.cloudinary.com/<cloud>/video/upload/v123/path/file.mp4
 * Output: https://res.cloudinary.com/<cloud>/video/upload/sp_auto,f_auto,q_auto:eco/v123/path/file.m3u8
 *
 * Falls back to the original URL for non-Cloudinary or image URLs.
 */
export function getCloudinaryVideoUrl(rawUrl: string): string {
    if (!rawUrl || !rawUrl.includes('res.cloudinary.com')) return rawUrl;
    if (!rawUrl.includes('/video/upload/')) return rawUrl; // leave images alone

    return rawUrl
        // Insert transformation string after /video/upload/
        .replace('/video/upload/', '/video/upload/sp_auto,f_auto,q_auto:eco/')
        // Replace the file extension with .m3u8 for HLS
        .replace(/\.(mp4|webm|mov|avi)(\?.*)?$/, '.m3u8');
}

export { cloudinary };
