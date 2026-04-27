import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface SubscriptionBannerProps {
  subscription: {
    tier: string;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    convertedFromTrial: boolean;
  } | null;
  limits: {
    menu_limit: number | null;
    services_enabled: boolean;
    video_enabled: boolean;
    monthly_booking_limit: number | null;
    monthly_bookings_used: number;
  } | null;
  price: number;
}

export function SubscriptionBanner({ subscription, limits, price }: SubscriptionBannerProps) {
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!subscription || !limits) return null;

  const { tier, trialEndsAt, subscriptionEndsAt } = subscription;

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const trialDays = getDaysRemaining(trialEndsAt);
  const premiumDays = getDaysRemaining(subscriptionEndsAt);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await api.post('/subscriptions/initiate-payment', {
        method: 'chapa',
        app_return_url: window.location.href,
      });

      if (res.success && res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        toast({ title: 'Error', description: res.message || 'Could not initiate payment', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Payment initiation failed', variant: 'destructive' });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (tier === 'premium') {
    const days = premiumDays ?? 365;
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Crown className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-green-800">Premium Active</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Unlimited</Badge>
              </div>
              <p className="text-sm text-green-600">
                {days > 30
                  ? `Premium expires on ${new Date(subscriptionEndsAt!).toLocaleDateString()}`
                  : `Premium expires in ${days} day${days !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tier === 'trial') {
    const days = trialDays ?? 0;
    const isEndingSoon = days <= 5 && days > 0;

    return (
      <Card className={isEndingSoon ? 'border-amber-200 bg-amber-50/50' : 'border-blue-200 bg-blue-50/50'}>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className={isEndingSoon ? 'p-2 bg-amber-100 rounded-full' : 'p-2 bg-blue-100 rounded-full'}>
              {isEndingSoon ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : (
                <Zap className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={isEndingSoon ? 'font-semibold text-amber-800' : 'font-semibold text-blue-800'}>
                  {isEndingSoon ? 'Trial Ending Soon' : 'Premium Trial Active'}
                </h3>
                <Badge variant="secondary" className={isEndingSoon ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                  {days} day{days !== 1 ? 's' : ''} left
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Enjoy all premium features. Upgrade now for uninterrupted access.
              </p>
            </div>
          </div>
          <Button onClick={handleUpgrade} disabled={isUpgrading} className="shrink-0">
            {isUpgrading ? 'Processing...' : `Upgrade Now - ETB ${price}/year`}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Free tier
  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-full">
            <CheckCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-orange-800">Free Plan</h3>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">Limited</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
              {limits.menu_limit !== null && (
                <span>Menu: {limits.monthly_bookings_used} items (max {limits.menu_limit})</span>
              )}
              {limits.monthly_booking_limit !== null && (
                <span>Bookings: {limits.monthly_bookings_used}/{limits.monthly_booking_limit} this month</span>
              )}
              {!limits.services_enabled && <span>No additional services</span>}
              {!limits.video_enabled && <span>No video uploads</span>}
            </div>
          </div>
        </div>
        <Button onClick={handleUpgrade} disabled={isUpgrading} className="shrink-0 bg-orange-600 hover:bg-orange-700">
          {isUpgrading ? 'Processing...' : `Upgrade to Premium - ETB ${price}/year`}
        </Button>
      </CardContent>
    </Card>
  );
}
