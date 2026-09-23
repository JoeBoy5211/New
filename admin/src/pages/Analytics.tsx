import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader, ErrorState } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, Users, Activity, UserCheck, Store } from 'lucide-react';
import { useAllCaterers } from '@/hooks/useCaterers';
import { useAllBookings } from '@/hooks/useBookings';
import { usePlatformViewEvents } from '@/hooks/useCatererViews';
import { ViewsTrendChart } from '@/components/analytics/ViewsTrendChart';
import { ViewsHeatmap } from '@/components/analytics/ViewsHeatmap';
import { ViewsLeaderboard } from '@/components/analytics/ViewsLeaderboard';
import { cn } from '@/lib/utils';

const RANGES = [
  { key: 7, label: '7D' },
  { key: 14, label: '14D' },
  { key: 30, label: '30D' },
  { key: 90, label: '90D' },
] as const;

export default function Analytics() {
  const [days, setDays] = useState<number>(30);
  const [vendorId, setVendorId] = useState<string>('all');

  const { data: caterers, isLoading: loadingCaterers } = useAllCaterers();
  const { data: bookings } = useAllBookings(1000);
  const {
    buckets,
    heatmap,
    perVendor,
    summary,
    isLoading: loadingViews,
    error,
    refetch,
  } = usePlatformViewEvents(days, vendorId === 'all' ? null : vendorId);

  const catererNames = useMemo(
    () => Object.fromEntries((caterers ?? []).map((c) => [c.id, c.name])),
    [caterers],
  );

  const selectedVendor = useMemo(
    () => (vendorId === 'all' ? null : (caterers ?? []).find((c) => c.id === vendorId) ?? null),
    [caterers, vendorId],
  );

  const lifetime = useMemo(() => {
    if (selectedVendor) {
      return {
        unique: selectedVendor.unique_view_count ?? 0,
        total: selectedVendor.view_count ?? 0,
      };
    }
    const list = caterers ?? [];
    return {
      unique: list.reduce((s, c) => s + (c.unique_view_count ?? 0), 0),
      total: list.reduce((s, c) => s + (c.view_count ?? 0), 0),
    };
  }, [caterers, selectedVendor]);

  const loading = loadingViews || loadingCaterers;

  if (error) {
    return (
      <AdminLayout>
        <PageHeader
          title="Profile Analytics"
          description="How customers discover and browse vendor profiles."
        />
        <Card>
          <ErrorState
            title="Unable to load view analytics"
            description="Run mobile/scripts/migration/supabase-caterer-profile-views.sql in Supabase and sign in as admin, then try again."
            onRetry={() => refetch()}
          />
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Profile Analytics"
        description={
          selectedVendor
            ? `Detail-page performance for ${selectedVendor.name}.`
            : 'How customers discover and browse vendor profiles.'
        }
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/vendors">
              Manage vendors <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-lg bg-background p-1 text-[13px] font-medium">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setDays(r.key)}
              className={cn(
                'rounded-md px-3 py-1.5 transition-all',
                days === r.key
                  ? 'bg-white text-foreground shadow-subtle'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-[280px]">
          <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8783]" />
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter by vendor"
          >
            <option value="all">All vendors</option>
            {(caterers ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {vendorId !== 'all' && (
          <Button variant="secondary" size="sm" onClick={() => setVendorId('all')} className="w-fit">
            Clear vendor filter
          </Button>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Eye}
          tint="bg-primary-subtle text-primary"
          label={`Total views · ${days}D`}
          value={summary.views.toLocaleString()}
          hint={`${lifetime.total.toLocaleString()} lifetime`}
          loading={loading}
        />
        <StatCard
          icon={Users}
          tint="bg-[#EEF3F8] text-[#4D6B8A]"
          label={`Unique visitors · ${days}D`}
          value={summary.unique.toLocaleString()}
          hint={`${lifetime.unique.toLocaleString()} lifetime`}
          loading={loading}
        />
        <StatCard
          icon={Activity}
          tint="bg-[#E9F6F0] text-[#16845B]"
          label="Avg views / day"
          value={summary.avgPerDay % 1 === 0 ? summary.avgPerDay.toString() : summary.avgPerDay.toFixed(1)}
          hint={days === 7 ? 'this week' : `last ${days} days`}
          loading={loading}
        />
        <StatCard
          icon={UserCheck}
          tint="bg-[#FFF5DF] text-[#B7791F]"
          label="Signed-in share"
          value={summary.views > 0 ? `${summary.signedInShare.toFixed(0)}%` : '—'}
          hint={`${summary.signedIn.toLocaleString()} signed-in · ${summary.guests.toLocaleString()} guest`}
          loading={loading}
        />
      </div>

      <ViewsTrendChart buckets={buckets} isLoading={loading} days={days} />

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ViewsHeatmap heatmap={heatmap} isLoading={loading} days={days} />
        </div>
        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardContent className="p-4 sm:p-5">
              <p className="text-sm font-semibold">About these numbers</p>
              <ul className="mt-2 space-y-2 text-[13px] text-foreground-secondary">
                <li>
                  <span className="font-medium text-foreground">Total views</span> — every
                  detail-page open, counted once per app session per vendor.
                </li>
                <li>
                  <span className="font-medium text-foreground">Unique visitors</span> — distinct
                  signed-in users plus guest devices, deduped server-side.
                </li>
                <li>
                  <span className="font-medium text-foreground">Heatmap</span> — device-local
                  hour when the view happened; use the peak to time promotions.
                </li>
                <li>
                  <span className="font-medium text-foreground">Conversion</span> — period
                  bookings (excl. cancelled) ÷ unique visitors per vendor.
                </li>
              </ul>
              <p className="mt-3 border-t border-border-subtle/80 pt-3 text-xs text-foreground-muted">
                Owner self-views are excluded. Per-vendor lifetime totals also appear in the
                Vendors table and detail sheet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <ViewsLeaderboard
          stats={perVendor}
          catererNames={catererNames}
          bookings={bookings}
          days={days}
          isLoading={loading}
        />
      </div>
    </AdminLayout>
  );
}
