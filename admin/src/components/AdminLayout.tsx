import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChefHat,
  LayoutDashboard,
  Store,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  Calendar,
  CreditCard,
  ShieldCheck,
  ChartColumn,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAllCaterers } from "@/hooks/useCaterers";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STORAGE_KEY = "Caternet-sidebar-collapsed";

const mainNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/vendors",
    label: "Vendors",
    icon: Store,
    end: false,
    badgeKey: "pending" as const,
  },
  { to: "/payments", label: "Payments", icon: CreditCard, end: false },
  { to: "/bookings", label: "Bookings", icon: Calendar, end: false },
  { to: "/analytics", label: "Analytics", icon: ChartColumn, end: false },
  { to: "/users", label: "Customers", icon: Users, end: false },
  { to: "/admins", label: "Admins", icon: ShieldCheck, end: false },
];

const systemNav = [
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/vendors": "Vendors",
  "/caterers": "Vendors",
  "/payments": "Payments",
  "/analytics": "Analytics",
  "/users": "Customers",
  "/admins": "Admins",
  "/settings": "Settings",
};

function crumbFor(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  // Nested pages (e.g. /vendors/:id) fall back to their section.
  const section = `/${pathname.split("/")[1] ?? ""}`;
  if (routeTitles[section]) return routeTitles[section];
  return "Dashboard";
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  collapsed,
  badge,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end: boolean;
  collapsed: boolean;
  badge?: number;
  onNavigate: () => void;
}) {
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={badge ? `${label}, ${badge} pending` : label}
      className={({ isActive }) =>
        cn(
          "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-all duration-150 ease-out",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-white font-semibold text-[#181716] shadow-subtle"
            : "font-medium text-[#6E6A66] hover:bg-[#ECE9E5] hover:text-[#181716]",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              isActive ? "text-primary" : "text-[#8A8783]",
            )}
          />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{label}</span>
              {typeof badge === "number" && badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-subtle px-1.5 text-[11px] font-semibold text-primary">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={350}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent
        side="right"
        className="border-border bg-white text-foreground"
      >
        {label}
        {typeof badge === "number" && badge > 0 ? ` (${badge} pending)` : ""}
      </TooltipContent>
    </Tooltip>
  );
}

function NavGroup({
  label,
  items,
  collapsed,
  badges,
  onNavigate,
}: {
  label: string;
  items: typeof mainNav;
  collapsed: boolean;
  badges: Record<string, number>;
  onNavigate: () => void;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A8A29E]">
          {label}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            badge={
              "badgeKey" in item && item.badgeKey
                ? badges[item.badgeKey]
                : undefined
            }
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, user, logout } = useAuth();
  const { data: caterers } = useAllCaterers();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleCollapsed = () => setCollapsed((v) => !v);

  const email = profile?.email ?? user?.email ?? "";
  const name = profile?.name || "Admin";
  const initials = name.slice(0, 2).toUpperCase();
  const crumb = crumbFor(location.pathname);
  const pendingCount = (caterers ?? []).filter((c) => c.is_pending).length;
  const sidebarWidth = collapsed ? "w-[68px]" : "w-[248px]";
  const contentPad = collapsed ? "lg:pl-[68px]" : "lg:pl-[248px]";

  const accountMenu = (
    <>
      <DropdownMenuLabel className="font-normal">
        <p className="text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate("/settings")}>
        <Settings className="mr-2 h-4 w-4" /> Settings
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </DropdownMenuItem>
    </>
  );

  const sidebarBody = (isMobile: boolean, isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 pb-3 pt-4",
          isCollapsed && !isMobile && "flex-col justify-center gap-2 px-2",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <ChefHat className="h-4 w-4" />
        </div>
        {(!isCollapsed || isMobile) && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight text-[#181716]">
              Caternet
            </p>
            <p className="truncate text-xs text-[#8A8783]">Admin Console</p>
          </div>
        )}
        {(!isCollapsed || isMobile) && !isMobile && (
          <Tooltip delayDuration={350}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                aria-expanded="true"
                className="rounded-md p-1.5 text-[#8A8783] transition-colors hover:bg-[#ECE9E5] hover:text-[#181716]"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="border-border bg-white text-foreground"
            >
              Collapse sidebar
            </TooltipContent>
          </Tooltip>
        )}
        {isCollapsed && !isMobile && (
          <Tooltip delayDuration={350}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                aria-expanded="false"
                className="rounded-md p-1.5 text-[#8A8783] transition-colors hover:bg-[#ECE9E5] hover:text-[#181716]"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="border-border bg-white text-foreground"
            >
              Expand sidebar
            </TooltipContent>
          </Tooltip>
        )}
        {isMobile && (
          <button
            className="ml-auto rounded-md p-1 text-[#8A8783] hover:bg-[#ECE9E5] hover:text-[#181716] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav
        className="flex-1 space-y-5 overflow-y-auto px-2.5 py-2"
        aria-label="Primary"
      >
        <NavGroup
          label="Main"
          items={mainNav}
          collapsed={isCollapsed && !isMobile}
          badges={{ pending: pendingCount }}
          onNavigate={() => setMobileOpen(false)}
        />
        <NavGroup
          label="Settings"
          items={systemNav}
          collapsed={isCollapsed && !isMobile}
          badges={{}}
          onNavigate={() => setMobileOpen(false)}
        />
      </nav>

      <div className="space-y-2 p-2.5">
        {!isCollapsed || isMobile ? (
          pendingCount > 0 && (
            <div className="rounded-xl border border-border bg-white p-3.5">
              <p className="text-[13px] font-semibold text-foreground">
                Pending review
              </p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {pendingCount} vendor{pendingCount === 1 ? "" : "s"} need
                {pendingCount === 1 ? "s" : ""} approval
              </p>
              <button
                onClick={() => {
                  navigate("/vendors");
                  setMobileOpen(false);
                }}
                className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Review now <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        ) : (
          <Tooltip delayDuration={350}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  navigate("/vendors");
                }}
                aria-label={`Pending reviews, ${pendingCount}`}
                className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#6E6A66] shadow-subtle transition-colors hover:text-primary"
              >
                <Bell className="h-[18px] w-[18px]" />
                {pendingCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="border-border bg-white text-foreground"
            >
              Pending reviews ({pendingCount})
            </TooltipContent>
          </Tooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#ECE9E5]",
                isCollapsed && !isMobile && "justify-center px-0",
              )}
              aria-label="Account menu"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {initials}
              </span>
              {(!isCollapsed || isMobile) && (
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-medium text-[#181716]">
                    {name}
                  </span>
                  <span className="block truncate text-xs text-[#8A8783]">
                    {email}
                  </span>
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {accountMenu}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out lg:block",
            sidebarWidth,
          )}
          aria-label="Sidebar"
        >
          {sidebarBody(false, collapsed)}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <aside className="absolute inset-y-0 left-0 w-[272px] border-r border-sidebar-border bg-sidebar">
              {sidebarBody(true, false)}
            </aside>
          </div>
        )}

        <div
          className={cn(
            "bg-white transition-[padding] duration-200 ease-out",
            contentPad,
          )}
        >
          <header className="sticky top-0 z-20 bg-white">
            <div className="content-shell flex h-16 items-center gap-2 px-4 md:px-8">
              <button
                className="rounded-md p-1.5 text-foreground-secondary hover:bg-[#E9E6E1] lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <nav
                className="hidden items-center gap-1.5 text-[13px] sm:flex"
                aria-label="Breadcrumb"
              >
                <span className="text-foreground-muted">Caternet</span>
                <span className="text-border">/</span>
                <span className="font-medium text-foreground">{crumb}</span>
              </nav>
              <div className="ml-auto flex items-center gap-2">
                <button
                  className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[13px] text-foreground-muted transition-colors hover:border-[#D8D4D0] md:flex"
                  title="Search (visual)"
                >
                  <span>Search anything</span>
                  <kbd className="rounded border border-border bg-background px-1 font-sans text-[10px]">
                    ⌘K
                  </kbd>
                </button>
                <button
                  onClick={() => navigate("/vendors")}
                  aria-label={`Notifications, ${pendingCount} pending vendors`}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-[#6E6A66] transition-colors hover:text-primary"
                >
                  <Bell className="h-4 w-4" />
                  {pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C24141] px-1 text-[10px] font-semibold text-white">
                      {pendingCount > 24 ? "24+" : pendingCount}
                    </span>
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white"
                      aria-label="Account menu"
                    >
                      {initials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {accountMenu}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="content-shell px-4 pb-8 md:px-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
