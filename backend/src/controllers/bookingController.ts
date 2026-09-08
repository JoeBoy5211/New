
import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';
import { notifyAllAdmins } from './adminController';

export const createBooking = async (req: Request, res: Response) => {
    const {
        customer_id,
        caterer_id,
        event_date,
        event_type,
        guest_count,
        venue,
        contact_phone,
        special_requests,
        service_type,
        total_amount,
        items // Array of { menu_item_id, quantity, unit_price }
    } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check caterer limits and availability
        const [caterers] = await connection.query<RowDataPacket[]>(
            'SELECT min_guests, max_guests, max_bookings_per_day, is_active FROM caterers WHERE id = ?',
            [caterer_id]
        );

        if (caterers.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Caterer not found' });
        }

        const caterer = caterers[0];
        if (caterer.is_active === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'This caterer is currently not accepting bookings.' });
        }

        if (guest_count < caterer.min_guests || guest_count > caterer.max_guests) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
                success: false, 
                message: `Guest count must be between ${caterer.min_guests} and ${caterer.max_guests}` 
            });
        }

        // Validate date availability (blackout dates & daily capacity)
        if (event_date) {
            const dateStr = event_date.split('T')[0];
            const dateObj = new Date(dateStr + 'T00:00:00');
            const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

            // 1. Check temporary blackout or permanent recurring closed day
            const [unavail] = await connection.query<RowDataPacket[]>(
                `SELECT id, reason FROM vendor_unavailability 
                 WHERE caterer_id = ? AND (
                     (type = 'temporary' AND DATE(unavailable_date) = ?) OR 
                     (type = 'permanent_recurring' AND day_of_week = ?)
                 )`,
                [caterer_id, dateStr, dayOfWeek]
            );

            if (unavail.length > 0) {
                await connection.rollback();
                connection.release();
                const reasonNote = unavail[0].reason ? ` (${unavail[0].reason})` : '';
                return res.status(400).json({
                    success: false,
                    message: `This caterer is not available on ${dateStr}${reasonNote}. Please choose a different date.`
                });
            }

            // 2. Check max bookings limit for the day
            const maxLimit = caterer.max_bookings_per_day || 3;
            const [acceptedCountRes] = await connection.query<RowDataPacket[]>(
                `SELECT COUNT(*) as count FROM bookings 
                 WHERE caterer_id = ? AND status = 'accepted' AND DATE(event_date) = ?`,
                [caterer_id, dateStr]
            );

            if (Number(acceptedCountRes[0].count) >= maxLimit) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                    success: false,
                    message: `This caterer has reached maximum booking capacity for ${dateStr}. Please choose another date.`
                });
            }
        }

        const id = crypto.randomUUID();

        // 1. Insert into bookings
        await connection.query(
            'INSERT INTO bookings (id, customer_id, caterer_id, event_date, event_type, guest_count, venue, contact_phone, special_requests, service_type, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, customer_id, caterer_id, event_date, event_type, guest_count, venue, contact_phone, special_requests, service_type || 'Full Service', total_amount || 0, 'pending_review']
        );

        // 2. Insert into booking_items
        if (items && Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                const itemId = crypto.randomUUID();
                await connection.query(
                    'INSERT INTO booking_items (id, booking_id, menu_item_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
                    [itemId, id, item.menu_item_id, item.quantity, item.unit_price]
                );
            }
        }

        await connection.commit();
        
        // Notify all admins of new booking
        notifyAllAdmins(
            'new_booking',
            'New Booking Received',
            `A new booking request has been submitted for ${event_type} on ${event_date}`,
            id,
            'booking'
        );
        
        res.status(201).json({ success: true, message: 'Booking request submitted', data: { id } });
    } catch (error) {
        await connection.rollback();
        console.error('[BOOKING] Create error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

export const getCustomerBookings = async (req: Request, res: Response) => {
    const { customerId } = req.params;
    try {
        const [bookings] = await pool.query<RowDataPacket[]>(
            `SELECT b.*, c.name as catererName, c.location as catererLocation, c.cover_image,
                    (SELECT COUNT(*) FROM reviews r WHERE r.booking_id = b.id) as is_reviewed
             FROM bookings b 
             JOIN caterers c ON b.caterer_id = c.id 
             WHERE b.customer_id = ?
             ORDER BY b.created_at DESC`,
            [customerId]
        );

        // Fetch items for each booking
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            const [items] = await pool.query<RowDataPacket[]>(
                `SELECT bi.*, mi.name 
                 FROM booking_items bi
                 JOIN menu_items mi ON bi.menu_item_id = mi.id
                 WHERE bi.booking_id = ?`,
                [booking.id]
            );
            return { ...booking, items };
        }));

        res.json({ success: true, data: enrichedBookings });
    } catch (error) {
        console.error('[BOOKING] Get customer bookings error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getBookingById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [bookings] = await pool.query<RowDataPacket[]>(
            `SELECT b.*, c.name as catererName, c.location as catererLocation, c.cover_image
             FROM bookings b 
             JOIN caterers c ON b.caterer_id = c.id 
             WHERE b.id = ?`,
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const booking = bookings[0];

        const [items] = await pool.query<RowDataPacket[]>(
            `SELECT bi.*, mi.name 
             FROM booking_items bi
             JOIN menu_items mi ON bi.menu_item_id = mi.id
             WHERE bi.booking_id = ?`,
            [id]
        );

        booking.items = items;

        res.json({ success: true, data: booking });
    } catch (error) {
        console.error('[BOOKING] Get booking error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('[BOOKING] Update status error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
