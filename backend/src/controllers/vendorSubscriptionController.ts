import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import axios from 'axios';

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-BP35iM0tmKrPbxY5knOOWiK3S42sUQY0';
const NGROK_URL = process.env.API_BASE_URL || 'https://catering-backend-ynqk.onrender.com';

const SUBSCRIPTION_PRICE = process.env.VENDOR_SUBSCRIPTION_PRICE || '50000';
const SUBSCRIPTION_DURATION_MONTHS = parseInt(process.env.VENDOR_SUBSCRIPTION_DURATION_MONTHS || '12');

/**
 * Check vendor's current subscription tier and limits
 */
export const getVendorSubscription = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Get caterer info
        const [caterers] = await pool.query<RowDataPacket[]>(
            'SELECT id, vendor_id FROM caterers WHERE vendor_id = ?',
            [userId]
        );

        if (caterers.length === 0) {
            return res.status(404).json({ success: false, message: 'Caterer not found' });
        }

        const catererId = caterers[0].id;

        // Get subscription info
        const [subscriptions] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM vendor_subscriptions WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        // Get current counts for limits display
        const [menuCountRes] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM menu_items WHERE caterer_id = ?',
            [catererId]
        );
        const menuCount = Number(menuCountRes[0]?.count || 0);

        const [serviceCountRes] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM caterer_services WHERE caterer_id = ?',
            [catererId]
        );
        const serviceCount = Number(serviceCountRes[0]?.count || 0);

        // Monthly accepted bookings count
        const [bookingCountRes] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE caterer_id = ? AND status IN ('accepted', 'completed') 
             AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
            [catererId]
        );
        const monthlyBookingCount = Number(bookingCountRes[0]?.count || 0);

        let subscription = subscriptions[0];

        // Auto-downgrade expired trial/premium
        if (subscription) {
            const now = new Date();
            let needsUpdate = false;
            let newTier = subscription.current_tier;

            if (subscription.current_tier === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < now) {
                newTier = 'free';
                needsUpdate = true;
            }
            if (subscription.current_tier === 'premium' && subscription.subscription_ends_at && new Date(subscription.subscription_ends_at) < now) {
                newTier = 'free';
                needsUpdate = true;
            }

            if (needsUpdate) {
                await pool.query(
                    'UPDATE vendor_subscriptions SET current_tier = ? WHERE id = ?',
                    [newTier, subscription.id]
                );
                subscription.current_tier = newTier;
            }
        }

        // Default limits
        const tier = subscription?.current_tier || 'trial';
        const limits = {
            menu_limit: tier === 'premium' || tier === 'trial' ? null : 6,
            services_enabled: tier === 'premium' || tier === 'trial',
            video_enabled: tier === 'premium' || tier === 'trial',
            monthly_booking_limit: tier === 'premium' || tier === 'trial' ? null : 3,
        };

        res.json({
            success: true,
            data: {
                tier,
                subscription: subscription || null,
                limits,
                usage: {
                    menu_items: menuCount,
                    services: serviceCount,
                    monthly_bookings: monthlyBookingCount,
                },
                price: Number(SUBSCRIPTION_PRICE),
            }
        });
    } catch (error: any) {
        console.error('[SUBSCRIPTION] Get error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Initiate Chapa payment for vendor subscription
 */
export const initiateSubscriptionPayment = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { method, app_return_url } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Get vendor profile info
        const [profiles] = await pool.query<RowDataPacket[]>(
            'SELECT p.name, p.email, u.email as user_email FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?',
            [userId]
        );

        const profile = profiles[0] || {};
        const email = profile.email || profile.user_email || 'vendor@caterconnect.com';
        const name = profile.name || 'Vendor';

        // Generate tx_ref for subscription
        const tx_ref = `SUB-${userId.substring(0, 8)}-${Date.now()}`;

        // Create pending subscription record
        const subscriptionId = crypto.randomUUID();
        await pool.query(
            `INSERT INTO vendor_subscriptions 
             (id, vendor_id, current_tier, tx_ref, payment_amount, payment_status, payment_method) 
             VALUES (?, ?, 'premium', ?, ?, 'pending', ?)`,
            [subscriptionId, userId, tx_ref, SUBSCRIPTION_PRICE, method || 'chapa']
        );

        const payload = {
            amount: SUBSCRIPTION_PRICE,
            currency: 'ETB',
            email: email.includes('@') ? email : 'vendor@caterconnect.com',
            first_name: name.split(' ')[0] || 'Vendor',
            last_name: name.split(' ').slice(1).join(' ') || 'CaterConnect',
            tx_ref: tx_ref,
            callback_url: `${NGROK_URL}/api/payments/webhook`,
            return_url: `${NGROK_URL}/api/payments/return-subscription?subscription_id=${subscriptionId}${app_return_url ? `&app_return_url=${encodeURIComponent(app_return_url)}` : ''}`,
        };

        const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
            headers: {
                'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status === 'success') {
            res.json({ success: true, checkout_url: response.data.data.checkout_url, subscription_id: subscriptionId });
        } else {
            res.status(400).json({ success: false, message: response.data.message });
        }
    } catch (error: any) {
        console.error('[SUBSCRIPTION] Initiate error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Payment initialization failed' });
    }
};

