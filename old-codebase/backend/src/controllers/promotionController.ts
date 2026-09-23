
import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

export const getPromotions = async (req: Request, res: Response) => {
    try {
        const userId = req.headers['user-id'] as string || null;
        const tag = req.query.tag as string || null;
        const savedOnly = req.query.savedOnly === 'true';
        const followingOnly = req.query.followingOnly === 'true';

        let query = `
            SELECT p.*, c.name as caterer_name, c.cover_image as caterer_image,
               (SELECT COUNT(*) FROM promotion_likes WHERE promotion_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM caterer_follows WHERE caterer_id = c.id) as followers_count,
               (SELECT COUNT(*) FROM promotion_comments WHERE promotion_id = p.id) as comments_count,
               p.shares_count,
               EXISTS(SELECT 1 FROM promotion_likes WHERE promotion_id = p.id AND user_id = ?) as is_liked,
               EXISTS(SELECT 1 FROM promotion_saves WHERE promotion_id = p.id AND user_id = ?) as is_saved,
               EXISTS(SELECT 1 FROM caterer_follows WHERE caterer_id = c.id AND follower_id = ?) as is_following
             FROM promotions p 
             JOIN caterers c ON p.caterer_id = c.id
        `;

        const queryParams: any[] = [userId, userId, userId];
        const whereClauses: string[] = [];

        if (tag) {
            whereClauses.push(`(p.tags LIKE ? OR p.caption LIKE ? OR c.name LIKE ?)`);
            const searchPattern = `%${tag}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (savedOnly && userId) {
            whereClauses.push(`EXISTS(SELECT 1 FROM promotion_saves WHERE promotion_id = p.id AND user_id = ?)`);
            queryParams.push(userId);
        }

        if (followingOnly && userId) {
            whereClauses.push(`EXISTS(SELECT 1 FROM caterer_follows WHERE caterer_id = c.id AND follower_id = ?)`);
            queryParams.push(userId);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        // Randomize the discovery feed, but keep saved/following/search chronological
        if (!tag && !savedOnly && !followingOnly) {
            query += ` ORDER BY RAND()`;
        } else {
            query += ` ORDER BY p.created_at DESC`;
        }

        const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

        // Convert bigints and booleans from SQL expressions to standard types
        const formattedRows = rows.map(row => ({
            ...row,
            likes_count: Number(row.likes_count),
            followers_count: Number(row.followers_count),
            comments_count: Number(row.comments_count),
            shares_count: Number(row.shares_count || 0),
            is_liked: Boolean(row.is_liked),
            is_saved: Boolean(row.is_saved),
            is_following: Boolean(row.is_following)
        }));

        res.json({ success: true, promotions: formattedRows });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch promotions' });
    }
};

export const addPromotion = async (req: Request, res: Response) => {
    try {
        const vendorId = req.body.vendorId;
        const { caption, tags } = req.body;
        const file = req.file;
        const subscriptionTier = (req as any).subscriptionTier || 'free';

        if (!file) {
            return res.status(400).json({ success: false, message: 'Media file is required' });
        }

        // Get caterer id for vendor
        const [caterers] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM caterers WHERE vendor_id = ?',
            [vendorId]
        );

        if (caterers.length === 0) {
            return res.status(403).json({ success: false, message: 'Only registered caterers can post promotions' });
        }

        const catererId = caterers[0].id;

        // multer-storage-cloudinary sets file.path to the secure Cloudinary URL
        const mediaUrl = (file as any).path || (file as any).secure_url;

        // Determine media type from mimetype
        let mediaType = 'image';
        if (file.mimetype.startsWith('video/')) {
            mediaType = 'video';
        }

        // Enforce video upload subscription limit
        if (mediaType === 'video' && subscriptionTier === 'free') {
            return res.status(403).json({
                success: false,
                message: 'Video uploads require a Premium subscription',
                code: 'SUBSCRIPTION_REQUIRED',
                upgrade_url: '/vendor/upgrade'
            });
        }

        const promotionId = crypto.randomUUID();

        await pool.query(
            'INSERT INTO promotions (id, caterer_id, media_url, media_type, caption, tags) VALUES (?, ?, ?, ?, ?, ?)',
            [promotionId, catererId, mediaUrl, mediaType, caption || null, tags || null]
        );

        res.status(201).json({ success: true, message: 'Promotion added successfully', promotion_id: promotionId });
    } catch (error) {
        console.error('Error adding promotion:', error);
        res.status(500).json({ success: false, message: 'Failed to add promotion' });
    }
};

export const deletePromotion = async (req: Request, res: Response) => {
    try {
        const vendorId = req.params.vendorId;
        const { id } = req.params;

        const [caterers] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM caterers WHERE vendor_id = ?',
            [vendorId]
        );

        if (caterers.length === 0) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const catererId = caterers[0].id;

        const [result] = await pool.query<any>(
            'DELETE FROM promotions WHERE id = ? AND caterer_id = ?',
            [id, catererId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Promotion not found or unauthorized' });
        }

        res.json({ success: true, message: 'Promotion deleted' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ success: false, message: 'Failed to delete promotion' });
    }
};

// --- Social Interactions ---

export const toggleLike = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.body.userId;

        if (!userId) return res.status(401).json({ success: false, message: 'User must be logged in' });

        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM promotion_likes WHERE user_id = ? AND promotion_id = ?',
            [userId, id]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM promotion_likes WHERE user_id = ? AND promotion_id = ?', [userId, id]);
            return res.json({ success: true, liked: false });
        } else {
            await pool.query('INSERT INTO promotion_likes (user_id, promotion_id) VALUES (?, ?)', [userId, id]);
            return res.json({ success: true, liked: true });
        }
    } catch (error) {
        console.error('Error in toggleLike:', error);
        res.status(500).json({ success: false, message: 'Failed to process like' });
    }
};

export const toggleSave = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // promotion id
        const userId = req.body.userId;

        if (!userId) return res.status(401).json({ success: false, message: 'User must be logged in' });

        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM promotion_saves WHERE user_id = ? AND promotion_id = ?',
            [userId, id]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM promotion_saves WHERE user_id = ? AND promotion_id = ?', [userId, id]);
            return res.json({ success: true, saved: false });
        } else {
            await pool.query('INSERT INTO promotion_saves (user_id, promotion_id) VALUES (?, ?)', [userId, id]);
            return res.json({ success: true, saved: true });
        }
    } catch (error) {
        console.error('Error toggling save:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle save' });
    }
};

export const toggleFollow = async (req: Request, res: Response) => {
    try {
        const { catererId } = req.params;
        const followerId = req.body.userId;

        if (!followerId) return res.status(401).json({ success: false, message: 'User must be logged in' });

        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM caterer_follows WHERE follower_id = ? AND caterer_id = ?',
            [followerId, catererId]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM caterer_follows WHERE follower_id = ? AND caterer_id = ?', [followerId, catererId]);
            return res.json({ success: true, following: false });
        } else {
            await pool.query('INSERT INTO caterer_follows (follower_id, caterer_id) VALUES (?, ?)', [followerId, catererId]);
            return res.json({ success: true, following: true });
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle follow' });
    }
};

export const incrementShareCount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE promotions SET shares_count = shares_count + 1 WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error incrementing share count:', error);
        res.status(500).json({ success: false, message: 'Failed to track share' });
    }
};

export const getVendorPromotionStats = async (req: Request, res: Response) => {
    try {
        const { vendorId } = req.params;

        // Get caterer for this vendor
        const [caterers] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM caterers WHERE vendor_id = ?',
            [vendorId]
        );

        if (caterers.length === 0) {
            return res.json({ success: true, stats: { followers: 0, promotions: [] } });
        }

        const catererId = caterers[0].id;

        // Total followers
        const [followersResult] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM caterer_follows WHERE caterer_id = ?',
            [catererId]
        );
        const totalFollowers = Number(followersResult[0]?.total || 0);

        // Per-promotion stats
        const [promoStats] = await pool.query<RowDataPacket[]>(
            `SELECT p.id, p.caption, p.media_type, p.media_url, p.shares_count, p.created_at,
               (SELECT COUNT(*) FROM promotion_likes WHERE promotion_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM promotion_saves WHERE promotion_id = p.id) as saves_count
             FROM promotions p
             WHERE p.caterer_id = ?
             ORDER BY p.created_at DESC`,
            [catererId]
        );

        const formattedPromos = promoStats.map(p => ({
            ...p,
            likes_count: Number(p.likes_count),
            saves_count: Number(p.saves_count),
            shares_count: Number(p.shares_count || 0)
        }));

        const totalLikes = formattedPromos.reduce((sum, p) => sum + p.likes_count, 0);
        const totalShares = formattedPromos.reduce((sum, p) => sum + p.shares_count, 0);

        res.json({
            success: true,
            stats: {
                followers: totalFollowers,
                total_likes: totalLikes,
                total_shares: totalShares,
                promotions: formattedPromos
            }
        });
    } catch (error) {
        console.error('Error fetching vendor promotion stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT pc.*, p.name as user_name, p.avatar_url as user_avatar
             FROM promotion_comments pc
             JOIN profiles p ON pc.user_id = p.user_id
             WHERE pc.promotion_id = ?
             ORDER BY pc.created_at DESC`,
            [id]
        );
        res.json({ success: true, comments: rows });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, comment } = req.body;

        if (!userId) return res.status(401).json({ success: false, message: 'User must be logged in' });
        if (!comment?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty' });

        const commentId = crypto.randomUUID();
        await pool.query(
            'INSERT INTO promotion_comments (id, user_id, promotion_id, comment) VALUES (?, ?, ?, ?)',
            [commentId, userId, id, comment.trim()]
        );

        // Fetch the newly created comment with user info
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT pc.*, p.name as user_name, p.avatar_url as user_avatar
             FROM promotion_comments pc
             JOIN profiles p ON pc.user_id = p.user_id
             WHERE pc.id = ?`,
            [commentId]
        );

        res.status(201).json({ success: true, comment: rows[0] });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
};
