import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Store, Trophy, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookingStatusOf, type AdminBooking } from '@/hooks/useBookings';
import type { Caterer } from '@/hooks/useCaterers';

interface VendorStat {
  catererId: string;
  name: string;
  total: number;
  pending: number;
  accepted: number;
  completed: number;
  declined: number;
  cancelled: number;
  acceptance: number; // accepted+completed ÷ answered
  responseRate: number; // answered ÷ total
}

type SortKey = 'total' | 'acceptance' | 'pending';

export function VendorBookingsLeaderboard({
  bookings,
  caterers,
  isLoading,
}: {
  bookings: AdminBooking[] | undefined;
  caterers: Caterer[] | undefined;
  isLoading?: boolean;
}) {
  const [sort, setSort] = useState<SortKey>('total');

  const catererName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of caterers ?? []) map[c.id] = c.name;
    for (const b of bookings ?? []) {
      if (b.caterer?.name && !map[b.caterer_id]) map[b.caterer_id] = b.caterer.name;
    }
    return map;
  }, [caterers, bookings]);

  const stats = useMemo<VendorStat[]>(() => {
    const map = new Map<string, VendorStat>();
    for (const b of bookings ?? []) {
      const id = b.caterer_id;
      if (!id) continue;
      let s = map.get(id);
      if (!s) {
        s = {
          catererId: id,
          name: catererName[id] ?? 'Unknown vendor',
          total: 0, pending: 0, accepted: 0, completed: 0, declined: 0, cancelled: 0,
          acceptance: 0, responseRate: 0,
        };
        map.set(id, s);
      }
      const st = bookingStatusOf(b);
      s.total += 1;
      if (st === 'pending') s.pending += 1;
      else if (st === 'accepted') s.accepted += 1;
      else if (st === 'completed') s.completed += 1;
      else if (st === 'declined') s.declined += 1;
      else if (st === 'cancelled') s.cancelled += 1;
    }
    const out = [...map.values()];
    for (const s of out) {
      const answered = s.total - s.pending;
      s.acceptance = answered > 0 ? ((s.accepted + s.completed) / answered) * 100 : 0;
      s.responseRate = s.total > 0 ? (answered / s.total) * 100 : 0;
      if (!catererName[s.catererId]) s.name = 'Unknown vendor';
      else s.name = catererName[s.catererId];
    }
    return out;
  }, [bookings, catererName]);

  const sorted = useMemo(() => {
    const arr = [...stats];
    if (sort === 'total') arr.sort((a, b) => b.total - a.total);
    if (sort === 'pending') arr.sort((a, b) => b.pending - a.pending);
    if (sort === 'acceptance') arr.sort((a, b) => b.acceptance - a.acceptance || b.total - a.total);
    return arr.slice(0, 8);
  }, [stats, sort]);

  const mostAccepted = useMemo(
    () => [...stats].filter((s) => s.total >= 3).sort((a, b) => b.accepted + b.completed - (a.accepted + a.completed)).slice(0, 3),
    [stats]
  );
  const needsAttention = useMemo(
    () => [...stats].filter((s) => s.pending > 0 || (s.total >= 3 && s.acceptance < 50)).sort((a, b) => b.pending - a.pending || a.acceptance - b.acceptance).slice(0, 3),
    [stats]
  );

  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <Store className="h-4 w-4" />
              </span>
              Vendor leaderboard
            </CardTitle>
            <CardDescription>Who gets the most requests — and who converts them.</CardDescription>
          </div>
          <div className="flex rounded-lg bg-background p-1 text-[13px] font-medium">
            {(
              [
                { key: 'total', label: 'Volume' },
                { key: 'acceptance', label: 'Acceptance' },
                { key: 'pending', label: 'Pending' },
              ] as { key: SortKey; label: string }[]
            ).map((o) => (
              <button
                key={o.key}
                onClick={() => setSort(o.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 transition-all',
                  sort === o.key ? 'bg-white text-foreground shadow-subtle' : 'text-foreground-muted hover:text-foreground'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : stats.length === 0 ? (
            <EmptyState icon={Store} title="No vendor stats yet" description="Vendor rankings will appear once bookings exist." />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {sorted.map((s, i) => (
                <li key={s.catererId} className="flex items-center gap-3 py-2.5">
                  <span className="w-6 shrink-0 text-center text-[13px] font-semibold tabular-nums text-foreground-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13.5px] font-medium">{s.name}</p>
                      <Badge variant="outline" className="shrink-0 tabular-nums">{s.total} total</Badge>
                      {s.pending > 0 && <Badge variant="warning" className="shrink-0 tabular-nums">{s.pending} pending</Badge>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFECE8]">
                        <div
                          className="h-full rounded-full bg-[#16845B]"
                          style={{ width: `${Math.min(100, s.acceptance)}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums">
                        {s.total - s.pending > 0 ? `${s.acceptance.toFixed(0)}%` : '—'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-foreground-muted">
                      {s.accepted + s.completed} accepted · {s.completed} completed · {s.declined} declined · {s.cancelled} cancelled
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <Trophy className="h-4 w-4 text-[#B7791F]" /> Top converters
            </CardTitle>
            <CardDescription>Most accepted bookings (min 3 requests).</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : mostAccepted.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-foreground-muted">Not enough data yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {mostAccepted.map((s) => (
                  <li key={s.catererId} className="flex items-center gap-2.5 rounded-lg border border-[#E5E2DE] p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E9F6F0] text-[13px] font-semibold text-[#16845B]">
                      {s.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{s.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {s.accepted + s.completed} accepted of {s.total} · {s.acceptance.toFixed(0)}%
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={needsAttention.length > 0 ? 'border-[#E3C878]' : undefined}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <TriangleAlert className="h-4 w-4 text-[#B7791F]" /> Needs attention
            </CardTitle>
            <CardDescription>Unanswered requests or low acceptance.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : needsAttention.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-foreground-muted">All caught up — no vendor needs a nudge.</p>
            ) : (
              <ul className="space-y-2.5">
                {needsAttention.map((s) => (
                  <li key={s.catererId} className="rounded-lg border border-[#E5E2DE] bg-[#FAF9F7] p-3">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13.5px] font-medium">{s.name}</p>
                      {s.pending > 0 && <Badge variant="warning" className="ml-auto shrink-0">{s.pending} pending</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {s.acceptance.toFixed(0)}% acceptance · {s.responseRate.toFixed(0)}% responded
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
