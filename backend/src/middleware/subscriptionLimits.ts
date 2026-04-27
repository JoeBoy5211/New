import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

/**
 * Check if vendor has access to a specific feature based on subscription tier
 */
export const checkSubscriptionLimit = (feature: 'menu_items' | 'services' | 'video_upload' | 'bookings') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // Get caterer id
            const [caterers] = await pool.query<RowDataPacket[]>(
                'SELECT id FROM caterers WHERE vendor_id = ?',
                [userId]
            );

            if (caterers.length === 0) {
                return res.status(404).json({ success: false, message: 'Caterer not found' });
            }

            const catererId = caterers[0].id;

            // Get subscription tier
            const [subscriptions] = await pool.query<RowDataPacket[]>(
                'SELECT current_tier, trial_ends_at, subscription_ends_at FROM vendor_subscriptions WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 1',
                [userId]
            );

            const subscription = subscriptions[0];
            const now = new Date();
            let tier = 'free';

            if (subscription) {
                // Check if tier is expired
                if (subscription.current_tier === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) > now) {
                    tier = 'trial';
                } else if (subscription.current_tier === 'premium' && subscription.subscription_ends_at && new Date(subscription.subscription_ends_at) > now) {
                    tier = 'premium';
                }
            }

            // Premium and trial users have full access
            if (tier === 'premium' || tier === 'trial') {
                return next();
            }

            // Free tier checks
            switch (feature) {
                case 'services':
                    return res.status(403).json({
                        success: false,
                        message: 'Additional services require a Premium subscription',
                        code: 'SUBSCRIPTION_REQUIRED',
                        upgrade_url: '/vendor/upgrade'
                    });

                case 'video_upload':
                    return res.status(403).json({
                        success: false,
                        message: 'Video uploads require a Premium subscription',
                        code: 'SUBSCRIPTION_REQUIRED',
                        upgrade_url: '/vendor/upgrade'
                    });

                case 'menu_items': {
                    // Count existing menu items
                    const [countRes] = await pool.query<RowDataPacket[]>(
                        'SELECT COUNT(*) as count FROM menu_items WHERE caterer_id = ?',
                        [catererId]
                    );
                    const count = Number(countRes[0]?.count || 0);
                    if (count >= 6) {
                        return res.status(403).json({
                            success: false,
                            message: 'Free plan limited to 6 menu items. Upgrade to Premium for unlimited items.',
                            code: 'MENU_LIMIT_REACHED',
                            current_count: count,
                            limit: 6,
                            upgrade_url: '/vendor/upgrade'
                        });
                    }
                    break;
                }

                case 'bookings': {
                    // Count monthly accepted/completed bookings
                    const [countRes] = await pool.query<RowDataPacket[]>(
                        `SELECT COUNT(*) as count FROM bookings 
                         WHERE caterer_id = ? AND status IN ('accepted', 'completed') 
                         AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
                        [catererId]
                    );
                    const count = Number(countRes[0]?.count || 0);
                    if (count >= 3) {
                        return res.status(403).json({
                            success: false,
                            message: 'Free plan limited to 3 bookings per month. Upgrade to Premium for unlimited bookings.',
                            code: 'BOOKING_LIMIT_REACHED',
                            current_count: count,
                            limit: 3,
                            upgrade_url: '/vendor/upgrade'
                        });
                    }
                    break;
                }
            }

            next();
        } catch (error: any) {
            console.error('[SUBSCRIPTION_LIMIT] Error:', error.message);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
};

/**
 * Middleware to inject subscription info into request for use in controllers
 */
export const injectSubscriptionInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next();
        }

        const [subscriptions] = await pool.query<RowDataPacket[]>(
            'SELECT current_tier, trial_ends_at, subscription_ends_at FROM vendor_subscriptions WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        const subscription = subscriptions[0];
        const now = new Date();
        let tier = 'free';

        if (subscription) {
            if (subscription.current_tier === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) > now) {
                tier = 'trial';
            } else if (subscription.current_tier === 'premium' && subscription.subscription_ends_at && new Date(subscription.subscription_ends_at) > now) {
                tier = 'premium';
            }
        }

        (req as any).subscriptionTier = tier;
        next();
    } catch (error) {
        next();
    }
};
