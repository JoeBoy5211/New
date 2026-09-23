import { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CalendarX,
  Check,
  Clock,
  Hash,
  MapPin,
  Package,
  Phone,
  Receipt,
  User,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVendorCaterer } from '@/hooks/supabase/useCaterers';
import { useCatererBookings, useUpdateBooking } from '@/hooks/supabase/useBookings';
import { useMenuItemsByCaterer } from '@/hooks/supabase/useMenuItems';
import { usePackagesByCaterer } from '@/hooks/supabase/usePackages';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  EmptyState,
  SectionCard,
  StatusBadge,
  VendorLayout,
} from '@/components/vendor/portal';

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTime(hhmm: string | null) {
  if (!hhmm) return 'Flexible timing';
  const m = hhmm.slice(0, 5).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ampm}`;
}

export default function BookingDetails() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: caterer, isLoading: catererLoading } = useVendorCaterer(user?.id);
  const catererId = caterer?.id;

  const { data: bookings = [], isLoading: bookingsLoading } = useCatererBookings(catererId);
  const { data: packages = [] } = usePackagesByCaterer(catererId);
  const { data: menuItems = [] } = useMenuItemsByCaterer(catererId);
  const updateBooking = useUpdateBooking();

  const booking = useMemo(
    () => (bookings ?? []).find((b) => b.id === bookingId) ?? null,
    [bookings, bookingId],
  );

  const packageMap = useMemo(() => new Map((packages ?? []).map((p) => [p.id, p])), [packages]);
  const menuMap = useMemo(() => new Map((menuItems ?? []).map((m) => [m.id, m])), [menuItems]);

  if (catererLoading || bookingsLoading) {
    return (
      <div className="portal flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!caterer) return null;

  if (caterer.is_pending) {
    return <Navigate to="/vendor/pending" replace />;
  }

  if (!caterer.is_approved) {
    return (
      <div className="portal flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md rounded-[22px] p-6 text-center">
          <Ban className="mx-auto mb-4 h-12 w-12 text-destructive" strokeWidth={1.5} />
          <CardTitle className="text-lg">Account suspended</CardTitle>
          <CardDescription className="mt-2">
            Your store &quot;{caterer.name}&quot; is currently offline. Please contact admin about your
            monthly access.
          </CardDescription>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/vendor/dashboard?tab=bookings')}>
              Back to bookings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const goBack = () => navigate('/vendor/dashboard?tab=bookings');
  const pendingCount = (bookings ?? []).filter((b) => b.status === 'pending').length;

  const setBookingStatus = async (next: 'accepted' | 'declined') => {
    if (!booking) return;
    try {
      await updateBooking.mutateAsync({ id: booking.id, updates: { status: next } });
      toast({
        title: next === 'accepted' ? 'Booking accepted' : 'Booking declined',
        description: `Status set to ${next}.`,
      });
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Could not update booking.',
        variant: 'destructive',
      });
    }
  };

  return (
    <VendorLayout
      activeTab="bookings"
      onTabChange={(tab) => navigate(tab === 'overview' ? '/vendor/dashboard' : `/vendor/dashboard?tab=${tab}`)}
      displayName={profile?.name || caterer.name}
      logoUrl={(caterer as Partial<typeof caterer>).logo_url ?? null}
      notificationCount={pendingCount}
      onLogout={() => {
        logout();
        navigate('/');
      }}
      header={null}
    >
      <div className="mx-auto w-full max-w-4xl">
        <Button
          variant="ghost"
          className="mb-4 h-9 rounded-xl px-3 text-[13.5px] text-muted-foreground hover:text-foreground"
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to bookings
        </Button>

        {!booking ? (
          <section className="rounded-[20px] border border-border/70 bg-white">
            <EmptyState
              icon={CalendarX}
              title="Booking not found"
              description="This request may have been removed or belongs to another store."
              action={
                <Button className="rounded-xl" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to bookings
                </Button>
              }
            />
          </section>
        ) : (
          <>
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-6 text-white sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-black/10 blur-2xl"
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/25 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {(booking.status ?? 'pending').charAt(0).toUpperCase() + (booking.status ?? 'pending').slice(1)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/15">
                    {booking.event_type}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">
                      {formatDate(booking.event_date)}
                    </h2>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-white/85">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> {formatTime(booking.event_time)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" /> {booking.guest_count} guests
                      </span>
                    </p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] text-white/85">
                      <MapPin className="h-4 w-4" /> {booking.venue?.trim() || 'Venue to be confirmed'}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-white/15 px-5 py-3 ring-1 ring-inset ring-white/25 backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Total</p>
                    <p className="mt-0.5 text-[24px] font-semibold leading-none">
                      {formatPrice(booking.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {/* Event details */}
                <SectionCard title="Event details" description="When and where this event takes place.">
                  <dl className="divide-y divide-border/60">
                    {[
                      { icon: CalendarDays, label: 'Date', value: formatDate(booking.event_date) },
                      { icon: Clock, label: 'Time', value: formatTime(booking.event_time) },
                      { icon: Users, label: 'Guests', value: `${booking.guest_count} people` },
                      { icon: MapPin, label: 'Venue', value: booking.venue?.trim() || 'To be confirmed' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <row.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </div>
                        <dt className="w-20 shrink-0 text-[13px] text-muted-foreground">{row.label}</dt>
                        <dd className="min-w-0 flex-1 truncate text-right text-[14px] font-semibold text-foreground" title={row.value}>
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </SectionCard>

                {/* Services */}
                <SectionCard
                  title="Services"
                  description={
                    (booking.package_ids?.length ?? 0) + (booking.menu_selections?.length ?? 0) > 0
                      ? 'What the customer selected in this request.'
                      : 'Included in this request.'
                  }
                >
                  {(booking.package_ids?.length ?? 0) + (booking.menu_selections?.length ?? 0) === 0 ? (
                    <p className="text-[13.5px] text-muted-foreground">
                      No specific packages or dishes were selected for this request.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {(booking.package_ids ?? []).map((id) => {
                        const pkg = packageMap.get(id);
                        return (
                          <li key={`pkg-${id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Package className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold text-foreground">
                                {pkg?.name ?? `Package ${id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-muted-foreground">Package</p>
                            </div>
                            <span className="shrink-0 text-[14px] font-semibold text-foreground">
                              {pkg ? formatPrice(Number(pkg.price)) : '—'}
                            </span>
                          </li>
                        );
                      })}
                      {(booking.menu_selections ?? []).map((id) => {
                        const item = menuMap.get(id);
                        return (
                          <li key={`menu-${id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <UtensilsCrossed className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold text-foreground">
                                {item?.name ?? `Dish ${id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-muted-foreground">Menu item</p>
                            </div>
                            <span className="shrink-0 text-[14px] font-semibold text-foreground">
                              {item ? formatPrice(Number(item.price)) : '—'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </SectionCard>

                {/* Special instructions */}
                {booking.special_requests?.trim() ? (
                  <SectionCard title="Special instructions" description="Anything the customer wants you to know.">
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                      {booking.special_requests.trim()}
                    </p>
                  </SectionCard>
                ) : null}
              </div>

              <div className="space-y-4">
                {/* Customer */}
                <SectionCard title="Customer" description="Who made this request.">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[15px] font-bold text-primary">
                      {(booking.contact_name?.trim()?.charAt(0) ?? 'C').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-semibold text-foreground">
                        {booking.contact_name?.trim() || 'Customer'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="truncate">{booking.contact_phone?.trim() || 'No phone provided'}</span>
                      </p>
                    </div>
                  </div>
                </SectionCard>

                {/* Request meta */}
                <SectionCard title="Request" description="Tracking for this booking.">
                  <ul className="space-y-3 text-[13.5px]">
                    <li className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Receipt className="h-4 w-4" /> Status
                      </span>
                      <StatusBadge status={booking.status ?? 'pending'} />
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" /> Requested
                      </span>
                      <span className="font-medium text-foreground">
                        {new Date(booking.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Hash className="h-4 w-4" /> Booking ID
                      </span>
                      <span className="font-mono text-[12.5px] text-foreground" title={booking.id}>
                        {booking.id.slice(0, 8)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-4 w-4" /> Event
                      </span>
                      <span className="font-medium text-foreground">{booking.event_type}</span>
                    </li>
                  </ul>
                </SectionCard>

                {/* Actions */}
                <section className="rounded-[20px] border border-border/70 bg-white p-5">
                  {booking.status === 'pending' ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        className="h-10 rounded-xl"
                        onClick={() => void setBookingStatus('accepted')}
                        disabled={updateBooking.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" /> Accept booking
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 rounded-xl"
                        onClick={() => void setBookingStatus('declined')}
                        disabled={updateBooking.isPending}
                      >
                        <X className="mr-2 h-4 w-4" /> Decline
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      This request has been{' '}
                      <span className="font-semibold text-foreground">{booking.status}</span>. Status
                      changes are reflected for the customer right away.
                    </p>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </VendorLayout>
  );
}
