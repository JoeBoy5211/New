import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

// Get dashboard statistics
export const getStats = async (req: Request, res: Response) => {
    try {
        const [caterers] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM caterers');
        const [users] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM users WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'customer')`);
        const [bookings] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total, SUM(total_amount) as revenue FROM bookings WHERE status IN ('completed', 'confirmed')`);
        const [pending] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM caterers WHERE is_pending = 1');

        res.json({
            success: true,
            data: {
                totalCaterers: caterers[0].total,
                pendingCaterers: pending[0].total,
                totalCustomers: users[0].total,
                totalBookings: bookings[0].total,
                totalRevenue: bookings[0].revenue || 0
            }
        });
    } catch (error) {
        console.error('[ADMIN] Stats error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get detailed analytics (charts)
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        // 1. Booking Trends (Last 6 months)
        const [bookingData] = await pool.query<RowDataPacket[]>(`
            SELECT 
                DATE_FORMAT(created_at, '%b') as month,
                DATE_FORMAT(created_at, '%Y-%m') as sortKey,
                COUNT(*) as bookings,
                SUM(CASE WHEN status IN ('completed', 'confirmed') THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM bookings 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY sortKey, month
            ORDER BY sortKey ASC
        `);

        // 2. Revenue Trends (Last 6 months)
        const [revenueData] = await pool.query<RowDataPacket[]>(`
            SELECT 
                DATE_FORMAT(event_date, '%b') as month,
                DATE_FORMAT(event_date, '%Y-%m') as sortKey,
                SUM(total_amount) as revenue
            FROM bookings 
            WHERE status IN ('completed', 'confirmed') AND event_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY sortKey, month
            ORDER BY sortKey ASC
        `);

        // 3. Vendor Performance (Top 5 by Revenue)
        const [vendorData] = await pool.query<RowDataPacket[]>(`
            SELECT 
                c.name,
                c.name as fullName,
                COUNT(b.id) as bookings,
                COALESCE(SUM(CASE WHEN b.status IN ('completed', 'confirmed') THEN b.total_amount ELSE 0 END), 0) as revenue,
                COALESCE(AVG(r.rating), 0) as rating,
                COUNT(DISTINCT r.id) as reviews
            FROM caterers c
            LEFT JOIN bookings b ON c.id = b.caterer_id
            LEFT JOIN reviews r ON c.id = r.caterer_id
            WHERE c.is_approved = 1
            GROUP BY c.id
            ORDER BY revenue DESC
            LIMIT 6
        `);

        // 4. Booking Status Distribution
        const [statusData] = await pool.query<RowDataPacket[]>(`
            SELECT status as name, COUNT(*) as value 
            FROM bookings 
            GROUP BY status
        `);

        // 5. Cuisine Popularity (Weighted by number of bookings for caterers offering that cuisine)
        // We'll calculate this in JS because cuisines are stored as comma-separated strings
        const [catererCategories] = await pool.query<RowDataPacket[]>(`
            SELECT 
                c.id,
                (SELECT COUNT(*) FROM bookings WHERE caterer_id = c.id) as booking_count,
                (SELECT COUNT(*) FROM reviews WHERE caterer_id = c.id) as review_count,
                GROUP_CONCAT(DISTINCT mi.category) as cuisines
            FROM caterers c
            LEFT JOIN menu_items mi ON c.id = mi.caterer_id
            WHERE c.is_approved = 1
            GROUP BY c.id
        `);

        const cuisinePopularityMap: Record<string, number> = {};

        catererCategories.forEach((caterer: any) => {
            if (caterer.cuisines) {
                const list = typeof caterer.cuisines === 'string'
                    ? caterer.cuisines.split(',')
                    : Array.isArray(caterer.cuisines) ? caterer.cuisines : [];

                // Weight = bookings + reviews
                const weight = (Number(caterer.booking_count) || 0) + (Number(caterer.review_count) || 0) + 1; // Base weight of 1

                list.forEach((cuisine: string) => {
                    const cleanName = cuisine.trim();
                    if (cleanName) {
                        cuisinePopularityMap[cleanName] = (cuisinePopularityMap[cleanName] || 0) + weight;
                    }
                });
            }
        });

        const cuisinePopularity = Object.entries(cuisinePopularityMap)
            .map(([name, popularity]) => ({ name, popularity }))
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 6);

        res.json({
            success: true,
            data: {
                bookingTrends: bookingData,
                revenueData: revenueData.map((d: any) => ({
                    month: d.month,
                    revenue: Number(d.revenue),
                    platformFee: Number(d.revenue) * 0.1 // 10% platform fee
                })),
                vendorPerformance: vendorData.map((v: any) => ({
                    ...v,
                    name: v.name.split(' ')[0], // First name/word for chart label
                    fullName: v.name,
                    rating: Number(v.rating).toFixed(1)
                })),
                bookingStatusData: statusData.map((s: any) => ({
                    name: s.name.charAt(0).toUpperCase() + s.name.slice(1),
                    value: s.value
                })),
                cuisinePopularity
            }
        });

    } catch (error) {
        console.error('[ADMIN] Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all caterers
export const getCaterers = async (req: Request, res: Response) => {
    try {
        const [caterers] = await pool.query<RowDataPacket[]>(`
            SELECT 
                c.*,
                AVG(r.rating) as rating,
                COUNT(DISTINCT r.id) as review_count
            FROM caterers c
            LEFT JOIN reviews r ON c.id = r.caterer_id
            GROUP BY c.id
        `);

        const parsedCaterers = caterers.map(c => ({
            ...c,
            cuisines: c.cuisines ? (typeof c.cuisines === 'string' ? c.cuisines.split(',') : c.cuisines) : [],
            event_types: c.event_types ? (typeof c.event_types === 'string' ? c.event_types.split(',') : c.event_types) : [],
            specialties: c.specialties ? (typeof c.specialties === 'string' ? c.specialties.split(',') : c.specialties) : [],
            images: c.images ? (typeof c.images === 'string' ? c.images.split(',') : c.images) : []
        }));

        res.json({ success: true, data: parsedCaterers });
    } catch (error) {
        console.error('[ADMIN] Get caterers error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all customers
export const getCustomers = async (req: Request, res: Response) => {
    try {
        const [customers] = await pool.query<RowDataPacket[]>(`
            SELECT 
                u.id, u.email, p.name, p.phone, u.created_at, ur.role,
                COUNT(DISTINCT b.id) as booking_count
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN bookings b ON u.id = b.customer_id
            WHERE ur.role = 'customer'
            GROUP BY u.id, u.email, p.name, p.phone, u.created_at, ur.role
        `);

        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('[ADMIN] Get customers error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all bookings
export const getBookings = async (req: Request, res: Response) => {
    try {
        const [bookings] = await pool.query<RowDataPacket[]>(`
            SELECT 
                b.*, 
                p.name as customer_name,
                c.name as caterer_name
            FROM bookings b
            LEFT JOIN profiles p ON b.customer_id = p.user_id
            LEFT JOIN caterers c ON b.caterer_id = c.id
            ORDER BY b.created_at DESC
        `);

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('[ADMIN] Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all reviews
export const getReviews = async (req: Request, res: Response) => {
    try {
        const [reviews] = await pool.query<RowDataPacket[]>(`
            SELECT 
                r.*, 
                p.name as customer_name,
                c.name as caterer_name
            FROM reviews r
            LEFT JOIN profiles p ON r.customer_id = p.user_id
            LEFT JOIN caterers c ON r.caterer_id = c.id
            ORDER BY r.created_at DESC
        `);

        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('[ADMIN] Get reviews error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Approve caterer
export const approveCaterer = async (req: Request, res: Response) => {
    const { catererId } = req.params;
    try {
        // Get caterer name for notification
        const [caterers] = await pool.query<RowDataPacket[]>('SELECT name FROM caterers WHERE id = ?', [catererId]);
        const catererName = caterers[0]?.name || 'Unknown';
        
        await pool.query('UPDATE caterers SET is_approved = 1, is_pending = 0 WHERE id = ?', [catererId]);
        
        // Notify all admins
        notifyAllAdmins(
            'caterer_approved',
            'Caterer Approved',
            `${catererName} has been approved and is now live on the platform.`,
            catererId,
            'caterer'
        );
        
        res.json({ success: true, message: 'Caterer approved' });
    } catch (error) {
        console.error('[ADMIN] Approve caterer error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Reject caterer
export const rejectCaterer = async (req: Request, res: Response) => {
    const { catererId } = req.params;
    try {
        await pool.query('DELETE FROM caterers WHERE id = ?', [catererId]);
        res.json({ success: true, message: 'Caterer rejected' });
    } catch (error) {
        console.error('[ADMIN] Reject caterer error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete review
export const deleteReview = async (req: Request, res: Response) => {
    const { reviewId } = req.params;
    try {
        await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('[ADMIN] Delete review error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['customer', 'vendor', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
        // Check if user role entry exists
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM user_roles WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            await pool.query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, role]);
        } else {
            await pool.query('UPDATE user_roles SET role = ? WHERE user_id = ?', [role, userId]);
        }

        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        console.error('[ADMIN] Update user role error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── Admin Management (Super Admin Only) ───────────────────────────────────────

// Get all admins (for super admin)
export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const [admins] = await pool.query<RowDataPacket[]>(`
            SELECT 
                u.id, 
                u.email, 
                p.name, 
                p.phone,
                ur.is_super_admin,
                ur.created_at as promoted_at,
                u.created_at as user_created_at
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE ur.role = 'admin'
            ORDER BY ur.is_super_admin DESC, ur.created_at DESC
        `);

        res.json({ 
            success: true, 
            data: admins.map(admin => ({
                ...admin,
                isSuperAdmin: Boolean(admin.is_super_admin)
            }))
        });
    } catch (error) {
        console.error('[ADMIN] Get all admins error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Promote user to admin
export const promoteToAdmin = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        // Check if user exists
        const [users] = await pool.query<RowDataPacket[]>('SELECT id, email FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check current role
        const [roles] = await pool.query<RowDataPacket[]>('SELECT * FROM user_roles WHERE user_id = ?', [userId]);
        
        if (roles.length > 0 && roles[0].role === 'admin') {
            return res.status(400).json({ success: false, message: 'User is already an admin' });
        }

        // Promote to admin (not super admin)
        if (roles.length === 0) {
            await pool.query('INSERT INTO user_roles (user_id, role, is_super_admin) VALUES (?, ?, ?)', [userId, 'admin', false]);
        } else {
            await pool.query('UPDATE user_roles SET role = ?, is_super_admin = ? WHERE user_id = ?', ['admin', false, userId]);
        }
        
        // Notify only super admins of new admin
        notifyAllAdmins(
            'admin_promoted',
            'New Admin Added',
            `${users[0].email} has been promoted to admin by the super admin.`,
            userId,
            'user',
            true // superOnly
        );

        res.json({ success: true, message: 'User promoted to admin successfully' });
    } catch (error) {
        console.error('[ADMIN] Promote to admin error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete admin completely (cannot delete super admin)
export const deleteAdmin = async (req: Request, res: Response) => {
    const { adminId } = req.params;
    const currentUserId = req.user?.id;

    try {
        // Cannot delete self
        if (adminId === currentUserId) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        // Check if target is super admin
        const [roles] = await pool.query<RowDataPacket[]>(
            'SELECT is_super_admin FROM user_roles WHERE user_id = ? AND role = ?', 
            [adminId, 'admin']
        );

        if (roles.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (roles[0].is_super_admin) {
            return res.status(403).json({ success: false, message: 'Cannot delete super admin' });
        }

        // Delete user completely (cascade will handle related records)
        await pool.query('DELETE FROM users WHERE id = ?', [adminId]);

        res.json({ success: true, message: 'Admin removed from system' });
    } catch (error) {
        console.error('[ADMIN] Delete admin error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── Admin Notifications ─────────────────────────────────────────────────────

// Get notifications for current admin
export const getAdminNotifications = async (req: Request, res: Response) => {
    const adminId = req.user?.id;

    try {
        const [notifications] = await pool.query<RowDataPacket[]>(`
            SELECT * FROM admin_notifications 
            WHERE admin_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `, [adminId]);

        const [unreadCount] = await pool.query<RowDataPacket[]>(`
            SELECT COUNT(*) as count FROM admin_notifications 
            WHERE admin_id = ? AND is_read = FALSE
        `, [adminId]);

        res.json({ 
            success: true, 
            data: notifications,
            unreadCount: unreadCount[0].count
        });
    } catch (error) {
        console.error('[ADMIN] Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Mark notification as read
export const markNotificationRead = async (req: Request, res: Response) => {
    const { notificationId } = req.params;
    const adminId = req.user?.id;

    try {
        await pool.query(
            'UPDATE admin_notifications SET is_read = TRUE WHERE id = ? AND admin_id = ?',
            [notificationId, adminId]
        );

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('[ADMIN] Mark notification read error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req: Request, res: Response) => {
    const adminId = req.user?.id;

    try {
        await pool.query(
            'UPDATE admin_notifications SET is_read = TRUE WHERE admin_id = ? AND is_read = FALSE',
            [adminId]
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('[ADMIN] Mark all notifications read error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Categories and metadata endpoints removed as per user request

// Create notification for admins (internal helper)
export const notifyAllAdmins = async (type: string, title: string, message: string, relatedId?: string, relatedType?: string, superOnly: boolean = false) => {
    try {
        const crypto = await import('crypto');
        
        // Get target admin IDs
        const query = superOnly 
            ? 'SELECT user_id FROM user_roles WHERE role = ? AND is_super_admin = TRUE'
            : 'SELECT user_id FROM user_roles WHERE role = ?';
            
        const [admins] = await pool.query<RowDataPacket[]>(query, ['admin']);

        for (const admin of admins) {
            const notificationId = crypto.randomUUID();
            await pool.query(
                'INSERT INTO admin_notifications (id, admin_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [notificationId, admin.user_id, type, title, message, relatedId || null, relatedType || null]
            );
        }
    } catch (error) {
        console.error('[ADMIN] Notify all admins error:', error);
    }
};
