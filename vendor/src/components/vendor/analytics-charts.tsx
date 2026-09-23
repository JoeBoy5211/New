import { Fragment, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis as ReXAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, Clock, EyeOff } from 'lucide-react';
import { EmptyState } from '@/components/vendor/portal';
import { VIEW_WEEKDAY_LABELS, type VendorViewDayBucket } from '@/hooks/supabase/useCatererViews';
import { cn } from '@/lib/utils';

/* ------------------------------- Trend chart -------------------------------- */

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: VendorViewDayBucket }[] }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-white px-3 py-2.5 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{b.key}</p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
        {b.views} <span className="text-xs font-medium text-muted-foreground">view{b.views === 1 ? '' : 's'}</span>
      </p>
      <div className="mt-1.5 space-y-1 text-[13px]">
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" /> Signed-in
          </span>
          <span className="font-semibold tabular-nums text-foreground">{b.signedIn}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary/40" /> Guests
          </span>
          <span className="font-semibold tabular-nums text-foreground">{b.guests}</span>
        </p>
      </div>
    </div>
  );
}

export function VendorViewsTrendCard({
  buckets,
  days,
}: {
  buckets: VendorViewDayBucket[];
  days: number;
}) {
  const hasData = useMemo(() => buckets.some((b) => b.views > 0), [buckets]);

  return (
    <section className="rounded-[20px] border border-border/70 bg-white">
      <div className="border-b border-border/60 px-5 py-4">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
          </span>
          Profile views over time
        </h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Daily opens of your public profile · signed-in vs guest · last {days} days
        </p>
      </div>
      <div className="p-5">
        {!hasData ? (
          <EmptyState
            icon={EyeOff}
            title="No views in this range"
            description="Share your profile link with customers — views will appear here once they open it in the mobile app."
          />
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <ReXAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  allowDecimals={false}
                />
                <ReTooltip cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '4 4' }} content={<TrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="signedIn"
                  name="Signed-in"
                  stackId="views"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.85}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: 'hsl(var(--primary))' }}
                />
                <Area
                  type="monotone"
                  dataKey="guests"
                  name="Guests"
                  stackId="views"
                  stroke="hsl(var(--primary) / 0.45)"
                  fill="hsl(var(--primary) / 0.35)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

/* --------------------------------- Heatmap ---------------------------------- */

const HEAT_RAMP = ['hsl(var(--muted))', 'hsl(var(--primary) / 0.25)', 'hsl(var(--primary) / 0.45)', 'hsl(var(--primary) / 0.7)', 'hsl(var(--primary))'];

function heatColor(value: number, max: number): string {
  if (value <= 0 || max <= 0) return HEAT_RAMP[0];
  const t = value / max;
  if (t >= 0.75) return HEAT_RAMP[4];
  if (t >= 0.5) return HEAT_RAMP[3];
  if (t >= 0.25) return HEAT_RAMP[2];
  return HEAT_RAMP[1];
}

export function VendorViewsHeatmapCard({
  heatmap,
  days,
  peak,
}: {
  heatmap: number[][];
  days: number;
  peak: { day: number; hour: number; value: number };
}) {
  const total = useMemo(() => heatmap.flat().reduce((s, v) => s + v, 0), [heatmap]);
  const max = peak.value;

  return (
    <section className="rounded-[20px] border border-border/70 bg-white">
      <div className="border-b border-border/60 px-5 py-4">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" strokeWidth={1.75} />
          </span>
          When customers browse you
        </h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Views by weekday × hour · last {days} days
          {total > 0 && (
            <>
              {' · '}busiest{' '}
              <span className="font-medium text-foreground">
                {VIEW_WEEKDAY_LABELS[peak.day]}s {peak.hour}:00
              </span>
            </>
          )}
        </p>
      </div>
      <div className="p-5">
        {total === 0 ? (
          <EmptyState
            icon={EyeOff}
            title="No views to map yet"
            description="The heatmap fills in once customers open your profile in the mobile app."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div
                  className="grid gap-[3px]"
                  style={{ gridTemplateColumns: `44px repeat(24, minmax(0, 1fr))` }}
                  role="img"
                  aria-label={`Profile view heatmap. Busiest: ${VIEW_WEEKDAY_LABELS[peak.day]} ${peak.hour}:00 with ${peak.value} views.`}
                >
                  <span />
                  {Array.from({ length: 24 }, (_, h) => (
                    <span
                      key={h}
                      className={cn(
                        'pb-1 text-center text-[10px] tabular-nums',
                        h % 3 === 0 ? 'text-muted-foreground' : 'text-transparent',
                      )}
                    >
                      {h}
                    </span>
                  ))}
                  {heatmap.map((row, d) => (
                    <Fragment key={d}>
                      <span className="flex items-center pr-1 text-xs font-medium text-muted-foreground">
                        {VIEW_WEEKDAY_LABELS[d]}
                      </span>
                      {row.map((v, h) => (
                        <span
                          key={`${d}-${h}`}
                          title={`${VIEW_WEEKDAY_LABELS[d]} ${h}:00 — ${v} view${v === 1 ? '' : 's'}`}
                          className={cn(
                            'flex h-6 items-center justify-center rounded-[4px] text-[10px] font-semibold tabular-nums transition-transform hover:scale-110',
                            v > 0 && v / max >= 0.5 ? 'text-primary-foreground' : 'text-transparent',
                          )}
                          style={{ background: heatColor(v, max) }}
                        >
                          {v > 0 ? v : ''}
                        </span>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <span className="flex gap-[3px]" aria-hidden>
                {HEAT_RAMP.map((c) => (
                  <span key={c} className="h-3 w-3 rounded-[3px] border border-border/50" style={{ background: c }} />
                ))}
              </span>
              <span>More</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
