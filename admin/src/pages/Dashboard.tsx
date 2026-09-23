import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Store,
  Clock,
  CheckCircle2,
  PauseCircle,
  ArrowRight,
  ArrowUpDown,
  ListFilter,
  Check,
  UserPlus,
  StoreIcon,
  CreditCard,
  Users,
  Wallet,
  Eye,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis as ReXAxis,
  YAxis,
} from 'recharts';
import { useAllCaterers, Caterer } from '@/hooks/useCaterers';
import { useAllProfiles } from '@/hooks/useProfiles';
import { useAllPayments } from '@/hooks/usePayments';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NEW_COLOR = '#C9A9B4';
const APPROVED_COLOR = '#74263A';
const LIVE_COLOR = '#16845B';
const PENDING_COLOR = '#B7791F';
const SUSPENDED_COLOR = '#C24141';

type DeltaTone = 'up' | 'down' | 'neutral';

const DELTA_STYLES: Record<DeltaTone, string> = {
  up: 'bg-[#EAF6F0] text-[#147A54] ring-1 ring-inset ring-[#16845B]/15',
  down: 'bg-[#FDECEC] text-[#B33737] ring-1 ring-inset ring-[#C24141]/15',
  neutral: 'bg-[#F4F3F1] text-[#5F5C59] ring-1 ring-inset ring-black/[0.06]',
};

function DeltaPill({ text, tone }: { text: string; tone?: DeltaTone }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums',
        DELTA_STYLES[tone ?? 'neutral']
      )}
    >
      {text}
    </span>
  );
}

/** Tier 1 — large hero stat for the numbers that matter most. */
function HeroKpi({
  icon: Icon,
  tint,
  label,
  value,
  hint,
  delta,
  footer,
  loading,
  attention,
  className,
}: {
  icon: React.ElementType;
  tint: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  delta?: { text: string; tone?: DeltaTone };
  footer?: React.ReactNode;
  loading?: boolean;
  attention?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        'rounded-2xl border-border-subtle bg-white shadow-subtle transition-shadow duration-200 hover:shadow-float',
        attention && 'border-[#E7D9B4]',
        className
      )}
    >
      <CardContent className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/[0.05]', tint)}>
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="truncate text-sm font-medium text-foreground-secondary">{label}</p>
          </div>
          {delta && !loading && <DeltaPill text={delta.text} tone={delta.tone} />}
        </div>
        {loading ? (
          <>
            <Skeleton className="mt-5 h-10 w-24" />
            <Skeleton className="mt-2 h-3.5 w-36" />
          </>
        ) : (
          <>
            <p className="mt-5 text-[34px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
            {hint && <p className="mt-2 truncate text-[13px] text-foreground-muted">{hint}</p>}
          </>
        )}
        {footer && <div className="mt-5 border-t border-border-subtle/80 pt-3.5">{footer}</div>}
      </CardContent>
    </Card>
  );
}

/** Tier 2 — compact single-row stat for operational health details. */
function MiniKpi({
  icon: Icon,
  tint,
  label,
  value,
  hint,
  to,
  loading,
  className,
}: {
  icon: React.ElementType;
  tint: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  to?: string;
  loading?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/[0.05]', tint)}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-foreground-muted">{label}</span>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-12" />
        ) : (
          <span className="block text-[22px] font-semibold leading-tight tracking-tight tabular-nums">{value}</span>
        )}
        {hint && <span className="block truncate text-xs text-foreground-muted/90">{hint}</span>}
      </span>
      {to && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors">
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Card className={cn('group rounded-2xl border-border-subtle bg-white shadow-subtle transition-all duration-200 hover:-translate-y-[2px] hover:border-border hover:shadow-float', className)}>
        <Link to={to} className="block" aria-label={`${label}: ${typeof value === 'number' ? value : ''}`}>
          <CardContent className="flex items-center gap-3 p-4 sm:p-5">{inner}</CardContent>
        </Link>
      </Card>
    );
  }
  return (
    <Card className={cn('rounded-2xl border-border-subtle bg-white shadow-subtle', className)}>
      <CardContent className="flex items-center gap-3 p-4 sm:p-5">{inner}</CardContent>
    </Card>
  );
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}
function monthLabel(d: Date) {
  return d.toLocaleString('en', { month: 'short' });
}
function quarterKey(d: Date) {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}
function quarterLabel(key: string) {
  const [y, q] = key.split('-');
  return `${q} '${y.slice(2)}`;
}

