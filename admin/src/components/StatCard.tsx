import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type DeltaTone = 'up' | 'down' | 'neutral';

const DELTA_STYLES: Record<DeltaTone, string> = {
  up: 'bg-[#EAF6F0] text-[#147A54] ring-1 ring-inset ring-[#16845B]/15',
  down: 'bg-[#FDECEC] text-[#B33737] ring-1 ring-inset ring-[#C24141]/15',
  neutral: 'bg-[#F4F3F1] text-[#5F5C59] ring-1 ring-inset ring-black/[0.06]',
};

export function StatCard({
  icon: Icon,
  tint,
  label,
  value,
  hint,
  delta,
  loading,
  onClick,
  active,
}: {
  icon: LucideIcon;
  tint: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  delta?: { text: string; tone?: DeltaTone };
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const clickable = typeof onClick === 'function';
  return (
    <Card
      onClick={onClick}
      className={cn(
        'rounded-2xl border-border-subtle bg-white shadow-subtle transition-all duration-200',
        clickable && 'cursor-pointer hover:-translate-y-[2px] hover:border-border hover:shadow-float',
        active && 'border-primary/40 ring-1 ring-primary/20'
      )}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-pressed={clickable ? !!active : undefined}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/[0.05]', tint)}>
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="truncate text-sm font-medium text-foreground-secondary">{label}</p>
          </div>
          {delta && !loading && (
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums',
                DELTA_STYLES[delta.tone ?? 'neutral']
              )}
            >
              {delta.text}
            </span>
          )}
        </div>
        {loading ? (
          <>
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-1.5 h-3 w-28" />
          </>
        ) : (
          <>
            <p className="kpi-number mt-3 tabular-nums">{value}</p>
            {hint && <p className="mt-1 truncate text-xs text-foreground-muted">{hint}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