/**
 * Verify subscription payment after return from Chapa
 */
export const verifySubscriptionPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const [subscriptions] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM vendor_subscriptions WHERE id = ? AND vendor_id = ?',
            [id, userId]
        );

        if (subscriptions.length === 0) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        const subscription = subscriptions[0];

        if (subscription.payment_status === 'completed') {
            return res.json({ success: true, message: 'Subscription already active', tier: subscription.current_tier });
        }

        // Verify with Chapa if tx_ref exists
        if (subscription.tx_ref) {
            try {
                const verifyRes = await axios.get(`https://api.chapa.co/v1/transaction/verify/${subscription.tx_ref}`, {
                    headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` }
                });
                if (verifyRes.data?.data?.status !== 'success') {
                    return res.json({ success: false, message: 'Payment not yet verified by Chapa', status: subscription.payment_status });
                }
            } catch (verifyErr: any) {
                console.warn('[SUBSCRIPTION] Chapa verify failed:', verifyErr.message);
                // Fall through
            }
        }

        // Activate premium subscription
        const now = new Date();
        const subscriptionEndsAt = new Date(now);
        subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + SUBSCRIPTION_DURATION_MONTHS);

        const [prevSubs] = await pool.query<RowDataPacket[]>(
            'SELECT current_tier FROM vendor_subscriptions WHERE vendor_id = ? AND id != ? ORDER BY created_at DESC LIMIT 1',
            [userId, id]
        );
        const previousTier = prevSubs[0]?.current_tier || 'free';
        const convertedFromTrial = previousTier === 'trial';

        await pool.query(
            `UPDATE vendor_subscriptions 
             SET payment_status = 'completed', 
                 current_tier = 'premium',
                 previous_tier = ?,
                 subscription_started_at = ?,
                 subscription_ends_at = ?,
                 paid_at = ?,
                 converted_from_trial = ?,
                 converted_at = ?
             WHERE id = ?`,
            [
                previousTier,
                now,
                subscriptionEndsAt,
                now,
                convertedFromTrial,
                convertedFromTrial ? now : null,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            tier: 'premium',
            expires_at: subscriptionEndsAt,
        });
    } catch (error: any) {
        console.error('[SUBSCRIPTION] Verify error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Return page for subscription payment - redirects back to app
 */
export const subscriptionReturnPage = (req: Request, res: Response) => {
    const app_return_url = req.query.app_return_url as string;
    const subscription_id = req.query.subscription_id as string;
    const frontendUrl = (process.env.FRONTEND_URL || '').split(',')[0].trim();
    const websiteFallback = frontendUrl ? `${frontendUrl}/vendor/subscription-success` : 'http://localhost:8080/vendor/subscription-success';

    const baseRedirect = app_return_url || websiteFallback;
    const finalRedirect = baseRedirect.includes('?')
        ? `${baseRedirect}&subscription_id=${subscription_id}`
        : `${baseRedirect}?subscription_id=${subscription_id}`;

    res.redirect(finalRedirect);
};

/**
 * Handle subscription webhook (shared with booking webhook)
 * This should be called from the main webhook handler when tx_ref starts with SUB-
 */
export const handleSubscriptionWebhook = async (tx_ref: string): Promise<boolean> => {
    try {
        const [subscriptions] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM vendor_subscriptions WHERE tx_ref = ?',
            [tx_ref]
        );

        if (subscriptions.length === 0) return false;

        const subscription = subscriptions[0];

        if (subscription.payment_status === 'completed') {
            console.log(`[SUBSCRIPTION] Already completed for tx_ref: ${tx_ref}`);
            return true;
        }

        const now = new Date();
        const subscriptionEndsAt = new Date(now);
        subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + SUBSCRIPTION_DURATION_MONTHS);

        const [prevSubs] = await pool.query<RowDataPacket[]>(
            'SELECT current_tier FROM vendor_subscriptions WHERE vendor_id = ? AND id != ? ORDER BY created_at DESC LIMIT 1',
            [subscription.vendor_id, subscription.id]
        );
        const previousTier = prevSubs[0]?.current_tier || 'free';
        const convertedFromTrial = previousTier === 'trial';

        await pool.query(
            `UPDATE vendor_subscriptions 
             SET payment_status = 'completed', 
                 current_tier = 'premium',
                 previous_tier = ?,
                 subscription_started_at = ?,
                 subscription_ends_at = ?,
                 paid_at = ?,
                 converted_from_trial = ?,
                 converted_at = ?
             WHERE id = ?`,
            [
                previousTier,
                now,
                subscriptionEndsAt,
                now,
                convertedFromTrial,
                convertedFromTrial ? now : null,
                subscription.id
            ]
        );

        console.log(`[SUBSCRIPTION] Activated premium for vendor ${subscription.vendor_id}`);
        return true;
    } catch (error: any) {
        console.error('[SUBSCRIPTION] Webhook error:', error.message);
        return false;
    }
};
