import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis as ReXAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/PageHeader';
import { ChartLine, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorPayment } from '@/hooks/usePayments';

type RangeKey = '30d' | '90d' | '6m' | '12m' | 'all';
type MetricKey = 'revenue' | 'count';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: '6m', label: '6M' },
  { key: '12m', label: '12M' },
  { key: 'all', label: 'All' },
];

const PRIMARY = '#74263A';
const COUNT_COLOR = '#16845B';

const METHOD_COLORS: Record<string, string> = {
  CASH: '#B7791F',
  BANK_TRANSFER: '#4D6B8A',
  TELEBIRR: '#16845B',
  CHAPA: '#74263A',
  CARD: '#8A8783',
  OTHER: '#C9A9B4',
};

interface Bucket {
  key: string;
  label: string;
  fullLabel: string;
  revenue: number;
  count: number;
}

function toDayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthShortLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const mon = d.toLocaleString('en', { month: 'short' });
  return `${mon} '${String(y).slice(2)}`;
}

function dayShortLabel(d: Date) {
  return d.toLocaleString('en', { day: 'numeric', month: 'short' });
}

function fullDayLabel(d: Date) {
  return d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function compact(n: number) {
  if (Math.abs(n) >= 1000) {
    return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  return String(Math.round(n));
}

function buildBuckets(verified: VendorPayment[], range: RangeKey): { buckets: Bucket[]; granularity: 'day' | 'week' | 'month' } {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  if (range === '12m' || range === 'all') {
    // Monthly buckets
    let earliest: Date | null = null;
    for (const p of verified) {
      const d = new Date(p.paid_at);
      if (isNaN(+d)) continue;
      if (!earliest || d < earliest) earliest = d;
    }
    let start: Date;
    if (range === '12m' || !earliest) {
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    } else {
      start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      // cap to 36 months so "All" never explodes
      const cap = new Date(now.getFullYear(), now.getMonth() - 35, 1);
      if (start < cap) start = cap;
    }
    const buckets: Bucket[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= now) {
      const key = toMonthKey(cursor);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
      buckets.push({
        key,
        label: monthShortLabel(key),
        fullLabel: cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
        revenue: 0,
        count: 0,
      });
      void monthEnd;
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
    for (const p of verified) {
      const d = new Date(p.paid_at);
      if (isNaN(+d)) continue;
      const k = toMonthKey(d);
      const b = byKey[k];
      if (b) {
        b.revenue += Number(p.amount || 0);
        b.count += 1;
      }
    }
    return { buckets, granularity: 'month' };
  }

  if (range === '6m') {
    // Weekly buckets — last 26 full weeks ending today
    const WEEKS = 26;
    const buckets: Bucket[] = [];
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    for (let i = WEEKS - 1; i >= 0; i--) {
      const weekEnd = new Date(end);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const key = toDayKey(weekEnd);
      buckets.push({
        key,
        label: dayShortLabel(weekEnd),
        fullLabel: `${weekStart.toLocaleDateString('en', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        revenue: 0,
        count: 0,
      });
      (buckets[buckets.length - 1] as Bucket & { _start?: number; _end?: number })._start = +weekStart;
      (buckets[buckets.length - 1] as Bucket & { _start?: number; _end?: number })._end = +weekEnd;
    }
    for (const p of verified) {
      const t = +new Date(p.paid_at);
      if (isNaN(t)) continue;
      const b = buckets.find((x) => {
        const w = x as Bucket & { _start?: number; _end?: number };
        return w._start !== undefined && t >= w._start && t <= (w._end ?? t);
      });
      if (b) {
        b.revenue += Number(p.amount || 0);
        b.count += 1;
      }
    }
    return { buckets, granularity: 'week' };
  }

  // Daily buckets — 30d / 90d
  const days = range === '30d' ? 30 : 90;
  const buckets: Bucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = toDayKey(d);
    buckets.push({
      key,
      label: dayShortLabel(d),
      fullLabel: fullDayLabel(d),
      revenue: 0,
      count: 0,
    });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  const oldest = buckets[0]?.key;
  for (const p of verified) {
    const d = new Date(p.paid_at);
    if (isNaN(+d)) continue;
    const k = toDayKey(d);
    const b = byKey[k];
    if (b) {
      b.revenue += Number(p.amount || 0);
      b.count += 1;
    }
    void oldest;
  }
  return { buckets, granularity: 'day' };
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
  granularity,
}: {
  active?: boolean;
  payload?: { payload: Bucket }[];
  label?: string;
  currency: string;
  granularity: string;
}) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  const avgTicket = b.count > 0 ? b.revenue / b.count : 0;
  return (
    <div className="min-w-[200px] rounded-lg border border-[#E5E2DE] bg-white px-3 py-2.5 shadow-float">
      <p className="text-xs font-medium text-[#8A8783]">{b.fullLabel || label}</p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums">
        {b.revenue.toLocaleString()} <span className="text-xs font-medium text-[#8A8783]">{currency}</span>
      </p>
      <div className="mt-1.5 space-y-0.5 text-[13px]">
        <p className="flex items-center justify-between gap-4">
          <span className="text-[#5F5C59]">Payments</span>
          <span className="font-semibold tabular-nums">{b.count}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-[#5F5C59]">Avg ticket</span>
          <span className="font-medium tabular-nums">{avgTicket > 0 ? `${Math.round(avgTicket).toLocaleString()}` : '—'}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-[#5F5C59]">Cadence</span>
          <span className="text-xs capitalize text-[#8A8783]">per {granularity}</span>
        </p>
      </div>
    </div>
  );
}

export function PaymentsRevenueChart({
  payments,
  isLoading,
}: {
  payments: VendorPayment[] | undefined;
  isLoading?: boolean;
}) {
  const [range, setRange] = useState<RangeKey>('6m');
  const [metric, setMetric] = useState<MetricKey>('revenue');

  const verified = useMemo(() => (payments ?? []).filter((p) => p.status === 'VERIFIED'), [payments]);

  const currency = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const p of verified) freq[p.currency] = (freq[p.currency] ?? 0) + 1;
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
    return top ?? 'ETB';
  }, [verified]);

  const { buckets, granularity } = useMemo(() => buildBuckets(verified, range), [verified, range]);

  const summary = useMemo(() => {
    const total = buckets.reduce((s, b) => s + b.revenue, 0);
    const count = buckets.reduce((s, b) => s + b.count, 0);
    const avg = buckets.length ? total / buckets.length : 0;
    const peak = buckets.reduce<Bucket | null>((max, b) => (!max || b.revenue > max.revenue ? b : max), null);
    const avgTicket = count > 0 ? total / count : 0;

    // Previous equal-length window for growth %
    const n = buckets.length;
    let prevTotal = 0;
    if (n > 0 && verified.length > 0) {
      // derive window start from first bucket key when possible (day/week granularity),
      // otherwise fall back to month arithmetic for monthly buckets.
      if (granularity === 'month') {
        const firstKey = buckets[0].key; // YYYY-MM
        const [y, m] = firstKey.split('-').map(Number);
        const windowStart = new Date(y, m - 1, 1).getTime();
        // window length in ms ≈ from windowStart to now; use same span backwards
        const span = Date.now() - windowStart;
        const prevStart = windowStart - span;
        for (const p of verified) {
          const t = +new Date(p.paid_at);
          if (!isNaN(t) && t >= prevStart && t < windowStart) prevTotal += Number(p.amount || 0);
        }
      } else {
        // buckets carry _start for weeks; for days reconstruct from key
        const first = buckets[0] as Bucket & { _start?: number };
        let windowStart: number;
        if (first._start !== undefined) windowStart = first._start;
        else {
          const [yy, mm, dd] = first.key.split('-').map(Number);
          windowStart = new Date(yy, mm - 1, dd).getTime();
        }
        const span = Date.now() - windowStart;
        const prevStart = windowStart - span;
        for (const p of verified) {
          const t = +new Date(p.paid_at);
          if (!isNaN(t) && t >= prevStart && t < windowStart) prevTotal += Number(p.amount || 0);
        }
      }
    }
    const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : total > 0 ? 100 : 0;
    const hasPrev = prevTotal > 0 || total > 0;
    return { total, count, avg, peak, avgTicket, prevTotal, growth, hasPrev };
  }, [buckets, verified, granularity]);

  const methodSplit = useMemo(() => {
    // Methods within the visible window only
    const keys = new Set(buckets.map((b) => b.key));
    const isMonthly = granularity === 'month';
    const inWindow = (p: VendorPayment) => {
      const d = new Date(p.paid_at);
      if (isNaN(+d)) return false;
      if (isMonthly) return keys.has(toMonthKey(d));
      if (granularity === 'week') {
        const t = +d;
        return buckets.some((b) => {
          const w = b as Bucket & { _start?: number; _end?: number };
          return w._start !== undefined && t >= w._start && t <= (w._end ?? t);
        });
      }
      return keys.has(toDayKey(d));
    };
    const map = new Map<string, { method: string; revenue: number; count: number }>();
    for (const p of verified) {
      if (!inWindow(p)) continue;
      const m = String(p.payment_method || 'OTHER');
      const cur = map.get(m) ?? { method: m, revenue: 0, count: 0 };
      cur.revenue += Number(p.amount || 0);
      cur.count += 1;
      map.set(m, cur);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [verified, buckets, granularity]);

  const lineColor = metric === 'revenue' ? PRIMARY : COUNT_COLOR;
  const dataKey = metric === 'revenue' ? 'revenue' : 'count';
  const hasData = buckets.some((b) => b.revenue > 0 || b.count > 0);
  const peakKey = summary.peak && summary.peak.revenue > 0 ? summary.peak.key : null;

  const growthTone = summary.growth > 0.5 ? 'up' : summary.growth < -0.5 ? 'down' : 'neutral';
  const growthText =
    !summary.hasPrev || (summary.prevTotal === 0 && summary.total === 0)
      ? 'no prior data'
      : `${summary.growth >= 0 ? '+' : ''}${summary.growth.toFixed(1)}% vs prev`;

  return (
    <Card className="mt-3">
      <CardHeader className="flex flex-col gap-3 space-y-0 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <ChartLine className="h-4 w-4" />
            </span>
            Revenue trend
          </CardTitle>
          <CardDescription className="mt-1">
            Verified collections over time · {currency} ·{' '}
            <span className="capitalize">per {granularity}</span>
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-background p-1 text-[13px] font-medium">
            {(['revenue', 'count'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  'rounded-md px-3 py-1.5 capitalize transition-all',
                  metric === m ? 'bg-white text-foreground shadow-subtle' : 'text-foreground-muted hover:text-foreground'
                )}
              >
                {m === 'revenue' ? 'Revenue' : 'Count'}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg bg-background p-1 text-[13px] font-medium">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 transition-all',
                  range === r.key ? 'bg-white text-foreground shadow-subtle' : 'text-foreground-muted hover:text-foreground'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div>
            <div className="grid gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="mt-3 h-[300px] w-full rounded-lg" />
          </div>
        ) : verified.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No revenue data yet"
            description="Once verified payments are recorded, the revenue trend will appear here."
          />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-[#E5E2DE] bg-[#FAF9F7] p-3">
                <p className="text-xs text-[#8A8783]">Collected in period</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">
                  {summary.total.toLocaleString()}
                  <span className="ml-1 text-xs font-medium text-[#8A8783]">{currency}</span>
                </p>
                <span
                  className={cn(
                    'mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                    growthTone === 'up' && 'bg-[#E9F6F0] text-[#16845B]',
                    growthTone === 'down' && 'bg-[#FCECEC] text-[#C24141]',
                    growthTone === 'neutral' && 'bg-[#EFECE8] text-[#5F5C59]'
                  )}
                >
                  {growthText}
                </span>
              </div>
              <div className="rounded-lg border border-[#E5E2DE] p-3">
                <p className="text-xs text-[#8A8783]">Avg per {granularity === 'day' ? 'day' : granularity}</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">
                  {Math.round(summary.avg).toLocaleString()}
                </p>
                <p className="mt-1.5 text-xs text-[#8A8783]">
                  across {buckets.length} {granularity === 'day' ? 'days' : granularity === 'week' ? 'weeks' : 'months'}
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E2DE] p-3">
                <p className="text-xs text-[#8A8783]">Transactions</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">{summary.count}</p>
                <p className="mt-1.5 text-xs text-[#8A8783]">
                  avg ticket {summary.avgTicket > 0 ? `${Math.round(summary.avgTicket).toLocaleString()} ${currency}` : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E2DE] p-3">
                <p className="text-xs text-[#8A8783]">Peak {granularity}</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">
                  {summary.peak && summary.peak.revenue > 0 ? summary.peak.revenue.toLocaleString() : '—'}
                </p>
                <p className="mt-1.5 truncate text-xs text-[#8A8783]">{summary.peak?.fullLabel ?? 'No peak yet'}</p>
              </div>
            </div>

            <div className="mt-3 h-[300px]">
              {!hasData ? (
                <EmptyState
                  icon={ReceiptText}
                  title="No collections in this range"
                  description="Try a wider range — older verified payments may fall outside it."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={buckets} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="paymentsRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEECE8" vertical={false} />
                    <ReXAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#8A8783' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#8A8783' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tickFormatter={(v: number) => (metric === 'revenue' ? compact(Number(v)) : String(Math.round(Number(v))))}
                    />
                    <ReTooltip
                      cursor={{ stroke: '#D8D4D0', strokeDasharray: '4 4' }}
                      content={<ChartTooltip currency={currency} granularity={granularity} />}
                    />
                    {metric === 'revenue' && summary.avg > 0 && (
                      <ReferenceLine
                        y={summary.avg}
                        stroke="#B7791F"
                        strokeDasharray="5 4"
                        label={{
                          value: `avg ${compact(summary.avg)}`,
                          position: 'insideTopRight',
                          fontSize: 11,
                          fill: '#B7791F',
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey={dataKey}
                      name={metric === 'revenue' ? `Revenue (${currency})` : 'Payments'}
                      stroke={lineColor}
                      strokeWidth={2.5}
                      fill="url(#paymentsRevenueFill)"
                      dot={false}
                      activeDot={{ r: 4.5, strokeWidth: 2, stroke: '#fff', fill: lineColor }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border-subtle pt-3 text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-foreground-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: lineColor }} />
                {metric === 'revenue' ? `Revenue (${currency})` : 'Verified payments'}
              </span>
              {metric === 'revenue' && (
                <span className="inline-flex items-center gap-1.5 text-foreground-muted">
                  <span className="inline-block h-0 w-4 border-t-2 border-dashed border-[#B7791F]" /> Period average
                </span>
              )}
              {peakKey && (
                <span className="ml-auto text-xs text-foreground-muted">
                  Peak: <span className="font-semibold text-foreground">{summary.peak?.fullLabel}</span>
                </span>
              )}
            </div>

            {methodSplit.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {methodSplit.slice(0, 6).map((m) => {
                  const share = summary.total > 0 ? (m.revenue / summary.total) * 100 : 0;
                  const color = METHOD_COLORS[m.method] ?? '#8A8783';
                  return (
                    <div key={m.method} className="rounded-lg border border-[#E5E2DE] p-3">
                      <div className="flex items-center gap-2 text-[13px]">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                        <span className="font-medium">{m.method.replace(/_/g, ' ')}</span>
                        <span className="ml-auto font-semibold tabular-nums">{m.revenue.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFECE8]">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, share)}%`, background: color }} />
                      </div>
                      <p className="mt-1.5 text-xs text-[#8A8783]">
                        {m.count} payment{m.count === 1 ? '' : 's'} · {share.toFixed(1)}% of period
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
