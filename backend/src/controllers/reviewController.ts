import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';

export const createReview = async (req: Request, res: Response) => {
    const { booking_id, customer_id, caterer_id, rating, comment } = req.body;

    if (!booking_id || !customer_id || !caterer_id || !rating) {
        return res.status(400).json({ success: false, message: 'Missing required review fields' });
    }

    try {
        // Check if the booking is completed before allowing a review
        const [bookings] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM bookings WHERE id = ? AND status = "completed"',
            [booking_id]
        );

        if (bookings.length === 0) {
            // Check if it's confirmed (paid but maybe not officially "completed" by vendor yet)
            // But usually vendor marks as "completed" after event
            const [confirmed] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM bookings WHERE id = ? AND status = "confirmed"',
                [booking_id]
            );
            
            if (confirmed.length === 0) {
                return res.status(403).json({ success: false, message: 'Only completed or paid bookings can be reviewed.' });
            }
        }

        // Check if user already reviewed this booking
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM reviews WHERE booking_id = ?',
            [booking_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });
        }

        const id = crypto.randomUUID();
        await pool.query(
            'INSERT INTO reviews (id, booking_id, customer_id, caterer_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [id, booking_id, customer_id, caterer_id, rating, comment || '']
        );

        res.status(201).json({ success: true, message: 'Review submitted successfully!', data: { id } });
    } catch (error) {
        console.error('[REVIEW] Error creating review:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getCatererReviews = async (req: Request, res: Response) => {
    const { caterer_id } = req.params;
    try {
        const [reviews] = await pool.query<RowDataPacket[]>(
            `SELECT r.*, p.name as customerName 
             FROM reviews r 
             LEFT JOIN profiles p ON r.customer_id = p.user_id 
             WHERE r.caterer_id = ? 
             ORDER BY r.created_at DESC`,
            [caterer_id]
        );
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('[REVIEW] Error getting reviews:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
