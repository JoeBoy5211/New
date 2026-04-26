import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface AdminStats {
    totalCaterers: number;
    pendingCaterers: number;
    totalCustomers: number;
    totalBookings: number;
    totalRevenue: number;
}

export interface Caterer {
    id: string;
    name: string;
    location: string;
    cuisines: string;
    rating: number;
    review_count: number;
    is_approved: boolean;
    is_pending: boolean;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    booking_count: number;
}

export interface Booking {
    id: string;
    customer_id: string;
    customer_name: string;
    caterer_id: string;
    caterer_name: string;
    event_date: string;
    guest_count: number;
    status: string;
    total_amount: number;
}

export interface Review {
    id: string;
    customer_id: string;
    customer_name: string;
    caterer_id: string;
    caterer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface AnalyticsData {
    bookingTrends: {
        month: string;
        bookings: number;
        completed: number;
        cancelled: number;
    }[];
    revenueData: {
        month: string;
        revenue: number;
        platformFee: number;
    }[];
    vendorPerformance: {
        name: string;
        fullName: string;
        bookings: number;
        revenue: number;
        rating: string | number;
        reviews: number;
    }[];
    bookingStatusData: {
        name: string;
        value: number;
    }[];
    cuisinePopularity: {
        name: string;
        popularity: number;
    }[];
}

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    phone: string;
    isSuperAdmin: boolean;
    promoted_at: string;
    user_created_at: string;
}

export interface AdminNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    related_id: string;
    related_type: string;
    is_read: boolean;
    created_at: string;
}

export interface Cuisine {
    id: string;
    name: string;
}

export interface EventType {
    id: string;
    name: string;
}

export function useAdminData(isSuperAdmin: boolean = false) {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [caterers, setCaterers] = useState<Caterer[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [cuisines, setCuisines] = useState<Cuisine[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const requests = [
                api.get('/admin/stats'),
                api.get('/admin/caterers'),
                api.get('/admin/customers'),
                api.get('/admin/bookings'),
                api.get('/admin/reviews'),
                api.get('/admin/analytics'),
                api.get('/admin/notifications'),
                api.get('/admin/cuisines'),
                api.get('/admin/event-types'),
            ];

            if (isSuperAdmin) {
                requests.push(api.get('/admin/admins'));
            }

            const results = await Promise.all(requests);

            setStats(results[0].data);
            setCaterers(results[1].data);
            setCustomers(results[2].data);
            setBookings(results[3].data);
            setReviews(results[4].data);
            setAnalytics(results[5].data);
            setNotifications(results[6].data);
            setUnreadNotificationsCount(results[6].unreadCount || 0);
            setCuisines(results[7].data || []);
            setEventTypes(results[8].data || []);

            if (isSuperAdmin && results[9]) {
                setAdmins(results[9].data);
            }
        } catch (error) {
            console.error('[ADMIN] Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const approveCaterer = async (catererId: string) => {
        try {
            await api.post(`/admin/caterers/${catererId}/approve`, {});
            // Refresh data
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Approve caterer error:', error);
            return { success: false };
        }
    };

    const rejectCaterer = async (catererId: string) => {
        try {
            await api.delete(`/admin/caterers/${catererId}`);
            // Refresh data
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Reject caterer error:', error);
            return { success: false };
        }
    };

    const deleteReview = async (reviewId: string) => {
        try {
            await api.delete(`/admin/reviews/${reviewId}`);
            // Refresh data
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Delete review error:', error);
            return { success: false };
        }
    };

    const updateUserRole = async (userId: string, role: string) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role });
            // Refresh data
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Update user role error:', error);
            return { success: false };
        }
    };

    const promoteToAdmin = async (userId: string) => {
        try {
            await api.post(`/admin/users/${userId}/promote`, {});
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Promote to admin error:', error);
            return { success: false };
        }
    };

    const deleteAdmin = async (adminId: string) => {
        try {
            await api.delete(`/admin/admins/${adminId}`);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Delete admin error:', error);
            return { success: false };
        }
    };

    const markNotificationRead = async (id: string) => {
        try {
            await api.patch(`/admin/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Mark notification read error:', error);
            return { success: false };
        }
    };

    const markAllNotificationsRead = async () => {
        try {
            await api.patch('/admin/notifications/read-all', {});
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadNotificationsCount(0);
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Mark all notifications read error:', error);
            return { success: false };
        }
    };

    const createCuisine = async (name: string) => {
        try {
            await api.post('/admin/cuisines', { name });
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Create cuisine error:', error);
            return { success: false };
        }
    };

    const deleteCuisine = async (id: string) => {
        try {
            await api.delete(`/admin/cuisines/${id}`);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Delete cuisine error:', error);
            return { success: false };
        }
    };

    const createEventType = async (name: string) => {
        try {
            await api.post('/admin/event-types', { name });
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Create event type error:', error);
            return { success: false };
        }
    };

    const deleteEventType = async (id: string) => {
        try {
            await api.delete(`/admin/event-types/${id}`);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('[ADMIN] Delete event type error:', error);
            return { success: false };
        }
    };

    return {
        stats,
        caterers,
        customers,
        bookings,
        reviews,
        analytics,
        admins,
        notifications,
        unreadNotificationsCount,
        isLoading,
        approveCaterer,
        rejectCaterer,
        deleteReview,
        updateUserRole,
        promoteToAdmin,
        deleteAdmin,
        markNotificationRead,
        markAllNotificationsRead,
        cuisines,
        eventTypes,
        createCuisine,
        deleteCuisine,
        createEventType,
        deleteEventType,
        refreshData: fetchData,
    };
}
