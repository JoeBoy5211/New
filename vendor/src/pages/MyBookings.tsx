import { Link } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useCustomerBookings, type BookingWithCaterer } from '@/hooks/supabase/useBookings';

export default function MyBookings() {
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useCustomerBookings(user?.id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size={40} text="Loading your bookings..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track requests you sent to caterers.</p>

        {bookings.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">
              <CalendarX className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-semibold">No bookings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Browse caterers, pick packages and send your first request.</p>
              <Button className="mt-5" asChild>
                <Link to="/caterers">Browse caterers</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 space-y-3">
            {(bookings as BookingWithCaterer[]).map((b) => (
              <Card key={b.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.caterer?.name ?? 'Caterer'}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {b.event_type} · {b.guest_count} guests · {new Date(b.event_date).toLocaleDateString()}
                      {b.venue ? ` · ${b.venue}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(b.package_ids ?? []).length > 0 ? `${(b.package_ids ?? []).length} package(s)` : ''}
                      {(b.package_ids ?? []).length > 0 && (b.menu_selections ?? []).length > 0 ? ' · ' : ''}
                      {(b.menu_selections ?? []).length > 0 ? `${(b.menu_selections ?? []).length} dish(es)` : ''}
                      {b.total_amount != null ? ` · $${Number(b.total_amount).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <Badge variant={b.status === 'pending' ? 'secondary' : b.status === 'accepted' ? 'default' : 'outline'}>
                    {b.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
