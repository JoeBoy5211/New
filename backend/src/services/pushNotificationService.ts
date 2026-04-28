import axios from 'axios';

interface PushMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: 'default' | null;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
}

/**
 * Sends push notifications via Expo's Push API.
 * Tokens must be in the format: ExponentPushToken[xxxxxxx]
 */
export const sendPushNotification = async (messages: PushMessage | PushMessage[]) => {
    const payload = Array.isArray(messages) ? messages : [messages];

    // Filter out any invalid tokens
    const validPayload = payload.filter(m => m.to && m.to.startsWith('ExponentPushToken'));

    if (validPayload.length === 0) {
        console.log('[PUSH] No valid Expo push tokens to send to.');
        return;
    }

    try {
        const response = await axios.post(
            'https://exp.host/--/api/v2/push/send',
            validPayload,
            {
                headers: {
                    Accept: 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            }
        );
        console.log('[PUSH] Notification sent successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('[PUSH] Failed to send notification:', error?.response?.data || error.message);
    }
};

/**
 * Send a booking status update push notification to a customer.
 */
export const sendBookingStatusNotification = async (
    pushToken: string,
    status: 'accepted' | 'declined',
    catererName: string,
    bookingId: string
) => {
    const isAccepted = status === 'accepted';

    return sendPushNotification({
        to: pushToken,
        title: isAccepted ? '✅ Booking Accepted!' : '❌ Booking Declined',
        body: isAccepted
            ? `${catererName} has accepted your booking. Tap to complete payment.`
            : `Unfortunately, ${catererName} has declined your booking request.`,
        data: {
            bookingId,
            status,
            screen: isAccepted ? `/booking/${bookingId}/pay` : '/profile',
        },
        sound: 'default',
        priority: 'high',
    });
};
