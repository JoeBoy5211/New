import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ensureVendorSetup, useUpdateCaterer, useVendorCaterer, type Caterer } from '@/hooks/supabase/useCaterers';
import { useCatererBookings, useUpdateBooking, type Booking } from '@/hooks/supabase/useBookings';
import {
  useMenuItemsByCaterer,
  type MenuItem,
} from '@/hooks/supabase/useMenuItems';
import {
  usePackagesByCaterer,
  type Package,
} from '@/hooks/supabase/usePackages';
import { useMyCatererViewTrend, VIEW_WEEKDAY_LABELS } from '@/hooks/supabase/useCatererViews';
import { useRespondToReview, useReviewsByCaterer, type ReviewWithCustomer } from '@/hooks/supabase/useReviews';
import {
  VendorViewsTrendCard,
  VendorViewsHeatmapCard,
} from '@/components/vendor/analytics-charts';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import { LogoUploader } from '@/components/vendor/LogoUploader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  ArrowRight,
  Ban,
  Calendar,
  CalendarX,
  Check,
  Clock,
  Eye,
  Instagram,
  MessageSquare,
  Package as PackageIcon,
  Search,
  Star,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { TikTokIcon, TelegramIcon } from '@/components/social-icons';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  VendorLayout,
  type VendorTab,
} from '@/components/vendor/portal';
import { MenuTab } from '@/components/vendor/menu-catalog';
import { PackagesTab } from '@/components/vendor/package-catalog';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function VendorDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as VendorTab | null;
  const isValidTab = (t: string | null): t is VendorTab =>
    t === 'overview' || t === 'bookings' || t === 'menu' || t === 'packages' || t === 'reviews' || t === 'analytics' || t === 'profile';
  const [activeTab, setActiveTab] = useState<VendorTab>(
    isValidTab(tabFromUrl) ? tabFromUrl : 'overview',
  );

  // Keep tab in sync when returning from full-page flows (e.g. /vendor/menu/new -> ?tab=menu)
  useEffect(() => {
    if (isValidTab(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  const handleTabChange = (tab: VendorTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true });
  };

  const { data: caterer, isLoading: catererLoading, refetch: refetchCaterer } = useVendorCaterer(user?.id);
  const catererId = caterer?.id;

  const { data: bookings = [], isLoading: bookingsLoading } = useCatererBookings(catererId);
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItemsByCaterer(catererId);
  const { data: packages = [], isLoading: packagesLoading } = usePackagesByCaterer(catererId);
  const { data: reviews = [] } = useReviewsByCaterer(catererId);

  // Self-heal legacy / email-confirmation accounts with no caterer row yet
  useEffect(() => {
    if (user?.id && !catererLoading && !caterer) {
      ensureVendorSetup(user.id).then(() => refetchCaterer());
    }
  }, [user?.id, catererLoading, caterer, refetchCaterer]);

  if (catererLoading) {
    return (
      <div className="portal flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No store yet (just created) — wait for refetch
  if (!caterer) {
    return (
      <div className="portal flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md rounded-[22px] p-6 text-center">
          <CardTitle className="text-lg">Setting up your store…</CardTitle>
          <CardDescription className="mt-2">Creating your vendor profile. This takes a few seconds.</CardDescription>
          <Button className="mt-4 rounded-xl" onClick={() => refetchCaterer()}>Retry</Button>
        </Card>
      </div>
    );
  }

  // Approval gate: pending or suspended vendors cannot access the platform
  if (caterer.is_pending || !caterer.is_approved) {
    if (caterer.is_pending) {
      return <Navigate to="/vendor/pending" replace />;
    }
    // Suspended (e.g. monthly payment missed — admin set is_approved=false)
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
            <Button variant="outline" className="rounded-xl" onClick={() => refetchCaterer()}>Check again</Button>
            <Button variant="outline" className="rounded-xl" onClick={() => { logout(); navigate('/'); }}>Sign out</Button>
          </div>
        </Card>
      </div>
    );
  }

  const typedBookings = (bookings ?? []) as Booking[];
  const typedReviews = (reviews ?? []) as ReviewWithCustomer[];

  const pendingBookings = typedBookings.filter((b) => b.status === 'pending').length;
  const avgRating =
    typedReviews.length > 0 ? typedReviews.reduce((sum, r) => sum + r.rating, 0) / typedReviews.length : 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayName = profile?.name || caterer.name;
  const firstName = displayName.split(' ')[0];

  return (
    <VendorLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      displayName={displayName}
      logoUrl={(caterer as Partial<Caterer>).logo_url ?? null}
      notificationCount={pendingBookings}
      onLogout={handleLogout}
      header={
        activeTab === 'overview' ? (
          <div className="mb-6">
            <h1 className="text-[30px] font-semibold tracking-tight text-foreground">
              {greeting()}, {firstName}
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Here&apos;s what&apos;s happening with {caterer.name} today.
            </p>
          </div>
        ) : null
      }
    >
      {activeTab === 'overview' && (
        <OverviewTab
          bookings={typedBookings}
          reviews={typedReviews}
          pendingBookings={pendingBookings}
          avgRating={avgRating}
          onViewAllBookings={() => handleTabChange('bookings')}
          onNavigate={handleTabChange}
        />
      )}

      {activeTab === 'bookings' && (
        <BookingsTab bookings={typedBookings} isLoading={bookingsLoading} packages={(packages ?? []) as Package[]} />
      )}

      {activeTab === 'menu' && (
        catererId ? <MenuTab menuItems={(menuItems ?? []) as MenuItem[]} isLoading={menuLoading} /> : null
      )}

      {activeTab === 'packages' && (
        catererId ? <PackagesTab packages={(packages ?? []) as Package[]} isLoading={packagesLoading} /> : null
      )}

      {activeTab === 'reviews' && <ReviewsTab reviews={typedReviews} />}

      {activeTab === 'analytics' && catererId && (
        <AnalyticsTab caterer={caterer} catererId={catererId} bookings={typedBookings} />
      )}

      {activeTab === 'profile' && <ProfileTab caterer={caterer} />}
    </VendorLayout>
  );
}

/* --------------------------------- Overview --------------------------------- */

function OverviewTab({
  bookings,
  reviews,
  pendingBookings,
  avgRating,
  onViewAllBookings,
  onNavigate,
}: {
  bookings: Booking[];
  reviews: ReviewWithCustomer[];
  pendingBookings: number;
  avgRating: number;
  onViewAllBookings: () => void;
  onNavigate: (tab: VendorTab) => void;
}) {
  const upcoming = useMemo(
    () =>
      [...bookings]
        .filter((b) => b.status === 'pending' || b.status === 'accepted' || new Date(b.event_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .sort((a, b) => +new Date(a.event_date) - +new Date(b.event_date))
        .slice(0, 5),
    [bookings]
  );
  const statusCounts = useMemo(
    () => ({
      pending: bookings.filter((b) => b.status === 'pending').length,
      accepted: bookings.filter((b) => b.status === 'accepted').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
    }),
    [bookings]
  );
  const recentReviews = useMemo(
    () => [...reviews].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 3),
    [reviews]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total bookings"
          value={String(bookings.length)}
          sub="All time requests"
          icon={Calendar}
          iconClassName="bg-primary/10 text-primary"
        />
        <KpiCard
          label="Pending requests"
          value={String(pendingBookings)}
          sub={pendingBookings > 0 ? `${pendingBookings} need${pendingBookings === 1 ? 's' : ''} your response` : 'All caught up'}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <KpiCard
          label="Average rating"
          value={reviews.length > 0 ? avgRating.toFixed(1) : '—'}
          sub={reviews.length > 0 ? `From ${reviews.length} review${reviews.length === 1 ? '' : 's'}` : 'No reviews yet'}
          icon={Star}
          iconClassName="bg-yellow-500/10 text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-[20px] border border-border/70 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">Upcoming bookings</h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Your next events and requests</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[13px] text-primary" onClick={onViewAllBookings}>
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-2">
            {upcoming.length > 0 ? (
              upcoming.map((booking) => {
                const d = new Date(booking.event_date);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-muted/70">
                      <span className="text-[15px] font-semibold leading-none text-foreground">
                        {d.toLocaleDateString(undefined, { day: 'numeric' })}
                      </span>
                      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {d.toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-foreground">{booking.event_type}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {booking.guest_count} guests{booking.venue ? ` • ${booking.venue}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} className="shrink-0" />
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={CalendarX}
                title="No bookings yet"
                description="New customer requests will appear here once customers start booking your services."
              />
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-[20px] border border-border/70 bg-white p-5">
            <h3 className="text-[15px] font-semibold text-foreground">Bookings by status</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Where your requests stand</p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Pending', count: statusCounts.pending, dot: 'bg-amber-500' },
                { label: 'Accepted', count: statusCounts.accepted, dot: 'bg-emerald-500' },
                { label: 'Completed', count: statusCounts.completed, dot: 'bg-sky-500' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                  <span className="text-[13.5px] font-medium text-foreground">{row.label}</span>
                  <span className="ml-auto text-[13.5px] font-semibold tabular-nums text-foreground">{row.count}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full rounded-xl" onClick={onViewAllBookings}>
              Manage bookings <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </section>

          <section className="rounded-[20px] border border-border/70 bg-white p-5">
            <h3 className="text-[15px] font-semibold text-foreground">Quick actions</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Jump to common tasks</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('menu')}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 p-3.5 text-left transition-colors hover:border-border hover:bg-muted/40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UtensilsCrossed className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-[13px] font-semibold text-foreground">Menu</span>
                <span className="text-xs text-muted-foreground">Edit dishes</span>
              </button>
              <button
                onClick={() => onNavigate('packages')}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 p-3.5 text-left transition-colors hover:border-border hover:bg-muted/40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <PackageIcon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-[13px] font-semibold text-foreground">Packages</span>
                <span className="text-xs text-muted-foreground">Edit offers</span>
              </button>
              <button
                onClick={() => onNavigate('reviews')}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 p-3.5 text-left transition-colors hover:border-border hover:bg-muted/40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-600">
                  <Star className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-[13px] font-semibold text-foreground">Reviews</span>
                <span className="text-xs text-muted-foreground">Reply</span>
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 p-3.5 text-left transition-colors hover:border-border hover:bg-muted/40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                  <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-[13px] font-semibold text-foreground">Profile</span>
                <span className="text-xs text-muted-foreground">Update store</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[20px] border border-border/70 bg-white">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Recent reviews</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">What customers are saying</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[13px] text-primary" onClick={() => onNavigate('reviews')}>
            View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        {recentReviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
            {recentReviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border/60 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(review.customer?.name || 'C').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{review.customer?.name || 'Customer'}</p>
                    <span className="mt-0.5 flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
                      ))}
                    </span>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Reviews from customers will appear here once your events are completed."
          />
        )}
      </section>
    </div>
  );
}

/* --------------------------------- Bookings --------------------------------- */

const BOOKING_FILTERS = ['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled'] as const;

function BookingsTab({ bookings, isLoading, packages }: { bookings: Booking[]; isLoading: boolean; packages: Package[] }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const updateBooking = useUpdateBooking();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof BOOKING_FILTERS)[number]>('all');

  const packageMap = useMemo(() => new Map((packages ?? []).map((p) => [p.id, p])), [packages]);

  const setBookingStatus = async (bookingId: string, next: Booking['status']) => {
    try {
      await updateBooking.mutateAsync({ id: bookingId, updates: { status: next } });
      toast({ title: next === 'accepted' ? 'Booking accepted' : 'Booking updated', description: `Status set to ${next}.` });
    } catch (e) {
      toast({ title: 'Update failed', description: e instanceof Error ? e.message : 'Could not update booking.', variant: 'destructive' });
    }
  };

  const filtered = bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    const pkgNames = (b.package_ids ?? []).map((id) => packageMap.get(id)?.name ?? '').join(' ').toLowerCase();
    const matchesSearch =
      !q ||
      b.event_type.toLowerCase().includes(q) ||
      (b.venue ?? '').toLowerCase().includes(q) ||
      pkgNames.includes(q);
    const matchesStatus = status === 'all' || b.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Manage incoming requests and upcoming events."
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border/70 bg-white pl-9"
            aria-label="Search bookings"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BOOKING_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={
                status === f
                  ? 'rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground transition-all'
                  : 'rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground ring-1 ring-inset ring-border/70 transition-all hover:text-foreground'
              }
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-[20px] border border-border/70 bg-white">
        {isLoading ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading bookings…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={search || status !== 'all' ? 'No bookings match your filters' : 'No booking requests yet'}
            description={
              search || status !== 'all'
                ? 'Try changing your search or clearing the filters.'
                : 'New customer requests will appear here once customers start booking your services.'
            }
            action={
              search || status !== 'all' ? (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setSearch(''); setStatus('all'); }}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Selection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => {
                  const pkgNames = (booking.package_ids ?? [])
                    .map((id) => packageMap.get(id)?.name ?? id.slice(0, 8))
                    .filter(Boolean);
                  const menuCount = (booking.menu_selections ?? []).length;
                  const selectionLabel =
                    pkgNames.length > 0
                      ? `${pkgNames.slice(0, 2).join(', ')}${pkgNames.length > 2 ? ` +${pkgNames.length - 2}` : ''}${menuCount > 0 ? ` · ${menuCount} dish${menuCount === 1 ? '' : 'es'}` : ''}`
                      : menuCount > 0
                        ? `${menuCount} dish${menuCount === 1 ? '' : 'es'}`
                        : '—';
                  return (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer border-border/50 transition-colors hover:bg-muted/40"
                    onClick={() => navigate(`/vendor/bookings/${booking.id}`)}
                  >
                    <TableCell className="pl-5 font-medium">
                      <span className="text-primary underline-offset-4 hover:underline">{booking.event_type}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(booking.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>{booking.guest_count}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">{booking.venue || 'TBD'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={[...pkgNames, ...(menuCount > 0 ? [`${menuCount} menu items`] : [])].join(', ') || undefined}>{selectionLabel}</TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {booking.status === 'pending' ? (
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" className="h-8 rounded-lg" onClick={() => setBookingStatus(booking.id, 'accepted')} disabled={updateBooking.isPending}>
                            <Check className="mr-1 h-3.5 w-3.5" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setBookingStatus(booking.id, 'declined')} disabled={updateBooking.isPending}>
                            <X className="mr-1 h-3.5 w-3.5" /> Decline
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-lg text-[13px] text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vendor/bookings/${booking.id}`);
                          }}
                        >
                          View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------------------------- Reviews ---------------------------------- */

function ReviewsTab({ reviews }: { reviews: ReviewWithCustomer[] }) {
  const { toast } = useToast();
  const respond = useRespondToReview();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const avg = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await respond.mutateAsync({ id: reviewId, response: replyText.trim() });
      toast({ title: 'Reply sent', description: 'Your response has been posted.' });
      setReplyingTo(null);
      setReplyText('');
    } catch (e) {
      toast({ title: 'Reply failed', description: e instanceof Error ? e.message : 'Could not post reply.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Reviews" description="Your reputation with customers." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-[20px] border border-border/70 bg-white p-5 lg:col-span-1">
          <p className="text-[13px] font-medium text-muted-foreground">Your reputation</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-[40px] font-semibold leading-none tracking-tight text-foreground">
              {reviews.length > 0 ? avg.toFixed(1) : '—'}
            </span>
            <span className="pb-1.5 text-[13px] text-muted-foreground">/ 5</span>
          </div>
          <div className="mt-2 flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
            ))}
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
          {reviews.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-muted-foreground">{d.star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${reviews.length > 0 ? (d.count / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-3 lg:col-span-2">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <article key={review.id} className="rounded-[20px] border border-border/70 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
                    {(review.customer?.name || 'C').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-semibold text-foreground">{review.customer?.name || 'Customer'}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
                        ))}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[14px] text-foreground">{review.comment}</p>

                {review.response ? (
                  <div className="ml-4 mt-3 rounded-xl border-l-2 border-primary bg-muted/50 p-3.5">
                    <p className="text-[13px] font-semibold text-foreground">Your response</p>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">{review.response}</p>
                  </div>
                ) : replyingTo === review.id ? (
                  <div className="ml-4 mt-3 space-y-2.5">
                    <Textarea
                      placeholder="Write your response..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="rounded-xl border-border/70 bg-white"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-lg" onClick={() => handleReply(review.id)} disabled={respond.isPending}>Post reply</Button>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setReplyingTo(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="ml-4 mt-3 rounded-lg" onClick={() => setReplyingTo(review.id)}>
                    <MessageSquare className="mr-2 h-3.5 w-3.5" />Reply
                  </Button>
                )}
              </article>
            ))
          ) : (
            <section className="rounded-[20px] border border-border/70 bg-white">
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Reviews from customers will appear here once your events are completed."
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Analytics --------------------------------- */

const ANALYTICS_RANGES = [7, 14, 30, 90] as const;

function AnalyticsTab({
  caterer,
  catererId,
  bookings,
}: {
  caterer: Caterer;
  catererId: string;
  bookings: Booking[];
}) {
  const [days, setDays] = useState<number>(30);
  const { buckets, heatmap, summary, peak, isLoading, error, refetch } = useMyCatererViewTrend(catererId, days);

  const since = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return d.getTime();
  }, [days]);

  const periodBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const t = +new Date(b.created_at);
        return !isNaN(t) && t >= since && b.status !== 'cancelled' && b.status !== 'declined';
      }).length,
    [bookings, since],
  );

  const conversion = summary.unique > 0 ? (periodBookings / summary.unique) * 100 : 0;
  const lifetimeTotal = caterer.view_count ?? 0;
  const lifetimeUnique = caterer.unique_view_count ?? 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description={`How customers find and browse ${caterer.name}.`}
        action={
          <div className="flex gap-1.5 rounded-xl bg-white p-1 ring-1 ring-inset ring-border/70">
            {ANALYTICS_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={
                  days === r
                    ? 'rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-all'
                    : 'rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-all hover:text-foreground'
                }
              >
                {r}D
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <section className="rounded-[20px] border border-border/70 bg-white">
          <EmptyState
            icon={Eye}
            title="Analytics unavailable"
            description="Could not load your profile views. Run the profile-views migration in Supabase, then try again."
            action={
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        </section>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={`Total views · ${days}D`}
              value={isLoading ? '…' : String(summary.views)}
              sub={`${lifetimeTotal.toLocaleString()} all time`}
              icon={Eye}
              iconClassName="bg-primary/10 text-primary"
            />
            <KpiCard
              label={`Unique visitors · ${days}D`}
              value={isLoading ? '…' : String(summary.unique)}
              sub={`${lifetimeUnique.toLocaleString()} all time`}
              icon={Users}
              iconClassName="bg-sky-500/10 text-sky-600"
            />
            <KpiCard
              label="Avg views / day"
              value={isLoading ? '…' : summary.avgPerDay % 1 === 0 ? String(summary.avgPerDay) : summary.avgPerDay.toFixed(1)}
              sub={`${summary.signedIn} signed-in · ${summary.guests} guest`}
              icon={Activity}
              iconClassName="bg-emerald-500/10 text-emerald-600"
            />
            <KpiCard
              label="View → booking"
              value={isLoading ? '…' : summary.unique > 0 ? `${conversion.toFixed(1)}%` : '—'}
              sub={`${periodBookings} bookings from ${summary.unique} visitors`}
              icon={TrendingUp}
              iconClassName="bg-amber-500/10 text-amber-600"
            />
          </div>

          {isLoading ? (
            <section className="rounded-[20px] border border-border/70 bg-white p-5">
              <p className="py-10 text-center text-sm text-muted-foreground">Loading analytics…</p>
            </section>
          ) : (
            <>
              <VendorViewsTrendCard buckets={buckets} days={days} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <VendorViewsHeatmapCard heatmap={heatmap} days={days} peak={peak} />
                </div>
                <section className="rounded-[20px] border border-border/70 bg-white p-5">
                  <h3 className="text-[15px] font-semibold text-foreground">What this means</h3>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">Reading your numbers</p>
                  <ul className="mt-4 space-y-3 text-[13.5px] text-muted-foreground">
                    <li>
                      <span className="font-semibold text-foreground">Views</span> count every
                      profile open — one per app session, so repeat visits across days still count.
                    </li>
                    <li>
                      <span className="font-semibold text-foreground">Unique visitors</span> are
                      distinct customers or guest devices. Owner previews never count.
                    </li>
                    {summary.views > 0 ? (
                      <li>
                        Busiest time:{' '}
                        <span className="font-semibold text-foreground">
                          {VIEW_WEEKDAY_LABELS[peak.day]}s around {peak.hour}:00
                        </span>{' '}
                        — keep your menu and photos fresh before then.
                      </li>
                    ) : (
                      <li>
                        No views yet — share your profile link with customers to get discovered.
                      </li>
                    )}
                    <li>
                      <span className="font-semibold text-foreground">View → booking</span> shows
                      how many visitors turn into requests. Low conversion with high views means
                      your photos, menu or pricing may need work.
                    </li>
                  </ul>
                </section>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Profile ---------------------------------- */

function ProfileTab({ caterer }: { caterer: Caterer }) {
  const { toast } = useToast();
  const updateCaterer = useUpdateCaterer();
  const [form, setForm] = useState({
    name: caterer.name,
    description: caterer.description || '',
    long_description: caterer.long_description || '',
    location: caterer.location || '',
    contact_phone: caterer.contact_phone || '',
    contact_email: caterer.contact_email || '',
    website: caterer.website || '',
    instagram_url: (caterer as Partial<Caterer>).instagram_url || '',
    tiktok_url: (caterer as Partial<Caterer>).tiktok_url || '',
    telegram_url: (caterer as Partial<Caterer>).telegram_url || '',
    logo_url: (caterer as Partial<Caterer>).logo_url || '',
    cover_image: caterer.cover_image || '',
    images: (caterer.images || []).join('\n'),
    price_range: caterer.price_range || '',
    min_guests: caterer.min_guests ?? 1,
    max_guests: caterer.max_guests ?? 100,
    cuisines: (caterer.cuisines || []).join(', '),
    event_types: (caterer.event_types || []).join(', '),
    specialties: (caterer.specialties || []).join(', '),
    years_in_business: caterer.years_in_business ?? 0,
  });

  const handleSave = async () => {
    const baseUpdates = {
      name: form.name.trim() || caterer.name,
      description: form.description || null,
      long_description: form.long_description || null,
      location: form.location || null,
      cover_image: form.cover_image || null,
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      price_range: (form.price_range || null) as Caterer['price_range'],
      min_guests: Number(form.min_guests) || 1,
      max_guests: Number(form.max_guests) || 100,
      cuisines: form.cuisines.split(',').map((s) => s.trim()).filter(Boolean),
      event_types: form.event_types.split(',').map((s) => s.trim()).filter(Boolean),
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      years_in_business: Number(form.years_in_business) || 0,
    };
    // Added by later migration (20260916090000) — may not exist in live DB yet.
    const contactUpdates = {
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      website: form.website || null,
    };
    // Optional social links migration — may not exist in live DB yet.
    const socialUpdates = {
      instagram_url: form.instagram_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
      telegram_url: form.telegram_url.trim() || null,
    };
    // Vendor logo (supabase-vendor-logo.sql) — may not exist in live DB yet.
    const logoUpdates = {
      logo_url: form.logo_url.trim() || null,
    };
    const msgOf = (e: unknown) => {
      if (e instanceof Error && e.message) return e.message;
      if (e && typeof e === 'object') {
        const o = e as Record<string, unknown>;
        const parts: string[] = [];
        if (typeof o['message'] === 'string' && o['message']) parts.push(o['message'] as string);
        if (typeof o['details'] === 'string' && o['details']) parts.push(o['details'] as string);
        if (typeof o['hint'] === 'string' && o['hint']) parts.push(`Hint: ${o['hint'] as string}`);
        if (typeof o['code'] === 'string' && o['code']) parts.push(`(${(o['code'] as string)})`);
        if (parts.length > 0) return parts.join(' ');
      }
      return 'Could not save.';
    };
    try {
      const isMissingColumn = (msg: string) =>
        /column|schema cache|PGRST|400|bad request|not found/i.test(msg);
      // Progressively drop optional columns the live DB doesn't have yet
      // (contact/social/logo migrations). Warn when the logo is dropped so
      // the vendor knows to run supabase-vendor-logo.sql.
      let pending: Record<string, unknown> = { ...baseUpdates, ...contactUpdates, ...socialUpdates, ...logoUpdates };
      let droppedLogo = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await updateCaterer.mutateAsync({ id: caterer.id, updates: pending as Partial<Caterer> });
          break;
        } catch (err) {
          const msg = msgOf(err);
          if (!isMissingColumn(msg)) throw err;
          const names = Object.keys(pending).filter((k) => new RegExp(`['"]?${k}['"]?`, 'i').test(msg));
          // If the error doesn't name a column, fall back to dropping the
          // newest optional groups first (logo → social → contact).
          const toDrop = names.length > 0
            ? names
            : 'logo_url' in pending
              ? ['logo_url']
              : 'instagram_url' in pending
                ? ['instagram_url', 'tiktok_url', 'telegram_url']
                : ['contact_phone', 'contact_email', 'website'];
          console.error('Profile save failed, retrying without columns.', { message: msg, dropped: toDrop, error: err });
          if (toDrop.includes('logo_url')) droppedLogo = true;
          const next: Record<string, unknown> = { ...pending };
          for (const k of toDrop) delete next[k];
          if (Object.keys(next).length === Object.keys(pending).length || Object.keys(next).length === 0) throw err;
          pending = next;
        }
      }
      if (droppedLogo && form.logo_url.trim()) {
        toast({
          title: 'Profile updated (logo pending)',
          description: 'Store saved, but the logo needs the database update (run supabase-vendor-logo.sql) before it can be stored.',
        });
      } else {
        toast({ title: 'Profile updated', description: 'Your store is updated and visible to the mobile app.' });
      }
    } catch (e) {
      try {
        console.error('Profile save failed: ' + JSON.stringify(e, Object.getOwnPropertyNames(e as object)));
      } catch {
        console.error('Profile save failed', e);
      }
      toast({ title: 'Save failed', description: msgOf(e), variant: 'destructive' });
    }
  };

  const saveButton = (
    <Button onClick={handleSave} disabled={updateCaterer.isPending} className="rounded-xl">
      {updateCaterer.isPending ? 'Saving…' : 'Save changes'}
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Business profile"
        description="This is what customers see in the mobile app."
        action={saveButton}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Business information" description="Name, story and location.">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input id="business-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Short description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="long-description">Long description</Label>
              <Textarea id="long-description" rows={4} value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} className="rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location / Address <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bole, Addis Ababa" className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Contact & visibility" description="How customers reach and recognize you.">
          <div className="space-y-4">
            <LogoUploader
              value={form.logo_url}
              onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
              businessName={form.name}
            />
            {form.cover_image && (
              <img src={form.cover_image} alt="" className="h-36 w-full rounded-2xl object-cover" />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact phone</Label>
                <Input id="contact-phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="h-10 rounded-xl border-border/70 bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact email</Label>
                <Input id="contact-email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="h-10 rounded-xl border-border/70 bg-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div>
                <p className="text-[13.5px] font-semibold text-foreground">Social media <span className="font-normal text-muted-foreground">(optional)</span></p>
                <p className="mt-0.5 text-xs text-muted-foreground">Add a full link or just your @handle — icons appear on your public profile only when filled.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="instagram" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/your-page or @your-page" className="h-10 rounded-xl border-border/70 bg-white pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <div className="relative">
                  <TikTokIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="tiktok" value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} placeholder="https://tiktok.com/@your-page or @your-page" className="h-10 rounded-xl border-border/70 bg-white pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram</Label>
                <div className="relative">
                  <TelegramIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="telegram" value={form.telegram_url} onChange={(e) => setForm({ ...form, telegram_url: e.target.value })} placeholder="https://t.me/your-channel or @your-channel" className="h-10 rounded-xl border-border/70 bg-white pl-9" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover image</Label>
              <Input id="cover" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="https://…" className="h-10 rounded-xl border-border/70 bg-white" />
              {isCloudinaryConfigured() && (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadToCloudinary(file, 'catering_app/covers');
                    setForm((f) => ({ ...f, cover_image: url }));
                  }}
                  className="rounded-xl border-border/70"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Gallery photos</Label>
              {(form.images.split('\n').map((s) => s.trim()).filter(Boolean)).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {form.images.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6).map((img, i) => (
                    <img key={i} src={img} alt="" className="h-[72px] w-full rounded-xl object-cover" />
                  ))}
                </div>
              )}
              <Textarea id="images" rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="Image URLs, one per line" className="rounded-xl border-border/70 bg-white" />
              {isCloudinaryConfigured() && (
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    for (const file of files.slice(0, 6)) {
                      const url = await uploadToCloudinary(file, 'catering_app/covers');
                      setForm((f) => ({ ...f, images: f.images ? `${f.images}\n${url}` : url }));
                    }
                  }}
                  className="rounded-xl border-border/70"
                />
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title="Service details" description="Capacity, pricing and specialties.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="min-guests">Min guests</Label>
              <Input id="min-guests" type="number" value={form.min_guests} onChange={(e) => setForm({ ...form, min_guests: Number(e.target.value) })} className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-guests">Max guests</Label>
              <Input id="max-guests" type="number" value={form.max_guests} onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })} className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-range">Price range ($–$$$$)</Label>
              <Input id="price-range" value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} placeholder="$" className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years">Years in business</Label>
              <Input id="years" type="number" value={form.years_in_business} onChange={(e) => setForm({ ...form, years_in_business: Number(e.target.value) })} className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cuisines">Cuisines (comma-separated)</Label>
              <Input id="cuisines" value={form.cuisines} onChange={(e) => setForm({ ...form, cuisines: e.target.value })} className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-types">Event types (comma-separated)</Label>
              <Input id="event-types" value={form.event_types} onChange={(e) => setForm({ ...form, event_types: e.target.value })} className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma-separated)</Label>
              <Input id="specialties" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} className="h-10 rounded-xl border-border/70 bg-white" />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 flex justify-end">{saveButton}</div>
    </div>
  );
}
