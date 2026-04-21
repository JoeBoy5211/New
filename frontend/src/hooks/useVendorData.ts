import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
};

export function useVendorData() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (silent = false) => {
        if (!user?.id) return;
        if (!silent) setIsLoading(true);
        try {
            const response = await api.get(`/vendor/dashboard/${user.id}`);
            if (response.success) {
                const mappedData = {
                    ...response.data,
                    caterer: {
                        ...response.data.caterer,
                        cover_image: getImageUrl(response.data.caterer.cover_image)
                    },
                    menuItems: response.data.menuItems.map((m: any) => ({
                        id: m.id,
                        name: m.name,
                        description: m.description,
                        price: m.price,
                        category: m.category,
                        isPopular: m.is_popular,
                        image: getImageUrl(m.image)
                    })),
                    reviews: response.data.reviews.map((r: any) => ({
                        ...r,
                        customerName: r.customerName,
                        createdAt: r.created_at
                    }))
                };
                setData(mappedData);
            } else {
                setError(response.message || 'Failed to fetch vendor data');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const updateBookingStatus = async (bookingId: string, status: string) => {
        try {
            const response = await api.patch(`/vendor/bookings/${bookingId}/status`, { status });
            if (response.success) {
                fetchData(); // Refresh
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    const addMenuItem = async (item: any) => {
        try {
            const response = await api.post('/vendor/menu', { ...item, caterer_id: data.caterer.id });
            if (response.success) {
                fetchData(); // Refresh
                return { success: true, data: response.data };
            }
            return { success: false, message: response.message };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    const updateMenuItem = async (itemId: string, item: any) => {
        try {
            const response = await api.patch(`/vendor/menu/${itemId}`, item);
            if (response.success) {
                fetchData(); // Refresh
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    const deleteMenuItem = async (itemId: string) => {
        try {
            const response = await api.delete(`/vendor/menu/${itemId}`);
            if (response.success) {
                fetchData(); // Refresh
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    const updateProfile = async (profileData: any) => {
        try {
            const response = await api.patch(`/vendor/profile/${data.caterer.id}`, profileData);
            if (response.success) {
                fetchData(); // Refresh
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    return {
        data,
        isLoading,
        error,
        updateBookingStatus,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        updateProfile,
        refresh: fetchData
    };
}

export function useVendorAnalytics() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user?.id) return;
            setIsLoading(true);
            try {
                const response = await api.get(`/vendor/analytics/${user.id}`);
                if (response.success) {
                    setAnalytics(response.data);
                } else {
                    setError(response.message || 'Failed to fetch analytics');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [user?.id]);

    return { analytics, isLoading, error };
}
