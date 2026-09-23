import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis as ReXAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/PageHeader';
import { CalendarRange, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookingStatusOf, type AdminBooking } from '@/hooks/useBookings';

type RangeKey = '30d' | '90d' | '6m' | '12m' | 'all';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: '6m', label: '6M' },
  { key: '12m', label: '12M' },
  { key: 'all', label: 'All' },
];

const SERIES = [
  { key: 'accepted', label: 'Accepted', color: '#16845B' },
  { key: 'pending', label: 'Pending', color: '#B7791F' },
  { key: 'completed', label: 'Completed', color: '#4D6B8A' },
  { key: 'declined', label: 'Declined', color: '#C24141' },
  { key: 'cancelled', label: 'Cancelled', color: '#8A8783' },
] as const;

type SeriesKey = (typeof SERIES)[number]['key'];

interface Bucket {
  key: string;
  label: string;
  fullLabel: string;
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  completed: number;
  cancelled: number;
  _start: number;
  _end: number;
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
  return `${d.toLocaleString('en', { month: 'short' })} '${String(y).slice(2)}`;
}

function dayShortLabel(d: Date) {
  return d.toLocaleString('en', { day: 'numeric', month: 'short' });
}

function buildBuckets(bookings: AdminBooking[], range: RangeKey): { buckets: Bucket[]; granularity: 'day' | 'week' | 'month' } {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const times = bookings
    .map((b) => +new Date(b.created_at))
    .filter((t) => !isNaN(t));
  const earliest = times.length ? new Date(Math.min(...times)) : null;

  if (range === '12m' || range === 'all') {
    let start: Date;
    if (range === '12m' || !earliest) {
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    } else {
      start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      const cap = new Date(now.getFullYear(), now.getMonth() - 35, 1);
      if (start < cap) start = cap;
    }
    const buckets: Bucket[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= now) {
      const key = toMonthKey(cursor);
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0).getTime();
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      buckets.push({
        key,
        label: monthShortLabel(key),
        fullLabel: cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
        total: 0, pending: 0, accepted: 0, declined: 0, completed: 0, cancelled: 0,
        _start: monthStart, _end: monthEnd,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    fillBuckets(buckets, bookings);
    return { buckets, granularity: 'month' };
  }

  if (range === '6m') {
    const WEEKS = 26;
    const buckets: Bucket[] = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const endC = new Date(weekEnd);
      endC.setHours(23, 59, 59, 999);
      buckets.push({
        key: toDayKey(weekEnd),
        label: dayShortLabel(weekEnd),
        fullLabel: `${weekStart.toLocaleDateString('en', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        total: 0, pending: 0, accepted: 0, declined: 0, completed: 0, cancelled: 0,
        _start: +weekStart, _end: +endC,
      });
    }
    fillBuckets(buckets, bookings);
    return { buckets, granularity: 'week' };
  }

  const days = range === '30d' ? 30 : 90;
  const buckets: Bucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    buckets.push({
      key: toDayKey(d),
      label: dayShortLabel(d),
      fullLabel: d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      total: 0, pending: 0, accepted: 0, declined: 0, completed: 0, cancelled: 0,
      _start: +start, _end: +end,
    });
  }
  fillBuckets(buckets, bookings);
  return { buckets, granularity: 'day' };
}

function fillBuckets(buckets: Bucket[], bookings: AdminBooking[]) {
  for (const b of bookings) {
    const t = +new Date(b.created_at);
    if (isNaN(t)) continue;
    const s = bookingStatusOf(b) as SeriesKey | string;
    const bucket = buckets.find((x) => t >= x._start && t <= x._end);
    if (!bucket) continue;
    bucket.total += 1;
    if (s === 'pending' || s === 'accepted' || s === 'declined' || s === 'completed' || s === 'cancelled') {
      bucket[s] += 1;
    }
  }
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Bucket }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div className="min-w-[210px] rounded-lg border border-[#E5E2DE] bg-white px-3 py-2.5 shadow-float">
      <p className="text-xs font-medium text-[#8A8783]">{b.fullLabel}</p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums">
        {b.total} <span className="text-xs font-medium text-[#8A8783]">booking{b.total === 1 ? '' : 's'}</span>
      </p>
      <div className="mt-1.5 space-y-1 text-[13px]">
        {SERIES.map((s) => (
          <p key={s.key} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-[#5F5C59]">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold tabular-nums">{b[s.key]}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function BookingsStatusChart({
  bookings,
  isLoading,
}: {
  bookings: AdminBooking[] | undefined;
  isLoading?: boolean;
}) {
  const [range, setRange] = useState<RangeKey>('6m');
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  const list = useMemo(() => bookings ?? [], [bookings]);
  const { buckets, granularity } = useMemo(() => buildBuckets(list, range), [list, range]);

  const summary = useMemo(() => {
    const sum = (k: SeriesKey | 'total') => buckets.reduce((s, b) => s + b[k], 0);
    const total = sum('total');
    const accepted = sum('accepted');
    const completed = sum('completed');
    const pending = sum('pending');
    const declined = sum('declined');
    const cancelled = sum('cancelled');
    const answered = total - pending;
    const acceptance = answered > 0 ? ((accepted + completed) / answered) * 100 : 0;
    const completion = total > 0 ? (completed / total) * 100 : 0;
    return { total, accepted, completed, pending, declined, cancelled, acceptance, completion };
  }, [buckets]);

  const hasData = buckets.some((b) => b.total > 0);
  const toggle = (k: SeriesKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <Card className="mt-3">
      <CardHeader className="flex flex-col gap-3 space-y-0 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <CalendarRange className="h-4 w-4" />
            </span>
            Bookings by status
          </CardTitle>
          <CardDescription className="mt-1">
            Platform-wide requests over time · <span className="capitalize">per {granularity}</span> · click a status to hide/show
          </CardDescription>
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
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="No booking data yet"
            description="Once customers send requests, the status trend will appear here."
          />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-[#E5E2DE] bg-[#FAF9F7] p-3">
                <p className="text-xs text-[#8A8783]">Requests in period</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">{summary.total}</p>
                <p className="mt-1.5 text-xs text-[#8A8783]">
                  {summary.pending} pending · {summary.accepted + summary.completed} accepted+
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E2DE] p-3">
                <p className="text-xs text-[#8A8783]">Acceptance rate</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">
                  {summary.total - summary.pending > 0 ? `${summary.acceptance.toFixed(1)}%` : '—'}
                </p>
                <p className="mt-1.5 text-xs text-[#8A8783]">accepted + completed ÷ answered</p>
              </div>
              <div className="rounded-lg border border-[#E5E2DE] p-3">
                <p className="text-xs text-[#8A8783]">Completed</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">{summary.completed}</p>
                <p className="mt-1.5 text-xs text-[#8A8783]">{summary.completion.toFixed(1)}% of period requests</p>
              </div>
              <div className="rounded-lg border border-[#E5E2DE] p-3">
                <p className="text-xs text-[#8A8783]">Lost</p>
                <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">
                  {summary.declined + summary.cancelled}
                </p>
                <p className="mt-1.5 text-xs text-[#8A8783]">
                  {summary.declined} declined · {summary.cancelled} cancelled
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
              {SERIES.map((s) => {
                const off = hidden.has(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggle(s.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-all',
                      off ? 'border-[#E5E2DE] text-[#8A8783] opacity-50' : 'border-[#E5E2DE] text-foreground hover:border-[#D8D4D0]'
                    )}
                    title={off ? `Show ${s.label}` : `Hide ${s.label}`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: off ? '#D8D4D0' : s.color }} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 h-[300px]">
              {!hasData ? (
                <EmptyState
                  icon={CalendarX}
                  title="No requests in this range"
                  description="Try a wider range — older bookings may fall outside it."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buckets} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
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
                      width={40}
                      allowDecimals={false}
                    />
                    <ReTooltip cursor={{ stroke: '#D8D4D0', strokeDasharray: '4 4' }} content={<ChartTooltip />} />
                    {SERIES.map((s) =>
                      hidden.has(s.key) ? null : (
                        <Line
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          name={s.label}
                          stroke={s.color}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: s.color }}
                        />
                      )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
