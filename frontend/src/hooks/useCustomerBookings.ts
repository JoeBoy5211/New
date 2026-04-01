import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Helper to convert relative URLs to absolute URLs
const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
};

export function useCustomerBookings() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = useCallback(async () => {
        if (!user?.id) return;

        try {
            const response = await api.get(`/bookings/customer/${user.id}`);
            if (response.success) {
                const mapped = response.data.map((b: any) => ({
                    ...b,
                    cover_image: getImageUrl(b.cover_image)
                }));
                setBookings(mapped);
            } else {
                setError(response.message || 'Failed to fetch bookings');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    return { bookings, isLoading, error, refresh: fetchBookings };
}
