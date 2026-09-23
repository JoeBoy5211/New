import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis as ReXAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/PageHeader';
import { TrendingUp, EyeOff } from 'lucide-react';
import type { ViewDayBucket } from '@/hooks/useCatererViews';

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ViewDayBucket }[] }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-lg border border-[#E5E2DE] bg-white px-3 py-2.5 shadow-float">
      <p className="text-xs font-medium text-[#8A8783]">{b.key}</p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums">
        {b.views} <span className="text-xs font-medium text-[#8A8783]">view{b.views === 1 ? '' : 's'}</span>
      </p>
      <div className="mt-1.5 space-y-1 text-[13px]">
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-[#5F5C59]">
            <span className="h-2 w-2 rounded-full" style={{ background: '#74263A' }} /> Signed-in
          </span>
          <span className="font-semibold tabular-nums">{b.signedIn}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-[#5F5C59]">
            <span className="h-2 w-2 rounded-full" style={{ background: '#C9A9B4' }} /> Guests
          </span>
          <span className="font-semibold tabular-nums">{b.guests}</span>
        </p>
      </div>
    </div>
  );
}

export function ViewsTrendChart({
  buckets,
  isLoading,
  days,
}: {
  buckets: ViewDayBucket[];
  isLoading?: boolean;
  days: number;
}) {
  const hasData = useMemo(() => buckets.some((b) => b.views > 0), [buckets]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 space-y-0">
        <CardTitle className="flex items-center gap-2 text-[15px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <TrendingUp className="h-4 w-4" />
          </span>
          Profile views over time
        </CardTitle>
        <CardDescription>
          Daily detail-page opens · signed-in vs guest · last {days} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : !hasData ? (
          <EmptyState
            icon={EyeOff}
            title="No views in this range"
            description="Views are tracked from the mobile caterer detail page. Try a wider range."
          />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Area
                  type="monotone"
                  dataKey="signedIn"
                  name="Signed-in"
                  stackId="views"
                  stroke="#74263A"
                  fill="#74263A"
                  fillOpacity={0.85}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#74263A' }}
                />
                <Area
                  type="monotone"
                  dataKey="guests"
                  name="Guests"
                  stackId="views"
                  stroke="#C9A9B4"
                  fill="#C9A9B4"
                  fillOpacity={0.7}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#C9A9B4' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
