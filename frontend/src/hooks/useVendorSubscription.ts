import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface SubscriptionData {
  tier: string;
  subscription: {
    id: string;
    current_tier: string;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    payment_status: string;
  } | null;
  limits: {
    menu_limit: number | null;
    services_enabled: boolean;
    video_enabled: boolean;
    monthly_booking_limit: number | null;
  };
  usage: {
    menu_items: number;
    services: number;
    monthly_bookings: number;
  };
  price: number;
}

export function useVendorSubscription() {
  const { user } = useAuth();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const response = await api.get('/subscriptions/status');
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch subscription data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user?.id]);

  const initiateUpgrade = async (returnUrl?: string) => {
    try {
      const response = await api.post('/subscriptions/initiate-payment', {
        method: 'chapa',
        app_return_url: returnUrl || window.location.href,
      });
      return response;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const verifyPayment = async (subscriptionId: string) => {
    try {
      const response = await api.get(`/subscriptions/verify-payment/${subscriptionId}`);
      if (response.success) {
        await fetchSubscription(); // Refresh subscription data
      }
      return response;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  return {
    data,
    isLoading,
    error,
    refresh: fetchSubscription,
    initiateUpgrade,
    verifyPayment,
  };
}
