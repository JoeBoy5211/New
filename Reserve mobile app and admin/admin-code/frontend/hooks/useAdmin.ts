import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
export interface AdminStats {
    totalCaterers: number;
    pendingCaterers: number;
    totalCustomers: number;
    totalBookings: number;
    totalRevenue: number;
}

export interface BookingTrend {
    month: string;
    bookings: number;
    completed: number;
    cancelled: number;
}

export interface RevenueData {
    month: string;
    revenue: number;
    platformFee: number;
}

export interface VendorPerformance {
    name: string;
    fullName: string;
    bookings: number;
    revenue: number;
    rating: string;
    reviews: number;
}

export interface BookingStatusData {
    name: string;
    value: number;
}

export interface CuisinePopularity {
    name: string;
    popularity: number;
}

export interface AdminAnalytics {
    bookingTrends: BookingTrend[];
    revenueData: RevenueData[];
    vendorPerformance: VendorPerformance[];
    bookingStatusData: BookingStatusData[];
    cuisinePopularity: CuisinePopularity[];
}

export interface MonthlyRevenue {
    month: string;
    revenue: number;
    subscriptionsSold: number;
    trialConversions: number;
}

export interface TierDistribution {
    tier: string;
    count: number;
}

export interface SubscriptionTransaction {
    id: string;
    amount: number;
    status: string;
    paidAt: string;
    tier: string;
    convertedFromTrial: boolean;
    vendorName: string;
    vendorEmail: string;
}

export interface SubscriptionAnalytics {
    totalRevenue: number;
    totalSubscriptions: number;
    trialConversions: number;
    conversionRate: number;
    monthlyRevenue: MonthlyRevenue[];
    tierDistribution: TierDistribution[];
    recentTransactions: SubscriptionTransaction[];
}

export interface Caterer {
    id: string;
    name: string;
    location: string;
    cuisines: string[];
    event_types: string[];
    rating: number;
    review_count: number;
    is_approved: boolean;
    is_pending: boolean;
    vendor_id: string;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string | null;
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
    event_type: string;
    guest_count: number;
    status: string;
    total_amount: number | null;
    created_at: string;
}

export interface Review {
    id: string;
    customer_id: string;
    customer_name: string;
    caterer_id: string;
    caterer_name: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    isSuperAdmin: boolean;
    promoted_at: string;
    user_created_at: string;
}

export interface AdminNotification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    related_id: string | null;
    related_type: string | null;
    is_read: boolean;
    created_at: string;
}

// Stats
export function useAdminStats() {
    return useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            const response = await api.get('/admin/stats');
            if (!response.success) throw new Error(response.message);
            return response.data as AdminStats;
        },
    });
}

// Analytics
export function useAdminAnalytics() {
    return useQuery({
        queryKey: ['admin', 'analytics'],
        queryFn: async () => {
            const response = await api.get('/admin/analytics');
            if (!response.success) throw new Error(response.message);
            return response.data as AdminAnalytics;
        },
    });
}

// Caterers
export function useAdminCaterers() {
    return useQuery({
        queryKey: ['admin', 'caterers'],
        queryFn: async () => {
            const response = await api.get('/admin/caterers');
            if (!response.success) throw new Error(response.message);
            return response.data as Caterer[];
        },
    });
}

export function useApproveCaterer() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (catererId: string) => {
            const response = await api.post(`/admin/caterers/${catererId}/approve`, {});
            if (!response.success) throw new Error(response.message);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'caterers'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
    });
}

export function useRejectCaterer() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (catererId: string) => {
            const response = await api.delete(`/admin/caterers/${catererId}`);
            if (!response.success) throw new Error(response.message);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'caterers'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
    });
}

// Customers
export function useAdminCustomers() {
    return useQuery({
        queryKey: ['admin', 'customers'],
        queryFn: async () => {
            const response = await api.get('/admin/customers');
            if (!response.success) throw new Error(response.message);
            return response.data as Customer[];
        },
    });
}

// Bookings
export function useAdminBookings() {
    return useQuery({
        queryKey: ['admin', 'bookings'],
        queryFn: async () => {
            const response = await api.get('/admin/bookings');
            if (!response.success) throw new Error(response.message);
            return response.data as Booking[];
        },
    });
}

// Reviews
export function useAdminReviews() {
    return useQuery({
        queryKey: ['admin', 'reviews'],
        queryFn: async () => {
            const response = await api.get('/admin/reviews');
            if (!response.success) throw new Error(response.message);
            return response.data as Review[];
        },
    });
}

export function useDeleteReview() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (reviewId: string) => {
            const response = await api.delete(`/admin/reviews/${reviewId}`);
            if (!response.success) throw new Error(response.message);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
    });
}

// Admin Management (Super Admin)
export function useAdminUsers() {
    return useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const response = await api.get('/admin/admins');
            if (!response.success) throw new Error(response.message);
            return response.data as AdminUser[];
        },
    });
}

export function usePromoteToAdmin() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.post(`/admin/users/${userId}/promote`, {});
            if (!response.success) throw new Error(response.message);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}

export function useDeleteAdmin() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (adminId: string) => {
            const response = await api.delete(`/admin/admins/${adminId}`);
            if (!response.success) throw new Error(response.message);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}

// Notifications
export function useAdminNotifications() {
    return useQuery({
        queryKey: ['admin', 'notifications'],
        queryFn: async () => {
            const response = await api.get('/admin/notifications');
            if (!response.success) throw new Error(response.message);
            return response.data as { data: AdminNotification[]; unreadCount: number };
        },
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await api.patch(`/admin/notifications/${notificationId}/read`, {});
            if (!response.success) throw new Error(response.message);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async () => {
            const response = await api.patch('/admin/notifications/read-all', {});
            if (!response.success) throw new Error(response.message);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
        },
    });
}
