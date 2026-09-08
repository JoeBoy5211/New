
import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export const getCaterers = async (req: Request, res: Response) => {
    const { date } = req.query; // optional: YYYY-MM-DD

    try {
        let query: string;
        let params: any[] = [];

        if (date && typeof date === 'string') {
            const targetDate = new Date(date + 'T00:00:00');
            const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

            // Exclude caterers at daily capacity or marked unavailable (temporary date or permanent closed day)
            query = `
                SELECT 
                    c.*,
                    AVG(r.rating) as ratingValue,
                    COUNT(DISTINCT r.id) as reviewCount,
                    EXISTS(SELECT 1 FROM menu_items WHERE caterer_id = c.id) as hasMenu,
                    (
                        c.cover_image IS NOT NULL AND 
                        c.min_guests IS NOT NULL AND c.min_guests > 0 AND
                        c.max_guests IS NOT NULL AND c.max_guests > 0 AND
                        c.event_types IS NOT NULL AND c.event_types <> '' AND
                        c.description IS NOT NULL AND c.description <> '' AND
                        c.long_description IS NOT NULL AND c.long_description <> '' AND
                        c.location IS NOT NULL AND c.location <> ''
                    ) as isProfileComplete,
                    0 as is_premium,
                    COALESCE((
                        SELECT COUNT(*) FROM bookings b
                        WHERE b.caterer_id = c.id
                          AND b.status = 'accepted'
                          AND DATE(b.event_date) = ?
                    ), 0) as bookings_on_date
                FROM caterers c
                LEFT JOIN reviews r ON c.id = r.caterer_id
                WHERE c.is_approved = 1 AND (c.is_active IS NULL OR c.is_active = 1)
                  AND c.id NOT IN (
                      SELECT caterer_id FROM vendor_unavailability
                      WHERE (type = 'temporary' AND DATE(unavailable_date) = ?)
                         OR (type = 'permanent_recurring' AND day_of_week = ?)
                  )
                GROUP BY c.id
                HAVING bookings_on_date < COALESCE(c.max_bookings_per_day, 3)
            `;
            params = [date, date, dayOfWeek];
        } else {
            // No date filter — return all approved active caterers (original behaviour)
            query = `
                SELECT 
                    c.*,
                    AVG(r.rating) as ratingValue,
                    COUNT(DISTINCT r.id) as reviewCount,
                    EXISTS(SELECT 1 FROM menu_items WHERE caterer_id = c.id) as hasMenu,
                    (
                        c.cover_image IS NOT NULL AND 
                        c.min_guests IS NOT NULL AND c.min_guests > 0 AND
                        c.max_guests IS NOT NULL AND c.max_guests > 0 AND
                        c.event_types IS NOT NULL AND c.event_types <> '' AND
                        c.description IS NOT NULL AND c.description <> '' AND
                        c.long_description IS NOT NULL AND c.long_description <> '' AND
                        c.location IS NOT NULL AND c.location <> ''
                    ) as isProfileComplete,
                    0 as is_premium
                FROM caterers c
                LEFT JOIN reviews r ON c.id = r.caterer_id
                WHERE c.is_approved = 1 AND (c.is_active IS NULL OR c.is_active = 1)
                GROUP BY c.id
            `;
        }

        const [caterers] = await pool.query<RowDataPacket[]>(query, params);

        // Convert cuisines string to array if it's stored as comma-separated
        const parsedCaterers = caterers.map(c => ({
            ...c,
            cuisines: c.cuisines ? (typeof c.cuisines === 'string' ? c.cuisines.split(',') : c.cuisines) : [],
            eventTypes: c.event_types ? (typeof c.event_types === 'string' ? c.event_types.split(',') : c.event_types) : [],
            specialties: c.specialties ? (typeof c.specialties === 'string' ? c.specialties.split(',') : c.specialties) : [],
            images: c.images ? (typeof c.images === 'string' ? c.images.split(',') : c.images) : []
        }));

        res.json({ success: true, data: parsedCaterers });
    } catch (error) {
        console.error('[CATERER] Get caterers error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


export const getCatererById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { incrementView } = req.query;
    try {
        if (incrementView === 'true') {
            await pool.query('UPDATE caterers SET page_views = page_views + 1 WHERE id = ?', [id]);
        }

        const [catererRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                c.*,
                COALESCE((SELECT AVG(rating) FROM reviews WHERE caterer_id = c.id), 0) as ratingValue,
                COALESCE((SELECT COUNT(*) FROM reviews WHERE caterer_id = c.id), 0) as reviewCount,
                EXISTS(SELECT 1 FROM menu_items WHERE caterer_id = c.id) as hasMenu,
                (
                    c.cover_image IS NOT NULL AND 
                    c.min_guests IS NOT NULL AND c.min_guests > 0 AND
                    c.max_guests IS NOT NULL AND c.max_guests > 0 AND
                    c.event_types IS NOT NULL AND c.event_types <> '' AND
                    c.description IS NOT NULL AND c.description <> '' AND
                    c.long_description IS NOT NULL AND c.long_description <> '' AND
                    c.location IS NOT NULL AND c.location <> ''
                ) as isProfileComplete,
                0 as is_premium
             FROM caterers c 
             WHERE c.id = ? AND c.is_approved = 1 AND (c.is_active IS NULL OR c.is_active = 1)`,
            [id]
        );

        if (catererRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Caterer not found' });
        }

        const caterer = catererRows[0];

        // Get menu items
        const [menuItems] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM menu_items WHERE caterer_id = ?',
            [id]
        );

        // Get reviews
        const [reviews] = await pool.query<RowDataPacket[]>(
            'SELECT r.*, p.name as customerName, p.avatar_url as customerAvatar FROM reviews r LEFT JOIN profiles p ON r.customer_id = p.user_id WHERE r.caterer_id = ?',
            [id]
        );

        // Get additional services
        const [services] = await pool.query<RowDataPacket[]>(
            `SELECT id, service_name, description, sample_images, is_active, created_at
             FROM caterer_services
             WHERE caterer_id = ? AND (is_active IS NULL OR is_active = 1)
             ORDER BY created_at DESC`,
            [id]
        );

        // Get vendor unavailability
        const [unavailability] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM vendor_unavailability WHERE caterer_id = ?',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...caterer,
                cuisines: caterer.cuisines ? (typeof caterer.cuisines === 'string' ? caterer.cuisines.split(',') : caterer.cuisines) : [],
                eventTypes: caterer.event_types ? (typeof caterer.event_types === 'string' ? caterer.event_types.split(',') : caterer.event_types) : [],
                specialties: caterer.specialties ? (typeof caterer.specialties === 'string' ? caterer.specialties.split(',') : caterer.specialties) : [],
                images: caterer.images ? (typeof caterer.images === 'string' ? caterer.images.split(',') : caterer.images) : [],
                menuItems,
                reviews,
                unavailability,
                services: services.map((s: any) => ({
                    id: s.id,
                    service_name: s.service_name,
                    description: s.description,
                    sample_images: s.sample_images ? (typeof s.sample_images === 'string' ? JSON.parse(s.sample_images) : s.sample_images) : []
                }))
            }
        });
    } catch (error) {
        console.error('[CATERER] Get caterer detail error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
