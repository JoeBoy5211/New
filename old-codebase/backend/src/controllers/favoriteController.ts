
import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

export const toggleFavorite = async (req: Request, res: Response) => {
    const { userId, catererId } = req.body;

    if (!userId || !catererId) {
        return res.status(400).json({ success: false, message: 'User ID and Caterer ID are required' });
    }

    try {
        // Check if favorite exists
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM favorites WHERE user_id = ? AND caterer_id = ?',
            [userId, catererId]
        );

        if (existing.length > 0) {
            // Remove favorite
            await pool.query('DELETE FROM favorites WHERE user_id = ? AND caterer_id = ?', [userId, catererId]);
            return res.json({ success: true, message: 'Removed from favorites', isFavorited: false });
        } else {
            // Add favorite
            const id = crypto.randomUUID();
            await pool.query(
                'INSERT INTO favorites (id, user_id, caterer_id) VALUES (?, ?, ?)',
                [id, userId, catererId]
            );
            return res.json({ success: true, message: 'Added to favorites', isFavorited: true });
        }
    } catch (error) {
        console.error('[FAVORITE] Toggle error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getFavorites = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        // Get all favorited caterers for this user
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT c.*, 
                   COALESCE((SELECT AVG(rating) FROM reviews WHERE caterer_id = c.id), 0) as ratingValue,
                   COALESCE((SELECT COUNT(*) FROM reviews WHERE caterer_id = c.id), 0) as reviewCount
            FROM favorites f
            JOIN caterers c ON f.caterer_id = c.id
            WHERE f.user_id = ?
        `, [userId]);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[FAVORITE] Get favorites error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const checkFavorite = async (req: Request, res: Response) => {
    const { userId, catererId } = req.query;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM favorites WHERE user_id = ? AND caterer_id = ?',
            [userId, catererId]
        );

        res.json({ success: true, isFavorited: rows.length > 0 });
    } catch (error) {
        console.error('[FAVORITE] Check error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
