import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Trophy, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorViewStat } from '@/hooks/useCatererViews';
import { bookingStatusOf, type AdminBooking } from '@/hooks/useBookings';

type SortKey = 'views' | 'unique' | 'conversion';

export function ViewsLeaderboard({
  stats,
  catererNames,
  bookings,
  days,
  isLoading,
}: {
  stats: VendorViewStat[];
  catererNames: Record<string, string>;
  bookings: AdminBooking[] | undefined;
  days: number;
  isLoading?: boolean;
}) {
  const [sort, setSort] = useState<SortKey>('views');

  const since = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return d.getTime();
  }, [days]);

  const bookingsByCaterer = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings ?? []) {
      const t = +new Date(b.created_at);
      if (isNaN(t) || t < since) continue;
      if (bookingStatusOf(b) === 'cancelled') continue;
      map.set(b.caterer_id, (map.get(b.caterer_id) ?? 0) + 1);
    }
    return map;
  }, [bookings, since]);

  const rows = useMemo(() => {
    const arr = stats.map((s) => {
      const bookingCount = bookingsByCaterer.get(s.catererId) ?? 0;
      return {
        ...s,
        name: catererNames[s.catererId] ?? 'Unknown vendor',
        bookings: bookingCount,
        conversion: s.unique > 0 ? (bookingCount / s.unique) * 100 : 0,
      };
    });
    if (sort === 'views') arr.sort((a, b) => b.views - a.views);
    if (sort === 'unique') arr.sort((a, b) => b.unique - a.unique);
    if (sort === 'conversion') arr.sort((a, b) => b.conversion - a.conversion || b.views - a.views);
    return arr.slice(0, 10);
  }, [stats, catererNames, bookingsByCaterer, sort]);

  const maxViews = rows[0]?.views ?? 1;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Trophy className="h-4 w-4" />
            </span>
            Most viewed vendors
          </CardTitle>
          <CardDescription>
            Ranked by detail-page opens in the last {days} days · conversion = period bookings ÷ unique visitors
          </CardDescription>
        </div>
        <div className="flex rounded-lg bg-background p-1 text-[13px] font-medium">
          {(
            [
              { key: 'views', label: 'Views' },
              { key: 'unique', label: 'Unique' },
              { key: 'conversion', label: 'Conversion' },
            ] as { key: SortKey; label: string }[]
          ).map((o) => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className={cn(
                'rounded-md px-3 py-1.5 transition-all',
                sort === o.key ? 'bg-white text-foreground shadow-subtle' : 'text-foreground-muted hover:text-foreground',
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
        ) : rows.length === 0 ? (
          <EmptyState icon={EyeOff} title="No views in this range" description="Vendor rankings will appear once customers open profiles." />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((s, i) => (
              <li key={s.catererId} className="flex items-center gap-3 py-2.5">
                <span className="w-6 shrink-0 text-center text-[13px] font-semibold tabular-nums text-foreground-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to="/vendors" className="truncate text-[13.5px] font-medium hover:underline">
                      {s.name}
                    </Link>
                    <Badge variant="outline" className="shrink-0 tabular-nums">{s.views} views</Badge>
                    <Badge variant="outline" className="hidden shrink-0 tabular-nums sm:inline-flex">{s.unique} unique</Badge>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFECE8]">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (s.views / maxViews) * 100)}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs tabular-nums text-foreground-muted">
                      {s.bookings} bookings · {s.unique > 0 ? `${s.conversion.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
