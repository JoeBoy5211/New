
import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';
import { sendBookingStatusNotification } from '../services/pushNotificationService';

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

        // Get additional services
        const [services] = await pool.query<RowDataPacket[]>(
            `SELECT id, service_name, description, sample_images, is_active, created_at
             FROM caterer_services
             WHERE caterer_id = ?
             ORDER BY created_at DESC`,
            [catererId]
        );

        // Get subscription info
        const [subscriptions] = await pool.query<RowDataPacket[]>(
            `SELECT current_tier, trial_started_at, trial_ends_at, subscription_started_at, subscription_ends_at, converted_from_trial
             FROM vendor_subscriptions WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        // Resolve effective tier (auto-downgrade expired)
        let tier = 'free';
        let subscriptionInfo = subscriptions[0] || null;
        if (subscriptionInfo) {
            const now = new Date();
            if (subscriptionInfo.current_tier === 'trial' && subscriptionInfo.trial_ends_at && new Date(subscriptionInfo.trial_ends_at) > now) {
                tier = 'trial';
            } else if (subscriptionInfo.current_tier === 'premium' && subscriptionInfo.subscription_ends_at && new Date(subscriptionInfo.subscription_ends_at) > now) {
                tier = 'premium';
            }
        }

        // Monthly booking count for free tier display
        const [bookingCountRes] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE caterer_id = ? AND status IN ('accepted', 'completed') 
             AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
            [catererId]
        );
        const monthlyBookingCount = Number(bookingCountRes[0]?.count || 0);

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

        // Fetch vendor unavailability (temporary blackout dates & permanent recurring closed days)
        const [unavailability] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM vendor_unavailability WHERE caterer_id = ? ORDER BY created_at DESC',
            [catererId]
        );

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
                reviews,
                unavailability,
                services: services.map((s: any) => ({
                    id: s.id,
                    service_name: s.service_name,
                    description: s.description,
                    is_active: s.is_active !== undefined ? Boolean(s.is_active) : true,
                    sample_images: s.sample_images ? (typeof s.sample_images === 'string' ? JSON.parse(s.sample_images) : s.sample_images) : []
                })),
                subscription: {
                    tier,
                    trialEndsAt: subscriptionInfo?.trial_ends_at || null,
                    subscriptionEndsAt: subscriptionInfo?.subscription_ends_at || null,
                    convertedFromTrial: subscriptionInfo?.converted_from_trial || false,
                },
                limits: {
                    menu_limit: tier === 'premium' || tier === 'trial' ? null : 6,
                    services_enabled: tier === 'premium' || tier === 'trial',
                    video_enabled: tier === 'premium' || tier === 'trial',
                    monthly_booking_limit: tier === 'premium' || tier === 'trial' ? null : 3,
                    monthly_bookings_used: monthlyBookingCount,
                }
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

        // Send push notification for accepted/declined
        if (status === 'accepted' || status === 'declined') {
            try {
                // Get booking + customer push token + caterer name
                const [rows] = await pool.query<RowDataPacket[]>(
                    `SELECT b.customer_id, c.name as caterer_name, p.push_token
                     FROM bookings b
                     JOIN caterers c ON b.caterer_id = c.id
                     LEFT JOIN profiles p ON b.customer_id = p.user_id
                     WHERE b.id = ?`,
                    [bookingId]
                );

                if (rows.length > 0 && rows[0].push_token) {
                    await sendBookingStatusNotification(
                        rows[0].push_token,
                        status as 'accepted' | 'declined',
                        rows[0].caterer_name,
                        bookingId
                    );
                }
            } catch (pushErr) {
                // Don't fail the main request if push fails
                console.error('[VENDOR] Push notification error:', pushErr);
            }
        }

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
        price_range,
        max_bookings_per_day
    } = req.body;

    console.log('[VENDOR] Updating profile for caterer:', catererId, 'with body:', req.body);

    try {
        if (!catererId) {
            return res.status(400).json({ success: false, message: 'Caterer ID is required' });
        }

        const minGuestsNum = parseInt(String(min_guests)) || 0;
        const maxGuestsNum = parseInt(String(max_guests)) || 0;
        const yearsInBizNum = parseInt(String(years_in_business)) || 0;
        const maxBookingsPerDay = parseInt(String(max_bookings_per_day)) || 3;

        await pool.query(
            `UPDATE caterers 
             SET name = ?, description = ?, long_description = ?, location = ?, min_guests = ?, max_guests = ?, years_in_business = ?, cuisines = ?, event_types = ?, specialties = ?, price_range = ?, max_bookings_per_day = ? 
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
                maxBookingsPerDay,
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

export const addVendorService = async (req: Request, res: Response) => {
    const { catererId, service_name, description } = req.body;
    const files = (req as any).files;

    if (!catererId || !service_name) {
        return res.status(400).json({ success: false, message: 'Caterer ID and service name are required' });
    }

    try {
        const serviceId = crypto.randomUUID();
        const imageUrls = files && files.length > 0
            ? files.map((f: any) => f.path)
            : [];

        await pool.query(
            'INSERT INTO caterer_services (id, caterer_id, service_name, description, sample_images) VALUES (?, ?, ?, ?, ?)',
            [serviceId, catererId, service_name, description || null, JSON.stringify(imageUrls)]
        );

        res.status(201).json({
            success: true,
            message: 'Service added successfully',
            data: {
                id: serviceId,
                service_name,
                description,
                sample_images: imageUrls
            }
        });
    } catch (error) {
        console.error('[VENDOR] Add service error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteVendorService = async (req: Request, res: Response) => {
    const { serviceId } = req.params;

    try {
        const [result] = await pool.query<any>(
            'DELETE FROM caterer_services WHERE id = ?',
            [serviceId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        console.error('[VENDOR] Delete service error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getVendorAnalytics = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const [caterers] = await pool.query<RowDataPacket[]>(
            'SELECT id, page_views FROM caterers WHERE vendor_id = ?',
            [userId]
        );

        if (caterers.length === 0) {
            return res.status(404).json({ success: false, message: 'Caterer not found' });
        }

        const catererId = caterers[0].id;
        const pageViews = Number(caterers[0].page_views) || 0;

        // Total Completed Bookings
        const [totalBookingsRes] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM bookings WHERE caterer_id = ? AND status IN ("completed", "confirmed")',
            [catererId]
        );
        const totalBookings = Number(totalBookingsRes[0]?.count) || 0;

        // Revenue over time (monthly)
        const [revenueOverTime] = await pool.query<RowDataPacket[]>(
            `SELECT DATE_FORMAT(event_date, '%Y-%m') as period, SUM(total_amount) as revenue, COUNT(*) as bookings
             FROM bookings
             WHERE caterer_id = ? AND status IN ("completed", "confirmed")
             GROUP BY DATE_FORMAT(event_date, '%Y-%m')
             ORDER BY period ASC`,
            [catererId]
        );

        // Map null revenue to 0
        const formattedRevenue = revenueOverTime.map(item => ({
            period: item.period,
            revenue: Number(item.revenue) || 0,
            bookings: Number(item.bookings) || 0
        }));

        res.json({
            success: true,
            data: {
                pageViews,
                totalBookings,
                conversionRate: pageViews > 0 ? parseFloat(((totalBookings / pageViews) * 100).toFixed(2)) : 0,
                revenueOverTime: formattedRevenue
            }
        });

    } catch (error) {
        console.error('[VENDOR] Analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const toggleCatererStatus = async (req: Request, res: Response) => {
    const { catererId } = req.params;
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT is_active FROM caterers WHERE id = ?',
            [catererId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Caterer not found' });
        }
        const current = rows[0].is_active !== 0; // treat NULL as active
        const newStatus = current ? 0 : 1;
        await pool.query('UPDATE caterers SET is_active = ? WHERE id = ?', [newStatus, catererId]);
        res.json({
            success: true,
            is_active: newStatus === 1,
            message: newStatus === 1 ? 'Profile activated' : 'Profile deactivated'
        });
    } catch (error) {
        console.error('[VENDOR] Toggle caterer status error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const toggleServiceStatus = async (req: Request, res: Response) => {
    const { serviceId } = req.params;
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT is_active FROM caterer_services WHERE id = ?',
            [serviceId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        const current = rows[0].is_active !== 0;
        const newStatus = current ? 0 : 1;
        await pool.query('UPDATE caterer_services SET is_active = ? WHERE id = ?', [newStatus, serviceId]);
        res.json({
            success: true,
            is_active: newStatus === 1,
            message: newStatus === 1 ? 'Service activated' : 'Service deactivated'
        });
    } catch (error) {
        console.error('[VENDOR] Toggle service status error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
export const uploadVerificationDocuments = async (req: Request, res: Response) => {
    const { catererId } = req.params;
    const { tinNumber } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!tinNumber) {
        return res.status(400).json({ success: false, message: 'TIN number is required' });
    }

    if (!files || !files.competencyCertificate || !files.tradeLicense) {
        return res.status(400).json({ success: false, message: 'Both Competency Certificate and Trade License are required' });
    }

    try {
        const competencyUrl = files.competencyCertificate[0].path;
        const tradeLicenseUrl = files.tradeLicense[0].path;

        await pool.query(
            `UPDATE caterers 
             SET tin_number = ?, competency_certificate_url = ?, trade_license_url = ? 
             WHERE id = ?`,
            [tinNumber, competencyUrl, tradeLicenseUrl, catererId]
        );

        res.json({ success: true, message: 'Verification documents uploaded successfully' });
    } catch (error) {
        console.error('[VENDOR] Upload verification error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const addVendorUnavailability = async (req: Request, res: Response) => {
    const { catererId, type, unavailable_date, day_of_week, reason } = req.body;

    if (!catererId || !type) {
        return res.status(400).json({ success: false, message: 'catererId and type are required' });
    }

    if (type === 'temporary' && !unavailable_date) {
        return res.status(400).json({ success: false, message: 'unavailable_date is required for temporary blackouts' });
    }

    if (type === 'permanent_recurring' && (day_of_week === undefined || day_of_week === null)) {
        return res.status(400).json({ success: false, message: 'day_of_week is required for permanent recurring closed days' });
    }

    try {
        await pool.query(
            `INSERT INTO vendor_unavailability (caterer_id, type, unavailable_date, day_of_week, reason) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                catererId,
                type,
                type === 'temporary' ? unavailable_date : null,
                type === 'permanent_recurring' ? day_of_week : null,
                reason || null
            ]
        );

        res.json({ success: true, message: 'Unavailability entry added successfully' });
    } catch (error: any) {
        console.error('[VENDOR] Add unavailability error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

export const deleteVendorUnavailability = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM vendor_unavailability WHERE id = ?', [id]);
        res.json({ success: true, message: 'Unavailability entry removed' });
    } catch (error) {
        console.error('[VENDOR] Delete unavailability error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

