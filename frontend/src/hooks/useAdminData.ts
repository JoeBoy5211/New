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

export function useAdminData() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [caterers, setCaterers] = useState<Caterer[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, caterersRes, customersRes, bookingsRes, reviewsRes, analyticsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/caterers'),
                api.get('/admin/customers'),
                api.get('/admin/bookings'),
                api.get('/admin/reviews'),
                api.get('/admin/analytics'),
            ]);

            setStats(statsRes.data);
            setCaterers(caterersRes.data);
            setCustomers(customersRes.data);
            setBookings(bookingsRes.data);
            setReviews(reviewsRes.data);
            setAnalytics(analyticsRes.data);
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

    return {
        stats,
        caterers,
        customers,
        bookings,
        reviews,
        analytics,
        isLoading,
        approveCaterer,
        rejectCaterer,
        deleteReview,
        updateUserRole,
        refreshData: fetchData,
    };
}
