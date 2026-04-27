import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import confetti from 'canvas-confetti';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get('subscription_id');
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null);

  useEffect(() => {
    // Fire confetti celebration
    const duration = 2 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#800020', '#F5E6D3', '#D4AF37'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#800020', '#F5E6D3', '#D4AF37'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    const markCompleted = async () => {
      if (!subscriptionId) {
        setIsVerifying(false);
        return;
      }
      try {
        await api.get(`/subscriptions/verify-payment/${subscriptionId}`);
        setVerifiedStatus('success');
      } catch (err) {
        console.error('[SubscriptionSuccess] Could not verify/complete subscription:', err);
      } finally {
        setIsVerifying(false);
      }
    };
    markCompleted();
  }, [subscriptionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg shadow-xl overflow-hidden border-t-8 border-t-green-500">
        <CardContent className="flex flex-col items-center p-12 text-center">

          {isVerifying ? (
            <>
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <h1 className="mb-2 font-display text-3xl font-bold">Verifying Subscription…</h1>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </>
          ) : (
            <>
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>

              <h1 className="mb-2 font-display text-4xl font-bold tracking-tight text-foreground">
                Subscription Upgraded!
              </h1>

              <p className="mb-8 text-lg text-muted-foreground">
                Your payment has been successfully processed. You now have access to premium features and unlimited uploads!
              </p>

              {subscriptionId && (
                <div className="mb-8 rounded-lg bg-muted/50 p-4 border w-full">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Transaction Reference</p>
                  <p className="font-mono text-xs text-foreground/80 break-all">{subscriptionId}</p>
                </div>
              )}

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <Button asChild className="w-full flex-1" size="lg">
                  <Link to="/vendor/dashboard" className="gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
