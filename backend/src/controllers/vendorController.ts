
import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';

export const getVendorDashboard = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        // Get caterer profile
        const [caterers] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM caterers WHERE vendor_id = ?',
            [userId]
        );

        if (caterers.length === 0) {
            return res.status(404).json({ success: false, message: 'Caterer profile not found' });
        }

        const caterer = caterers[0];
        const catererId = caterer.id;

        // Get bookings
        const [bookings] = await pool.query<RowDataPacket[]>(
            `SELECT b.*, p.name as customerName 
             FROM bookings b 
             LEFT JOIN profiles p ON b.customer_id = p.user_id 
             WHERE b.caterer_id = ? 
             ORDER BY b.created_at DESC`,
            [catererId]
        );

        // Get menu items
        const [menuItems] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM menu_items WHERE caterer_id = ?',
            [catererId]
        );

        // Get reviews
        const [reviews] = await pool.query<RowDataPacket[]>(
            `SELECT r.*, p.name as customerName 
             FROM reviews r 
             LEFT JOIN profiles p ON r.customer_id = p.user_id 
             WHERE r.caterer_id = ? 
             ORDER BY r.created_at DESC`,
            [catererId]
        );

        // Fetch items for each booking
        const bookingsWithItems = await Promise.all(bookings.map(async (booking) => {
            const [items] = await pool.query<RowDataPacket[]>(
                `SELECT bi.*, mi.name as item_name 
                 FROM booking_items bi
                 JOIN menu_items mi ON bi.menu_item_id = mi.id
                 WHERE bi.booking_id = ?`,
                [booking.id]
            );
            return { ...booking, items };
        }));

        res.json({
            success: true,
            data: {
                caterer: {
                    ...caterer,
                    cuisines: caterer.cuisines ? caterer.cuisines.split(',') : [],
                    eventTypes: caterer.event_types ? caterer.event_types.split(',') : [],
                    specialties: caterer.specialties ? caterer.specialties.split(',') : [],
                    images: caterer.images ? (typeof caterer.images === 'string' ? caterer.images.split(',') : caterer.images) : []
                },
                bookings: bookingsWithItems,
                menuItems,
                reviews
            }
        });
    } catch (error) {
        console.error('[VENDOR] Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const { status } = req.body;
    try {
        await pool.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, bookingId]
        );
        res.json({ success: true, message: 'Booking status updated' });
    } catch (error) {
        console.error('[VENDOR] Update booking error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const addMenuItem = async (req: Request, res: Response) => {
    const { caterer_id, name, description, price, category } = req.body;
    try {
        const id = crypto.randomUUID();
        await pool.query(
            'INSERT INTO menu_items (id, caterer_id, name, description, price, category) VALUES (?, ?, ?, ?, ?, ?)',
            [id, caterer_id, name, description, price, category]
        );
        res.status(201).json({ success: true, message: 'Menu item added', data: { id } });
    } catch (error) {
        console.error('[VENDOR] Add menu item error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateMenuItem = async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { name, description, price, category } = req.body;
    try {
        await pool.query(
            'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, description, price, category, itemId]
        );
        res.json({ success: true, message: 'Menu item updated' });
    } catch (error) {
        console.error('[VENDOR] Update menu item error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
    const { itemId } = req.params;
    try {
        await pool.query('DELETE FROM menu_items WHERE id = ?', [itemId]);
        res.json({ success: true, message: 'Menu item deleted' });
    } catch (error) {
        console.error('[VENDOR] Delete menu item error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateCatererProfile = async (req: Request, res: Response) => {
    const { catererId } = req.params;
    const {
        name,
        description,
        long_description,
        location,
        min_guests,
        max_guests,
        years_in_business,
        cuisines,
        event_types,
        specialties,
        price_range
    } = req.body;

    console.log('[VENDOR] Updating profile for caterer:', catererId, 'with body:', req.body);

    try {
        if (!catererId) {
            return res.status(400).json({ success: false, message: 'Caterer ID is required' });
        }

        const minGuestsNum = parseInt(String(min_guests)) || 0;
        const maxGuestsNum = parseInt(String(max_guests)) || 0;
        const yearsInBizNum = parseInt(String(years_in_business)) || 0;

        await pool.query(
            `UPDATE caterers 
             SET name = ?, description = ?, long_description = ?, location = ?, min_guests = ?, max_guests = ?, years_in_business = ?, cuisines = ?, event_types = ?, specialties = ?, price_range = ? 
             WHERE id = ?`,
            [
                name || '',
                description || '',
                long_description || '',
                location || '',
                minGuestsNum,
                maxGuestsNum,
                yearsInBizNum,
                cuisines || '',
                event_types || '',
                specialties || '',
                price_range || '$',
                catererId
            ]
        );
        console.log('[VENDOR] Profile updated successfully for:', catererId);
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('[VENDOR] Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
