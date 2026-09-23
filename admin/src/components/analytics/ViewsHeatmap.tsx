import { Fragment, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/PageHeader';
import { Clock, EyeOff } from 'lucide-react';
import { WEEKDAY_LABELS } from '@/hooks/useCatererViews';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function cellColor(value: number, max: number): string {
  if (value <= 0 || max <= 0) return '#F4F3F1';
  const t = value / max;
  // Primary maroon (#74263A) ramped by intensity.
  if (t >= 0.75) return '#74263A';
  if (t >= 0.5) return '#9A4A5E';
  if (t >= 0.25) return '#C9A9B4';
  return '#E8D3DA';
}

function cellText(value: number, max: number): string {
  if (value <= 0 || max <= 0) return 'text-transparent';
  return value / max >= 0.5 ? 'text-white' : 'text-foreground-secondary';
}

export function ViewsHeatmap({
  heatmap,
  isLoading,
  days,
}: {
  heatmap: number[][];
  isLoading?: boolean;
  days: number;
}) {
  const { max, total, peak } = useMemo(() => {
    let max = 0;
    let total = 0;
    let peak = { day: 0, hour: 0, value: 0 };
    heatmap.forEach((row, d) =>
      row.forEach((v, h) => {
        total += v;
        if (v > max) {
          max = v;
          peak = { day: d, hour: h, value: v };
        }
      }),
    );
    return { max, total, peak };
  }, [heatmap]);

  const hourLabel = (h: number) => `${h}:00`;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 space-y-0">
        <CardTitle className="flex items-center gap-2 text-[15px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <Clock className="h-4 w-4" />
          </span>
          When customers browse
        </CardTitle>
        <CardDescription>
          Views by weekday × hour · last {days} days
          {total > 0 && (
            <>
              {' · '}peak{' '}
              <span className="font-medium text-foreground">
                {WEEKDAY_LABELS[peak.day]}s {hourLabel(peak.hour)}
              </span>{' '}
              ({peak.value} views)
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[240px] w-full rounded-lg" />
        ) : total === 0 ? (
          <EmptyState
            icon={EyeOff}
            title="No views to map yet"
            description="The heatmap fills in once customers open caterer profiles in the mobile app."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div
                  className="grid gap-[3px]"
                  style={{ gridTemplateColumns: `52px repeat(24, minmax(0, 1fr))` }}
                  role="img"
                  aria-label={`Profile view heatmap. Peak: ${WEEKDAY_LABELS[peak.day]} ${hourLabel(peak.hour)} with ${peak.value} views.`}
                >
                  <span />
                  {HOURS.map((h) => (
                    <span
                      key={h}
                      className={cn(
                        'pb-1 text-center text-[10px] tabular-nums',
                        h % 3 === 0 ? 'text-foreground-muted' : 'text-transparent',
                      )}
                    >
                      {h}
                    </span>
                  ))}
                  {heatmap.map((row, d) => (
                    <Fragment key={d}>
                      <span className="flex items-center pr-1 text-xs font-medium text-foreground-muted">
                        {WEEKDAY_LABELS[d]}
                      </span>
                      {row.map((v, h) => (
                        <span
                          key={`${d}-${h}`}
                          title={`${WEEKDAY_LABELS[d]} ${hourLabel(h)} — ${v} view${v === 1 ? '' : 's'}`}
                          className={cn(
                            'flex h-7 items-center justify-center rounded-[4px] text-[10px] font-semibold tabular-nums transition-transform hover:scale-110',
                            cellText(v, max),
                          )}
                          style={{ background: cellColor(v, max) }}
                        >
                          {v > 0 ? v : ''}
                        </span>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
              <span>Less</span>
              <span className="flex gap-[3px]" aria-hidden>
                {['#F4F3F1', '#E8D3DA', '#C9A9B4', '#9A4A5E', '#74263A'].map((c) => (
                  <span key={c} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
                ))}
              </span>
              <span>More</span>
              <span className="ml-auto hidden sm:inline">Hours in device-local time</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
