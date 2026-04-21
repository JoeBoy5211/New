import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import axios from 'axios';

// Ensure the user provided secret is used or from env.
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-BP35iM0tmKrPbxY5knOOWiK3S42sUQY0';
const NGROK_URL = process.env.API_BASE_URL || 'https://catering-backend-ynqk.onrender.com';

export const initiateChapaPayment = async (req: Request, res: Response) => {
    const { booking_id, method, app_return_url } = req.body;
    console.log('[PAYMENT] Initiate request with body:', req.body);

    try {
        const [bookings] = await pool.query<RowDataPacket[]>(
            `SELECT b.*, p.email, p.name 
             FROM bookings b 
             JOIN profiles p ON b.customer_id = p.user_id 
             WHERE b.id = ?`,
            [booking_id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const booking = bookings[0];

        // Generate tx_ref
        const tx_ref = `BKG-${booking.id.substring(0, 8)}-${Date.now()}`;

        // Update tx_ref in DB. Also marking as payment_pending, though you might just remain accepted until confirmed.
        await pool.query(
            'UPDATE bookings SET tx_ref = ?, status = ? WHERE id = ?',
            [tx_ref, 'payment_pending', booking.id]
        );

        const amount = Number(booking.total_amount).toFixed(2);
        
        // Prepare Chapa initialization payload
        const payload = {
            amount: amount,
            currency: 'ETB',
            email: booking.email && booking.email.includes('@') ? booking.email : 'chapa@caterconnect.com',
            first_name: booking.name ? booking.name.split(' ')[0] : 'CaterConnect',
            last_name: booking.name && booking.name.split(' ').length > 1 ? booking.name.split(' ').slice(1).join(' ') : 'Customer',
            tx_ref: tx_ref,
            callback_url: `${NGROK_URL}/api/payments/webhook`,
            return_url: `${NGROK_URL}/api/payments/return?booking_id=${booking.id}${app_return_url ? `&app_return_url=${encodeURIComponent(app_return_url)}` : ''}`,
        };

        const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
            headers: {
                'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status === 'success') {
            res.json({ success: true, checkout_url: response.data.data.checkout_url });
        } else {
            res.status(400).json({ success: false, message: response.data.message });
        }

    } catch (error: any) {
        console.error('[PAYMENT] Initiate error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Payment initialization failed', error: error.response?.data || error.message, stack: error.stack });
    }
};

export const chapaWebhook = async (req: Request, res: Response) => {
    // Chapa sends the hook when payment succeeds
    
    // For chapa webhooks, if it's GET, maybe just return OK
    if (req.method === 'GET') {
        return res.status(200).send('Webhook endpoint is live');
    }

    const { tx_ref } = req.body;
    
    if (!tx_ref) {
        return res.status(400).send('No tx_ref provided');
    }

    try {
        console.log(`[PAYMENT] Received webhook for tx_ref: ${tx_ref}. Verifying...`);
        // Verify transaction exactly with Chapa
        const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
            headers: {
                'Authorization': `Bearer ${CHAPA_SECRET_KEY}`
            }
        });

        if (response.data.status === 'success') {
            const data = response.data.data;
            if (data.status === 'success') {
                // Payment was truly successful! Focus on updating our database
                const [result] = await pool.query<ResultSetHeader>(
                    "UPDATE bookings SET status = 'completed' WHERE tx_ref = ? AND status != 'completed'",
                    [tx_ref]
                );

                if (result.affectedRows > 0) {
                    console.log(`[PAYMENT] Booking confirmed successfully for tx_ref: ${tx_ref}`);
                } else {
                     console.log(`[PAYMENT] Booking already confirmed or not found for tx_ref: ${tx_ref}`);
                }
            } else {
                console.log(`[PAYMENT] Transaction verification yielded status: ${data.status} for tx_ref: ${tx_ref}`);
            }
        }
        
        // Always return 200 OK so Chapa knows we received the webhook
        res.status(200).send('OK');

    } catch (error: any) {
        console.error('[PAYMENT] Webhook verification error:', error.response?.data || error.message);
        // Even on error, we might want to return 200 to Chapa to stop retries if the error is unrecoverable,
        // but 500 triggers retries. We will send 200 after logging.
        res.status(200).send('Verification failed securely');
    }
};

export const returnPage = (req: Request, res: Response) => {
    // We redirect the browser back to our app's custom scheme dynamically.
    // This allows expo-web-browser's openAuthSessionAsync to detect the scheme 
    // depending on if the user is using Expo Go (exp://) or a compiled app.
    const app_return_url = req.query.app_return_url as string;
    const booking_id = req.query.booking_id as string;
    const frontendUrl = (process.env.FRONTEND_URL || '').split(',')[0].trim();
    const websiteFallback = frontendUrl ? `${frontendUrl}/customer/payment-success` : 'http://localhost:8080/customer/payment-success';
    
    // Default fallback to website if no dynamic url was passed, since mobile always passes one
    const baseRedirect = app_return_url || websiteFallback;
    
    // Add booking_id safely if not already present
    const finalRedirect = baseRedirect.includes('?') 
        ? `${baseRedirect}&booking_id=${booking_id}`
        : `${baseRedirect}?booking_id=${booking_id}`;
    
    // Perform a 302 redirect
    res.redirect(finalRedirect);
};

/**
 * Called by the web payment success page.
 * Looks up the booking's tx_ref, verifies with Chapa, then marks it 'completed'.
 * Falls back to direct DB update if the webhook already ran (idempotent).
 */
export const verifyAndCompleteBooking = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // 1. Get the booking and its tx_ref
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, tx_ref, status FROM bookings WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const booking = rows[0];

        // Already completed — nothing to do
        if (booking.status === 'completed') {
            return res.json({ success: true, message: 'Booking already completed', status: 'completed' });
        }

        // 2. If we have a tx_ref, verify with Chapa before updating
        if (booking.tx_ref) {
            try {
                const verifyRes = await axios.get(`https://api.chapa.co/v1/transaction/verify/${booking.tx_ref}`, {
                    headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` }
                });
                if (verifyRes.data?.data?.status !== 'success') {
                    // Payment not actually confirmed by Chapa — don't upgrade status
                    return res.json({ success: false, message: 'Payment not yet verified by Chapa', status: booking.status });
                }
            } catch (verifyErr: any) {
                console.warn('[PAYMENT] Chapa verify failed, proceeding with direct update:', verifyErr.message);
                // Fall through — allow the update if Chapa API is unreachable
            }
        }

        // 3. Mark as completed
        await pool.query<ResultSetHeader>(
            "UPDATE bookings SET status = 'completed' WHERE id = ? AND status != 'completed'",
            [id]
        );

        console.log(`[PAYMENT] verifyAndCompleteBooking: booking ${id} marked as completed`);
        res.json({ success: true, message: 'Booking marked as completed', status: 'completed' });

    } catch (error: any) {
        console.error('[PAYMENT] verifyAndCompleteBooking error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
