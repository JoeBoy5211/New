
import { Request, Response } from 'express';
import { getFileUrl, deleteFile } from '../config/upload';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Extend Express Request type to include multer file
interface MulterRequest extends Request {
    file?: any;
}

// Upload caterer cover image
export const uploadCoverImage = async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const catererId = req.body.caterer_id;
        if (!catererId) {
            deleteFile(req.file.filename);
            return res.status(400).json({ success: false, message: 'Caterer ID is required' });
        }

        // Get old cover image to delete
        const [caterers] = await pool.query<RowDataPacket[]>(
            'SELECT cover_image FROM caterers WHERE id = ?',
            [catererId]
        );

        if (caterers.length === 0) {
            deleteFile(req.file.filename);
            return res.status(404).json({ success: false, message: 'Caterer not found' });
        }

        // Delete old image if exists
        const oldImage = caterers[0].cover_image;
        if (oldImage && oldImage.startsWith('/uploads/')) {
            const oldFilename = oldImage.split('/uploads/')[1];
            deleteFile(oldFilename);
        }

        // Update database with new image URL
        const imageUrl = getFileUrl(req.file.filename);
        await pool.query(
            'UPDATE caterers SET cover_image = ? WHERE id = ?',
            [imageUrl, catererId]
        );

        res.json({
            success: true,
            message: 'Cover image uploaded successfully',
            data: { imageUrl }
        });
    } catch (error) {
        console.error('[UPLOAD] Cover image error:', error);
        if (req.file) {
            deleteFile(req.file.filename);
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Upload menu item image
export const uploadMenuItemImage = async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const menuItemId = req.body.menu_item_id;
        if (!menuItemId) {
            deleteFile(req.file.filename);
            return res.status(400).json({ success: false, message: 'Menu item ID is required' });
        }

        // Get old image to delete
        const [menuItems] = await pool.query<RowDataPacket[]>(
            'SELECT image FROM menu_items WHERE id = ?',
            [menuItemId]
        );

        if (menuItems.length === 0) {
            deleteFile(req.file.filename);
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        // Delete old image if exists
        const oldImage = menuItems[0].image;
        if (oldImage && oldImage.startsWith('/uploads/')) {
            const oldFilename = oldImage.split('/uploads/')[1];
            deleteFile(oldFilename);
        }

        // Update database with new image URL
        const imageUrl = getFileUrl(req.file.filename);
        await pool.query(
            'UPDATE menu_items SET image = ? WHERE id = ?',
            [imageUrl, menuItemId]
        );

        res.json({
            success: true,
            message: 'Menu item image uploaded successfully',
            data: { imageUrl }
        });
    } catch (error) {
        console.error('[UPLOAD] Menu item image error:', error);
        if (req.file) {
            deleteFile(req.file.filename);
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Upload profile avatar
export const uploadAvatar = async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.body.user_id;
        if (!userId) {
            deleteFile(req.file.filename);
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Get old avatar to delete
        const [profiles] = await pool.query<RowDataPacket[]>(
            'SELECT avatar_url FROM profiles WHERE user_id = ?',
            [userId]
        );

        if (profiles.length === 0) {
            deleteFile(req.file.filename);
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Delete old avatar if exists
        const oldAvatar = profiles[0].avatar_url;
        if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
            const oldFilename = oldAvatar.split('/uploads/')[1];
            deleteFile(oldFilename);
        }

        // Update database with new avatar URL
        const imageUrl = getFileUrl(req.file.filename);
        await pool.query(
            'UPDATE profiles SET avatar_url = ? WHERE user_id = ?',
            [imageUrl, userId]
        );

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: { imageUrl }
        });
    } catch (error) {
        console.error('[UPLOAD] Avatar error:', error);
        if (req.file) {
            deleteFile(req.file.filename);
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
