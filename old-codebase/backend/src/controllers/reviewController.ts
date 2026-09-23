import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';

export const createReview = async (req: Request, res: Response) => {
    const { booking_id, customer_id, caterer_id, rating, comment } = req.body;

    console.log('[REVIEW] Attempting to create review:', { booking_id, customer_id, caterer_id, rating });

    if (!booking_id || !customer_id || !caterer_id || !rating) {
        return res.status(400).json({ success: false, message: 'Missing required review fields' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if the booking is completed or confirmed before allowing a review
        const [bookings] = await connection.query<RowDataPacket[]>(
            'SELECT id, status FROM bookings WHERE id = ?',
            [booking_id]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const bookingStatus = bookings[0].status;
        if (bookingStatus !== 'completed' && bookingStatus !== 'accepted') {
            // Note: 'accepted' bookings might be paid but not yet 'completed'
            await connection.rollback();
            return res.status(403).json({ success: false, message: `Current booking status (${bookingStatus}) does not allow reviews.` });
        }

        // Check if user already reviewed this booking
        const [existing] = await connection.query<RowDataPacket[]>(
            'SELECT id FROM reviews WHERE booking_id = ?',
            [booking_id]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });
        }

        // Generate ID with fallback
        let id;
        try {
            id = crypto.randomUUID();
        } catch (e) {
            id = crypto.randomBytes(16).toString('hex');
        }

        // 1. Insert review
        await connection.query(
            'INSERT INTO reviews (id, booking_id, customer_id, caterer_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [id, booking_id, customer_id, caterer_id, rating, comment || '']
        );

        // 2. Update caterer rating and review count
        // We recalculate the average to ensure accuracy
        const [avgRes] = await connection.query<RowDataPacket[]>(
            'SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE caterer_id = ?',
            [caterer_id]
        );

        const newRating = avgRes[0].avgRating || rating;
        const newCount = avgRes[0].count || 1;

        await connection.query(
            'UPDATE caterers SET rating = ?, review_count = ? WHERE id = ?',
            [newRating, newCount, caterer_id]
        );

        await connection.commit();
        console.log('[REVIEW] Review created successfully for booking:', booking_id);
        res.status(201).json({ success: true, message: 'Review submitted successfully!', data: { id } });
    } catch (error: any) {
        await connection.rollback();
        console.error('[REVIEW] Error creating review:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        connection.release();
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
