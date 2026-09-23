import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChefHat, LogOut, Menu, Settings, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type VendorTab = 'overview' | 'bookings' | 'menu' | 'packages' | 'reviews' | 'analytics' | 'profile';

export const VENDOR_TABS: { value: VendorTab; label: string }[] = [
  { value: 'overview', label: 'Dashboard' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'menu', label: 'Menu' },
  { value: 'packages', label: 'Packages' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'profile', label: 'Profile' },
];

/* ---------------------------------- StatusBadge ---------------------------------- */

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  declined: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  completed: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  live: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  suspended: 'bg-red-50 text-red-700 ring-red-600/20',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-500',
  accepted: 'bg-emerald-500',
  confirmed: 'bg-emerald-500',
  declined: 'bg-red-500',
  cancelled: 'bg-red-500',
  completed: 'bg-sky-500',
  live: 'bg-emerald-500',
  suspended: 'bg-red-500',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[key] ?? 'bg-muted text-muted-foreground ring-border',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[key] ?? 'bg-muted-foreground')} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ----------------------------------- KpiCard ----------------------------------- */

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-[20px] border border-border/70 bg-white p-5 transition-colors hover:border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight text-foreground">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconClassName ?? 'bg-primary/10 text-primary')}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

/* ---------------------------------- EmptyState ---------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------- PageHeader ---------------------------------- */

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground">{description}</p>
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

/* --------------------------------- SectionCard --------------------------------- */

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[20px] border border-border/70 bg-white', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            {title && <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* --------------------------------- VendorTopNav --------------------------------- */

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function VendorTopNav({
  activeTab,
  onTabChange,
  displayName,
  logoUrl,
  notificationCount,
  onNotificationsClick,
  onProfileSettings,
  onLogout,
}: {
  activeTab: VendorTab;
  onTabChange: (tab: VendorTab) => void;
  displayName: string;
  logoUrl?: string | null;
  notificationCount: number;
  onNotificationsClick: () => void;
  onProfileSettings: () => void;
  onLogout: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (tab: VendorTab) => {
    setMobileOpen(false);
    onTabChange(tab);
  };

  return (
    <div className="sticky top-3 z-40 mx-auto w-full max-w-6xl px-4">
      <div className="rounded-2xl border border-border/70 bg-white/90 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ChefHat className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="text-[16px] font-semibold tracking-tight text-foreground">CaterConnect</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl bg-muted/60 p-1 md:flex" aria-label="Vendor">
            {VENDOR_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-all duration-150 ease-out',
                  activeTab === tab.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-white hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={onNotificationsClick}
              aria-label="Pending requests"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} />
              {notificationCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {notificationCount}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl p-1 pr-1 transition-colors hover:bg-muted/60" aria-label="Account">
                  <Avatar className="h-9 w-9">
                    {logoUrl?.trim() ? (
                      <AvatarImage src={logoUrl.trim()} alt={`${displayName} logo`} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-[13px] font-semibold text-primary">
                      {initials(displayName || 'V')}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                <div className="px-3 py-2">
                  <p className="text-[13.5px] font-semibold text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Vendor account</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onProfileSettings} className="rounded-lg">
                  <Settings className="mr-2 h-4 w-4" /> Profile settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="rounded-lg text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border/60 px-3 py-3 md:hidden" aria-label="Vendor mobile">
            <div className="grid gap-1">
              {VENDOR_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => go(tab.value)}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors',
                    activeTab === tab.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- VendorLayout --------------------------------- */

export function VendorLayout({
  activeTab,
  onTabChange,
  displayName,
  logoUrl,
  notificationCount,
  onLogout,
  header,
  children,
}: {
  activeTab: VendorTab;
  onTabChange: (tab: VendorTab) => void;
  displayName: string;
  logoUrl?: string | null;
  notificationCount: number;
  onLogout: () => void;
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="portal min-h-screen bg-background">
      <div className="pt-3">
        <VendorTopNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          displayName={displayName}
          logoUrl={logoUrl}
          notificationCount={notificationCount}
          onNotificationsClick={() => onTabChange('bookings')}
          onProfileSettings={() => onTabChange('profile')}
          onLogout={onLogout}
        />
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
        {header}
        {children}
      </main>
    </div>
  );
}
