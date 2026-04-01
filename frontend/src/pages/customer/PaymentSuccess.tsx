import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import confetti from 'canvas-confetti';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    // Fire a nice celebration confetti effect on success!
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#800020', '#F5E6D3', '#D4AF37'] // burgundy, champagne, gold
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#800020', '#F5E6D3', '#D4AF37']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg shadow-xl overflow-hidden border-t-8 border-t-green-500">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="mb-2 font-display text-4xl font-bold tracking-tight text-foreground">
              Payment Successful!
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground">
              Your booking has been fully confirmed and the caterer has been notified. We can't wait for your fantastic event!
            </p>
            
            {bookingId && (
              <div className="mb-8 rounded-lg bg-muted/50 p-4 border w-full">
                <p className="text-sm font-medium text-muted-foreground mb-1">Booking Reference</p>
                <p className="font-mono text-xs text-foreground/80 break-all">{bookingId}</p>
              </div>
            )}

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full flex-1" size="lg">
                <Link to="/customer/dashboard" className="gap-2">
                  View My Bookings
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