type ActivityItem = {
  id: string;
  kind: 'signup' | 'approved' | 'suspended';
  title: string;
  subtitle: string;
  date: Date;
};

function activityFor(list: Caterer[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const c of list) {
    items.push({
      id: `${c.id}-signup`,
      kind: 'signup',
      title: c.name,
      subtitle: `Signed up · ${new Date(c.created_at).toLocaleDateString()}`,
      date: new Date(c.created_at),
    });
    if (c.is_approved && !c.is_pending && c.approved_at) {
      items.push({
        id: `${c.id}-approved`,
        kind: 'approved',
        title: c.name,
        subtitle: `Approved · ${new Date(c.approved_at).toLocaleDateString()}`,
        date: new Date(c.approved_at),
      });
    }
    if (!c.is_approved && !c.is_pending) {
      items.push({
        id: `${c.id}-suspended`,
        kind: 'suspended',
        title: c.name,
        subtitle: `Suspended · ${new Date(c.updated_at).toLocaleDateString()}`,
        date: new Date(c.updated_at),
      });
    }
  }
  return items.sort((a, b) => +b.date - +a.date).slice(0, 5);
}

export default function Dashboard() {
  const { data: caterers, isLoading: loadingCaterers, error: caterersError, refetch } = useAllCaterers();
  const { data: profiles, isLoading: loadingProfiles } = useAllProfiles();
  const { data: payments } = useAllPayments(1000);
  const { profile } = useAuth();
  const [range, setRange] = useState<'monthly' | 'quarterly'>('monthly');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name' | 'views'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'pending' | 'suspended'>('all');

  const getAccount = (c: Caterer) => (c.account_status as string | null) ?? (c.is_pending ? 'PENDING' : c.is_approved ? 'APPROVED' : 'SUSPENDED');
  const daysLeft = (c: Caterer) => (c.subscription_expires_at ? Math.ceil((new Date(c.subscription_expires_at).getTime() - Date.now()) / 86400000) : null);
  const stats = useMemo(() => {
    const list = caterers ?? [];
    const approved = list.filter((c) => getAccount(c) === 'APPROVED');
    const pending = list.filter((c) => getAccount(c) === 'PENDING');
    const suspended = list.filter((c) => getAccount(c) === 'SUSPENDED' || getAccount(c) === 'REJECTED');
    const due = list.filter((c) => c.subscription_status === 'PAYMENT_DUE' || (daysLeft(c) !== null && daysLeft(c)! >= 0 && daysLeft(c)! <= 7)).length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartMs = monthStart.getTime();
    const newVendorsMonth = list.filter((c) => new Date(c.created_at).getTime() >= monthStartMs).length;
    const allProfiles = profiles ?? [];
    const vendorAccounts = allProfiles.filter((p) => p.roles?.some((r) => r.role === 'vendor')).length;
    const customersOnly = allProfiles.filter(
      (p) => !(p.roles?.some((r) => r.role === 'vendor' || r.role === 'admin'))
    );
    const customersNewMonth = customersOnly.filter(
      (p) => p.created_at && new Date(p.created_at).getTime() >= monthStartMs
    ).length;
    const liveShare = list.length ? Math.round((approved.length / list.length) * 100) : 0;
    const totalViews = list.reduce((s, c) => s + (c.view_count ?? 0), 0);
    const totalUnique = list.reduce((s, c) => s + (c.unique_view_count ?? 0), 0);
    return {
      total: list.length,
      approved,
      pending,
      suspended,
      due,
      newVendorsMonth,
      vendorAccounts,
      customers: customersOnly.length,
      customersNewMonth,
      liveShare,
      totalViews,
      totalUnique,
    };
  }, [caterers, profiles]);

  const growth = useMemo(() => {
    const list = caterers ?? [];
    if (range === 'monthly') {
      const buckets: { key: string; label: string; date: Date; added: number; approved: number }[] = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({ key: monthKey(d), label: monthLabel(d), date: d, added: 0, approved: 0 });
      }
      const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
      for (const c of list) {
        const k = monthKey(new Date(c.created_at));
        if (byKey[k]) byKey[k].added += 1;
        if (c.approved_at) {
          const ak = monthKey(new Date(c.approved_at));
          if (byKey[ak]) byKey[ak].approved += 1;
        }
      }
      return buckets;
    }
    const buckets: { key: string; label: string; date: Date; added: number; approved: number }[] = [];
    const now = new Date();
    const startQ = Math.floor(now.getMonth() / 3);
    for (let i = 3; i >= 0; i--) {
      const totalQ = now.getFullYear() * 4 + startQ - i;
      const y = Math.floor(totalQ / 4);
      const q = totalQ % 4;
      const key = `${y}-Q${q + 1}`;
      buckets.push({ key, label: quarterLabel(key), date: new Date(y, q * 3, 1), added: 0, approved: 0 });
    }
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
    for (const c of list) {
      const d = new Date(c.created_at);
      const k = quarterKey(d);
      if (byKey[k]) byKey[k].added += 1;
      if (c.approved_at) {
        const ak = quarterKey(new Date(c.approved_at));
        if (byKey[ak]) byKey[ak].approved += 1;
      }
    }
    return buckets;
  }, [caterers, range]);

  const statusData = useMemo(
    () => [
      { name: 'Live', value: stats.approved.length, color: LIVE_COLOR },
      { name: 'Pending', value: stats.pending.length, color: PENDING_COLOR },
      { name: 'Suspended', value: stats.suspended.length, color: SUSPENDED_COLOR },
    ],
    [stats]
  );

  const activity = useMemo(() => activityFor(caterers ?? []), [caterers]);

  const topVendors = useMemo(() => {
    let list = [...(caterers ?? [])];
    if (statusFilter === 'live') list = list.filter((c) => c.is_approved && !c.is_pending);
    if (statusFilter === 'pending') list = list.filter((c) => c.is_pending);
    if (statusFilter === 'suspended') list = list.filter((c) => !c.is_approved && !c.is_pending);
    if (sort === 'newest') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'oldest') list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'views') list.sort((a, b) => (b.unique_view_count ?? 0) - (a.unique_view_count ?? 0));
    return list.slice(0, 5);
  }, [caterers, sort, statusFilter]);

  const loading = loadingCaterers || loadingProfiles;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.name?.split(' ')[0] || 'Admin';
  const hasGrowth = growth.some((g) => g.added > 0 || g.approved > 0);

  const sortLabels: Record<string, string> = { newest: 'Newest', oldest: 'Oldest', name: 'Name A–Z', views: 'Most viewed' };
  const filterLabels: Record<string, string> = { all: 'All statuses', live: 'Live', pending: 'Pending', suspended: 'Suspended' };

  if (caterersError) {
    return (
      <AdminLayout>
        <PageHeader title="Dashboard" description="Monitor your vendor operations and approvals." />
        <Card>
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <p className="text-sm font-semibold">Unable to load vendors</p>
            <p className="mt-1 text-[13px] text-foreground-secondary">Something went wrong while retrieving your vendor list.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description={`${greeting}, ${firstName}. Monitor your vendor operations and approvals.`}
      />

      {/* Tier 1 — platform scale + what needs you */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
        <HeroKpi
          icon={Store}
          tint="bg-primary-subtle text-primary"
          label="Total Vendors"
          value={stats.total}
          hint={`${stats.vendorAccounts} vendor accounts · ${stats.liveShare}% live`}
          delta={stats.newVendorsMonth > 0 ? { text: `+${stats.newVendorsMonth} this month`, tone: 'up' } : undefined}
          loading={loading}
          className="md:col-span-2 xl:col-span-5"
          footer={
            <div>
              <div
                className="flex h-1.5 overflow-hidden rounded-full bg-[#EFECE8]"
                role="img"
                aria-label={`${stats.approved.length} live, ${stats.pending.length} pending, ${stats.suspended.length} suspended`}
              >
                <span style={{ width: `${stats.total ? (stats.approved.length / stats.total) * 100 : 0}%`, background: LIVE_COLOR }} />
                <span style={{ width: `${stats.total ? (stats.pending.length / stats.total) * 100 : 0}%`, background: PENDING_COLOR }} />
                <span style={{ width: `${stats.total ? (stats.suspended.length / stats.total) * 100 : 0}%`, background: SUSPENDED_COLOR }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-foreground-muted">
                <span className="truncate">
                  {stats.approved.length} live · {stats.pending.length} pending · {stats.suspended.length} suspended
                </span>
                <Link to="/vendors" className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline">
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          }
        />
        <HeroKpi
          icon={Users}
          tint="bg-[#EEF3F8] text-[#4D6B8A]"
          label="Total Customers"
          value={stats.customers}
          hint="app customers (vendors & admins excluded)"
          delta={stats.customersNewMonth > 0 ? { text: `+${stats.customersNewMonth} this month`, tone: 'up' } : undefined}
          loading={loading}
          className="xl:col-span-4"
          footer={
            <div className="flex items-center justify-between gap-2 text-xs text-foreground-muted">
              <span className="truncate">
                {stats.customersNewMonth > 0 ? `${stats.customersNewMonth} joined this month` : 'No new signups this month'}
              </span>
              <Link to="/users" className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline">
                View customers <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          }
        />
        <HeroKpi
          icon={Clock}
          tint="bg-[#FFF5DF] text-[#B7791F]"
          label="Pending Approval"
          value={stats.pending.length}
          hint={stats.pending.length > 0 ? 'needs review + payment check' : 'inbox zero — all caught up'}
          delta={
            stats.pending.length > 0
              ? { text: 'action needed', tone: 'down' }
              : { text: 'all clear', tone: 'up' }
          }
          loading={loading}
          attention={stats.pending.length > 0}
          className="xl:col-span-3"
          footer={
            stats.pending.length > 0 ? (
              <Button size="sm" className="w-full" asChild>
                <Link to="/vendors">
                  Review now <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <p className="text-xs text-foreground-muted">New vendor signups will land here.</p>
            )
          }
        />
      </div>

      {/* Tier 2 — operational health at a glance */}
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniKpi
          icon={CheckCircle2}
          tint="bg-[#E9F6F0] text-[#16845B]"
          label="Live Vendors"
          value={stats.approved.length}
          hint="visible in mobile app"
          to="/vendors"
          loading={loading}
        />
        <MiniKpi
          icon={Eye}
          tint="bg-[#EEF3F8] text-[#4D6B8A]"
          label="Profile Views"
          value={stats.totalUnique.toLocaleString()}
          hint={`${stats.totalViews.toLocaleString()} total hits`}
          to="/vendors"
          loading={loading}
        />
        <MiniKpi
          icon={CreditCard}
          tint="bg-[#FFF5DF] text-[#B7791F]"
          label="Payment Due"
          value={stats.due}
          hint="≤7 days or PAYMENT_DUE"
          to="/vendors"
          loading={loading}
        />
        <MiniKpi
          icon={PauseCircle}
          tint="bg-[#FCECEC] text-[#C24141]"
          label="Suspended"
          value={stats.suspended.length}
          hint="taken offline"
          to="/vendors"
          loading={loading}
        />
      </div>

      <RevenueStrip payments={payments} />

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-[15px]">Vendor Growth</CardTitle>
              <CardDescription>
                <span className="mr-3 inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: NEW_COLOR }} /> New signups
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: APPROVED_COLOR }} /> Approved
                </span>
              </CardDescription>
            </div>
            <div className="flex rounded-lg bg-background p-1 text-[13px] font-medium">
              {(['monthly', 'quarterly'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    'rounded-md px-3 py-1.5 capitalize transition-all',
                    range === r ? 'bg-white text-foreground shadow-subtle' : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : !hasGrowth ? (
                <EmptyState
                  icon={StoreIcon}
                  title="No vendor activity yet"
                  description="Once vendors sign up, growth will appear here."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growth} barGap={3} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEECE8" vertical={false} />
                    <ReXAxis dataKey="label" tick={{ fontSize: 12, fill: '#8A8783' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#8A8783' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <ReTooltip
                      cursor={{ fill: '#F4F3F1' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E2DE',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="added" name="New signups" fill={NEW_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="approved" name="Approved" fill={APPROVED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[15px]">Vendor Status</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendors">See All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : stats.total === 0 ? (
              <EmptyState
                icon={StoreIcon}
                title="No vendors yet"
                description="Vendors you approve will appear here."
              />
            ) : (
              <>
                <div className="relative mx-auto h-[168px] w-[168px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={80} paddingAngle={3} cornerRadius={4} strokeWidth={0}>
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E2DE',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xs text-foreground-muted">Total</p>
                    <p className="text-[22px] font-semibold tracking-tight">{stats.total}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {statusData.map((s) => (
                    <li key={s.name} className="flex items-center gap-2 text-[13px]">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-auto text-foreground-muted">{s.value}</span>
                      <span className="w-10 text-right font-semibold">
                        {stats.total ? Math.round((s.value / stats.total) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[15px]">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendors">See All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <EmptyState
                icon={StoreIcon}
                title="No activity yet"
                description="Signups and approvals will show up here."
              />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        a.kind === 'signup' && 'bg-primary-subtle text-primary',
                        a.kind === 'approved' && 'bg-[#E9F6F0] text-[#16845B]',
                        a.kind === 'suspended' && 'bg-[#FCECEC] text-[#C24141]'
                      )}
                    >
                      {a.kind === 'signup' ? (
                        <UserPlus className="h-3.5 w-3.5" />
                      ) : a.kind === 'approved' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <PauseCircle className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{a.title}</p>
                      <p className="truncate text-xs text-foreground-muted">{a.subtitle}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        a.kind === 'signup' && 'bg-primary-subtle text-primary',
                        a.kind === 'approved' && 'bg-[#E9F6F0] text-[#16845B]',
                        a.kind === 'suspended' && 'bg-[#FCECEC] text-[#C24141]'
                      )}
                    >
                      {a.kind === 'signup' ? 'New' : a.kind === 'approved' ? 'Approved' : 'Suspended'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-[15px]">Top Vendors</CardTitle>
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="h-3.5 w-3.5" /> Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(['newest', 'oldest', 'name', 'views'] as const).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => setSort(s)}>
                      <span className="flex-1">{sortLabels[s]}</span>
                      {sort === s && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ListFilter className="h-3.5 w-3.5" /> Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(['all', 'live', 'pending', 'suspended'] as const).map((f) => (
                    <DropdownMenuItem key={f} onClick={() => setStatusFilter(f)}>
                      <span className="flex-1">{filterLabels[f]}</span>
                      {statusFilter === f && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            {loading ? (
              <div className="space-y-2 px-3 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : topVendors.length === 0 ? (
              <EmptyState
                icon={StoreIcon}
                title="No vendors found"
                description="Try changing the filter."
                action={
                  <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                    Clear filter
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left text-xs font-medium text-foreground-muted">
                      <th className="px-4 py-2.5">Vendor</th>
                      <th className="hidden px-4 py-2.5 md:table-cell">Location</th>
                      <th className="hidden px-4 py-2.5 lg:table-cell">Contact</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Views</th>
                      <th className="px-4 py-2.5 text-right">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVendors.map((c) => (
                      <tr key={c.id} className="border-b border-border-subtle transition-colors last:border-0 hover:bg-surface-subtle">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {c.cover_image ? (
                              <img src={c.cover_image} alt="" className="h-8 w-8 rounded-md object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EFECE8]">
                                <Store className="h-3.5 w-3.5 text-foreground-muted" />
                              </div>
                            )}
                            <span className="whitespace-nowrap text-[13.5px] font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="hidden max-w-[160px] truncate px-4 py-2.5 text-[13px] text-foreground-secondary md:table-cell">
                          {c.location ?? '—'}
                        </td>
                        <td className="hidden max-w-[180px] truncate px-4 py-2.5 text-[13px] text-foreground-secondary lg:table-cell">
                          {c.contact_phone ?? c.contact_email ?? '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {c.is_pending ? (
                            <StatusDot tone="pending" label="Pending" />
                          ) : c.is_approved ? (
                            <StatusDot tone="live" label="Live" />
                          ) : (
                            <StatusDot tone="suspended" label="Suspended" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] tabular-nums">
                          <span className="font-medium">{(c.unique_view_count ?? 0).toLocaleString()}</span>
                          <span className="text-foreground-muted"> / {(c.view_count ?? 0).toLocaleString()}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] text-foreground-secondary">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function RevenueStrip({ payments }: { payments: import('@/hooks/usePayments').VendorPayment[] | undefined }) {
  const { collected, lifetime, count } = useMemo(() => {
    const verified = (payments ?? []).filter((p) => p.status === 'VERIFIED');
    const monthKey = new Date().toISOString().slice(0, 7);
    return {
      collected: verified.filter((p) => (p.paid_at ?? '').slice(0, 7) === monthKey).reduce((s, p) => s + Number(p.amount || 0), 0),
      lifetime: verified.reduce((s, p) => s + Number(p.amount || 0), 0),
      count: verified.length,
    };
  }, [payments]);

  if (!payments || payments.length === 0) return null;

  return (
    <Card className="mt-3 border-[#E5E2DE]">
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E9F6F0] text-[#16845B]">
          <Wallet className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold">
            {collected.toLocaleString()} collected this month · {lifetime.toLocaleString()} lifetime ({count} verified)
          </p>
          <p className="text-xs text-foreground-muted">Ledger-based revenue. Details in Payments.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/payments">Open Payments <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
