import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Store,
  Search,
  Phone,
  Mail,
  Globe,
  CreditCard,
  CalendarClock,
  AlertTriangle,
  Upload,
  ImageIcon,
  Loader2,
  ReceiptText,
  Plus,
  Clock,
  UserPlus,
  FileText,
} from "lucide-react";
import { useAllCaterers, useUpdateCaterer, Caterer } from "@/hooks/useCaterers";
import { useCatererViewTrend } from "@/hooks/useCatererViews";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { StatCard } from "@/components/StatCard";
import { usePaymentsByCaterer } from "@/hooks/usePayments";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis as ReXAxis,
  YAxis,
} from "recharts";

function getAccountStatus(
  c: Caterer,
): "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED" {
  if (c.account_status)
    return c.account_status as
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | "SUSPENDED";
  if (c.is_pending) return "PENDING";
  if (c.is_approved) return "APPROVED";
  return "SUSPENDED";
}
function getSubStatus(c: Caterer): "ACTIVE" | "PAYMENT_DUE" | "EXPIRED" {
  return (
    (c.subscription_status as "ACTIVE" | "PAYMENT_DUE" | "EXPIRED") ?? "ACTIVE"
  );
}
function daysUntilExpiry(c: Caterer): number | null {
  if (!c.subscription_expires_at) return null;
  return Math.ceil(
    (new Date(c.subscription_expires_at).getTime() - Date.now()) / 86400000,
  );
}
function toneOf(c: Caterer): "pending" | "live" | "suspended" {
  const s = getAccountStatus(c);
  if (s === "PENDING") return "pending";
  if (s === "APPROVED") return "live";
  return "suspended";
}
function subTone(c: Caterer): "pending" | "live" | "suspended" {
  const s = getSubStatus(c);
  const d = daysUntilExpiry(c);
  if (s === "EXPIRED" || (d !== null && d < 0)) return "suspended";
  if (s === "PAYMENT_DUE" || (d !== null && d <= 7)) return "pending";
  return "live";
}

export default function Caterers() {
  const { data: caterers, isLoading, error, refetch } = useAllCaterers();
  const navigate = useNavigate();
  const updateCaterer = useUpdateCaterer();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [recentOnly, setRecentOnly] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [latDraft, setLatDraft] = useState("");
  const [lngDraft, setLngDraft] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const viewing = caterers?.find((c) => c.id === viewingId) ?? null;

  const errMsg = (e: unknown) => {
    if (e instanceof Error && e.message) return e.message;
    if (e && typeof e === "object") {
      const o = e as Record<string, unknown>;
      const parts: string[] = [];
      if (typeof o["message"] === "string" && o["message"])
        parts.push(o["message"] as string);
      if (typeof o["details"] === "string" && o["details"])
        parts.push(o["details"] as string);
      if (typeof o["hint"] === "string" && o["hint"])
        parts.push(`Hint: ${o["hint"] as string}`);
      if (typeof o["code"] === "string" && o["code"])
        parts.push(`(${o["code"] as string})`);
      if (parts.length > 0) return parts.join(" ");
      try {
        return JSON.stringify(o);
      } catch {
        /* fall through */
      }
    }
    return "Could not update vendor.";
  };

  const filtered = useMemo(() => {
    let list = caterers ?? [];
    if (tab === "pending")
      list = list.filter((c) => getAccountStatus(c) === "PENDING");
    if (tab === "approved")
      list = list.filter((c) => getAccountStatus(c) === "APPROVED");
    if (tab === "premium")
      list = list.filter((c) => c.is_premium === true);
    if (tab === "suspended")
      list = list.filter(
        (c) =>
          getAccountStatus(c) === "SUSPENDED" ||
          getAccountStatus(c) === "REJECTED",
      );
    if (tab === "due")
      list = list.filter(
        (c) =>
          getSubStatus(c) === "PAYMENT_DUE" ||
          (daysUntilExpiry(c) !== null &&
            daysUntilExpiry(c)! >= 0 &&
            daysUntilExpiry(c)! <= 7),
      );
    if (tab === "expired")
      list = list.filter(
        (c) =>
          getSubStatus(c) === "EXPIRED" ||
          (daysUntilExpiry(c) !== null && daysUntilExpiry(c)! < 0),
      );
    if (recentOnly) {
      const cutoff = Date.now() - 30 * 86400000;
      list = list.filter((c) => new Date(c.created_at).getTime() >= cutoff);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        `${c.name} ${c.location ?? ""} ${c.contact_phone ?? ""} ${c.contact_email ?? ""} ${(c.service_areas ?? []).join(" ")}`
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [caterers, tab, search, recentOnly]);

  const counts = useMemo(() => {
    const list = caterers ?? [];
    return {
      all: list.length,
      pending: list.filter((c) => getAccountStatus(c) === "PENDING").length,
      approved: list.filter((c) => getAccountStatus(c) === "APPROVED").length,
      premium: list.filter((c) => c.is_premium === true).length,
      suspended: list.filter(
        (c) =>
          getAccountStatus(c) === "SUSPENDED" ||
          getAccountStatus(c) === "REJECTED",
      ).length,
      due: list.filter(
        (c) =>
          getSubStatus(c) === "PAYMENT_DUE" ||
          (daysUntilExpiry(c) !== null &&
            daysUntilExpiry(c)! >= 0 &&
            daysUntilExpiry(c)! <= 7),
      ).length,
      expired: list.filter(
        (c) =>
          getSubStatus(c) === "EXPIRED" ||
          (daysUntilExpiry(c) !== null && daysUntilExpiry(c)! < 0),
      ).length,
    };
  }, [caterers]);

  const vendorStats = useMemo(() => {
    const list = caterers ?? [];
    const now = Date.now();
    const d30 = now - 30 * 86400000;
    const d7 = now - 7 * 86400000;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const new30 = list.filter(
      (c) => new Date(c.created_at).getTime() >= d30,
    ).length;
    const new7 = list.filter(
      (c) => new Date(c.created_at).getTime() >= d7,
    ).length;
    const newMonth = list.filter(
      (c) => new Date(c.created_at).getTime() >= monthStart.getTime(),
    ).length;
    const liveShare = list.length
      ? Math.round((counts.approved / list.length) * 100)
      : 0;
    return { new30, new7, newMonth, liveShare };
  }, [caterers, counts.approved]);

  const openViewing = (id: string) => {
    const c = caterers?.find((x) => x.id === id);
    setNotesDraft(c?.admin_notes ?? "");
    setLatDraft(c?.latitude != null ? String(c.latitude) : "");
    setLngDraft(c?.longitude != null ? String(c.longitude) : "");
    setViewingId(id);
  };

  const setStatus = async (
    caterer: Caterer,
    approved: boolean,
    notes?: string | null,
  ) => {
    const newAccount: Caterer["account_status"] = approved
      ? "APPROVED"
      : "SUSPENDED";
    setActingId(caterer.id);
    try {
      const full = {
        is_approved: approved,
        is_pending: false,
        account_status: newAccount,
        admin_notes: notes ?? caterer.admin_notes ?? null,
        approved_at: approved ? new Date().toISOString() : null,
        approved_by: approved ? (user?.id ?? null) : null,
      } as Partial<Caterer>;
      try {
        await updateCaterer.mutateAsync({ id: caterer.id, updates: full });
      } catch (firstErr) {
        // 400 from PostgREST almost always means a bad column in the payload
        // (e.g. account_status / approved_* not in the real table yet).
        // Retry with the minimal legacy columns so Approve still works.
        const msg = errMsg(firstErr);
        console.error("setStatus full payload failed, retrying minimal.", {
          id: caterer.id,
          full,
          error: firstErr,
          message: msg,
        });
        if (/column|schema cache|PGRST|400|bad request|not found/i.test(msg)) {
          await updateCaterer.mutateAsync({
            id: caterer.id,
            updates: {
              is_approved: approved,
              is_pending: false,
            } as Partial<Caterer>,
          });
        } else {
          throw firstErr;
        }
      }
      toast({
        title: approved ? "Vendor approved" : "Vendor suspended",
        description: `${caterer.name} ${approved ? "is now live in the mobile app." : "has been taken offline."}`,
      });
      setViewingId(null);
    } catch (e) {
      try {
        console.error(
          "setStatus failed: " +
            JSON.stringify(e, Object.getOwnPropertyNames(e as object)),
        );
      } catch {
        console.error("setStatus failed", e);
      }
      toast({
        title: "Action failed",
        description: errMsg(e),
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  const setExpiry = async (caterer: Caterer, isoDate: string) => {
    if (!isoDate) return;
    const d = new Date(isoDate + "T00:00:00");
    if (isNaN(d.getTime())) return;
    setActingId(caterer.id);
    try {
      await updateCaterer.mutateAsync({
        id: caterer.id,
        updates: {
          subscription_expires_at: d.toISOString(),
        } as Partial<Caterer>,
      });
      toast({
        title: "Expiry updated",
        description: `Expires ${d.toLocaleDateString()}`,
      });
    } catch (e) {
      console.error("setExpiry failed", e);
      toast({
        title: "Action failed",
        description: errMsg(e),
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  const setSubStatus = async (
    caterer: Caterer,
    s: Caterer["subscription_status"],
  ) => {
    setActingId(caterer.id);
    try {
      await updateCaterer.mutateAsync({
        id: caterer.id,
        updates: { subscription_status: s } as Partial<Caterer>,
      });
      toast({
        title: "Subscription updated",
        description: `${caterer.name} → ${s}`,
      });
    } catch (e) {
      console.error("setSubStatus failed", e);
      toast({
        title: "Action failed",
        description: errMsg(e),
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  const saveNotes = async () => {
    if (!viewing) return;
    setActingId(viewing.id);
    try {
      await updateCaterer.mutateAsync({
        id: viewing.id,
        updates: { admin_notes: notesDraft || null },
      });
      toast({
        title: "Notes saved",
        description: "Manual payment / review notes updated.",
      });
    } catch (e) {
      console.error("saveNotes failed", e);
      toast({
        title: "Action failed",
        description: errMsg(e),
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  const togglePremium = async (caterer: Caterer, next: boolean) => {
    setActingId(caterer.id);
    try {
      await updateCaterer.mutateAsync({
        id: caterer.id,
        updates: { is_premium: next } as Partial<Caterer>,
      });
      toast({
        title: next ? "Marked as premium" : "Premium removed",
        description: next
          ? `${caterer.name} now appears first on the home page.`
          : `${caterer.name} is a regular listing again.`,
      });
    } catch (e) {
      const msg = errMsg(e);
      console.error("togglePremium failed", e);
      toast({
        title: "Action failed",
        description: /column|schema cache|PGRST|400|bad request|not found/i.test(msg)
          ? "The `is_premium` column is missing — run admin/supabase-vendor-premium.sql first."
          : msg,
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  const saveCoords = async () => {
    if (!viewing) return;
    const parse = (raw: string, min: number, max: number, label: string) => {
      const t = raw.trim();
      if (!t) return { ok: true as const, value: null };
      const n = Number(t);
      if (!Number.isFinite(n) || n < min || n > max)
        return { ok: false as const, value: null, label };
      return { ok: true as const, value: n };
    };
    const lat = parse(latDraft, -90, 90, "Latitude");
    const lng = parse(lngDraft, -180, 180, "Longitude");
    if (!lat.ok || !lng.ok) {
      toast({
        title: "Invalid coordinates",
        description: "Latitude must be −90…90 and longitude −180…180 (decimals).",
        variant: "destructive",
      });
      return;
    }
    setActingId(viewing.id);
    try {
      await updateCaterer.mutateAsync({
        id: viewing.id,
        updates: { latitude: lat.value, longitude: lng.value } as Partial<Caterer>,
      });
      toast({
        title: "Location saved",
        description:
          lat.value == null
            ? "Coordinates cleared — vendor sorts last in Near you."
            : "Vendor now appears in Near-you sorting.",
      });
    } catch (e) {
      const msg = errMsg(e);
      console.error("saveCoords failed", e);
      toast({
        title: "Action failed",
        description: /column|schema cache|PGRST|400|bad request|not found/i.test(msg)
          ? "The coordinate columns are missing — run mobile/supabase-vendor-geo.sql first."
          : msg,
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  const isFiltering = search.trim() !== "" || tab !== "all" || recentOnly;

  return (
    <AdminLayout>
      <PageHeader
        title="Vendors"
        description="Review and manage vendors registered on Caternet."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Store}
          tint="bg-primary-subtle text-primary"
          label="Total Vendors"
          value={counts.all}
          hint={
            counts.all
              ? `${counts.approved} live · ${counts.pending} pending`
              : "No vendors yet"
          }
          delta={
            vendorStats.newMonth > 0
              ? { text: `+${vendorStats.newMonth} this month`, tone: "up" }
              : undefined
          }
          loading={isLoading}
          active={tab === "all" && !recentOnly}
          onClick={() => {
            setTab("all");
            setRecentOnly(false);
          }}
        />
        <StatCard
          icon={UserPlus}
          tint="bg-[#EEF3F8] text-[#4D6B8A]"
          label="New Vendors · 30 days"
          value={vendorStats.new30}
          hint={`${vendorStats.new7} in the last 7 days`}
          delta={
            vendorStats.new30 > 0
              ? { text: `${vendorStats.new7} this week`, tone: "neutral" }
              : undefined
          }
          loading={isLoading}
          active={recentOnly}
          onClick={() => setRecentOnly((v) => !v)}
        />
        <StatCard
          icon={CheckCircle2}
          tint="bg-[#E9F6F0] text-[#16845B]"
          label="Live Vendors"
          value={counts.approved}
          hint={
            counts.all
              ? `${vendorStats.liveShare}% of all vendors · visible in app`
              : "Approve vendors to go live"
          }
          loading={isLoading}
          active={tab === "approved"}
          onClick={() => {
            setTab("approved");
            setRecentOnly(false);
          }}
        />
        <StatCard
          icon={Clock}
          tint="bg-[#FFF5DF] text-[#B7791F]"
          label="Pending Review"
          value={counts.pending}
          hint={
            counts.suspended
              ? `${counts.suspended} suspended · ${counts.due} payment due`
              : counts.due
                ? `${counts.due} payment due`
                : "Needs approval + payment check"
          }
          delta={
            counts.pending > 0
              ? { text: "needs review", tone: "down" }
              : { text: "all clear", tone: "up" }
          }
          loading={isLoading}
          active={tab === "pending"}
          onClick={() => {
            setTab("pending");
            setRecentOnly(false);
          }}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8783]" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
            aria-label="Search vendors"
          />
        </div>
        {recentOnly && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRecentOnly(false)}
            className="w-fit"
          >
            <XCircle className="h-3.5 w-3.5" /> Showing last 30 days — clear
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList
          aria-label="Filter vendors by status"
          className="h-auto flex-wrap"
        >
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Live ({counts.approved})</TabsTrigger>
          <TabsTrigger value="premium">Premium ({counts.premium})</TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended ({counts.suspended})
          </TabsTrigger>
          <TabsTrigger value="due" className="gap-1">
            <CalendarClock className="h-3.5 w-3.5" /> Due ({counts.due})
          </TabsTrigger>
          <TabsTrigger value="expired" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Expired ({counts.expired})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="mt-3 overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <p className="text-sm font-semibold">Unable to load vendors</p>
            <p className="mt-1 text-[13px] text-[#5F5C59]">
              Something went wrong while retrieving your vendor list.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    {isFiltering ? (
                      <EmptyState
                        icon={Search}
                        title="No vendors match your search"
                        description="Try changing your search or clearing the filters."
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearch("");
                              setTab("all");
                              setRecentOnly(false);
                            }}
                          >
                            Clear filters
                          </Button>
                        }
                      />
                    ) : (
                      <EmptyState
                        icon={Store}
                        title="No vendors yet"
                        description="Vendors you approve will appear here."
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((caterer) => (
                  <TableRow key={caterer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {caterer.cover_image ? (
                          <img
                            src={caterer.cover_image}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EFECE8]">
                            <Store className="h-4 w-4 text-[#8A8783]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium">
                            <span className="truncate">{caterer.name}</span>
                            {caterer.is_premium === true ? (
                              <span
                                title="Premium vendor"
                                className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-1.5 py-px text-[10px] font-bold text-white"
                              >
                                ★ Premium
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-[#8A8783]">
                            {caterer.price_range ?? ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-[13px]">
                      {caterer.location ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-[13px] text-[#5F5C59]">
                      {caterer.contact_phone ??
                        caterer.contact_email ??
                        caterer.website ??
                        "—"}
                    </TableCell>
                    <TableCell>
                      <StatusDot
                        tone={toneOf(caterer)}
                        label={getAccountStatus(caterer)}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[#5F5C59]">
                      {new Date(caterer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            getAccountStatus(caterer) === "PENDING"
                              ? navigate(`/vendors/${caterer.id}`)
                              : openViewing(caterer.id)
                          }
                          title={
                            getAccountStatus(caterer) === "PENDING"
                              ? "Open full application review"
                              : "Quick view"
                          }
                        >
                          {getAccountStatus(caterer) === "PENDING" ? (
                            <FileText className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        {getAccountStatus(caterer) !== "APPROVED" ? (
                          <Button
                            size="sm"
                            onClick={() => setStatus(caterer, true)}
                            disabled={actingId === caterer.id}
                          >
                            {actingId === caterer.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {actingId === caterer.id ? "Approving…" : "Approve"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(caterer, false)}
                            disabled={actingId === caterer.id}
                            title="Suspend vendor"
                          >
                            {actingId === caterer.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            openViewing(caterer.id);
                            setRecordOpen(true);
                          }}
                          title="Record verified payment (ledger)"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Sheet
        open={!!viewing}
        onOpenChange={(open) => !open && setViewingId(null)}
      >
        <SheetContent className="w-full overflow-y-auto border-l border-[#E5E2DE] bg-white p-0 sm:max-w-[480px]">
          <SheetHeader className="border-b border-[#EEECE8] px-5 py-4 text-left">
            <SheetTitle className="text-[17px]">Vendor details</SheetTitle>
            <SheetDescription>{viewing?.name}</SheetDescription>
            {viewing && getAccountStatus(viewing) === "PENDING" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2.5 w-fit"
                onClick={() => {
                  setViewingId(null);
                  navigate(`/vendors/${viewing.id}`);
                }}
              >
                <FileText className="h-3.5 w-3.5" /> Open full application review
              </Button>
            )}
          </SheetHeader>
          {viewing && (
            <div className="space-y-5 px-5 py-5">
              {viewing.cover_image && (
                <img
                  src={viewing.cover_image}
                  alt=""
                  className="h-40 w-full rounded-lg object-cover"
                />
              )}
              {(viewing.images ?? []).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {viewing.images.slice(0, 6).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="h-[72px] w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
              <AdminMediaUploader viewing={viewing} />

              <section>
                <p className="text-[13px] font-semibold">Vendor information</p>
                <p className="mt-1.5 text-[13.5px] text-[#5F5C59]">
                  {viewing.description || "No description"}
                </p>
                {viewing.long_description && (
                  <p className="mt-1.5 text-[13.5px] text-[#5F5C59]">
                    {viewing.long_description}
                  </p>
                )}
                <p className="mt-2 text-xs text-[#8A8783]">
                  {viewing.location || "No location"} ·{" "}
                  {viewing.price_range ?? "No price range"}
                </p>
              </section>

              <CatererViewAnalytics caterer={viewing} />

              <section className="rounded-lg border border-[#E5E2DE] p-3.5">
                <p className="text-[13px] font-semibold">Contact</p>
                <div className="mt-2 space-y-1.5 text-[13px] text-[#5F5C59]">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-[#8A8783]" />{" "}
                    {viewing.contact_phone || "No phone"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#8A8783]" />{" "}
                    {viewing.contact_email || "No email"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-[#8A8783]" />{" "}
                    {viewing.website || "No website"}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold">Account</p>
                  <StatusDot
                    tone={toneOf(viewing)}
                    label={getAccountStatus(viewing)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold">Subscription</p>
                  <div className="flex items-center gap-2">
                    <StatusDot
                      tone={subTone(viewing)}
                      label={getSubStatus(viewing)}
                    />
                    {viewing.subscription_expires_at ? (
                      <span className="text-xs text-[#5F5C59]">
                        {new Date(
                          viewing.subscription_expires_at,
                        ).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-[#E5E2DE] p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Payments ledger
                    </p>
                    <Button size="sm" onClick={() => setRecordOpen(true)}>
                      <Plus className="h-3.5 w-3.5" /> Record
                    </Button>
                  </div>
                  <VendorPaymentHistory caterer={viewing} />
                  <div className="flex flex-wrap gap-1.5 border-t border-[#EEECE8] pt-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSubStatus(viewing, "PAYMENT_DUE")}
                      disabled={actingId === viewing.id}
                    >
                      Payment due
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSubStatus(viewing, "EXPIRED")}
                      disabled={actingId === viewing.id}
                    >
                      Expired
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="expiry" className="text-xs">
                      Expiry override (legacy, prefer ledger)
                    </Label>
                    <Input
                      id="expiry"
                      type="date"
                      defaultValue={
                        viewing.subscription_expires_at
                          ? new Date(viewing.subscription_expires_at)
                              .toISOString()
                              .slice(0, 10)
                          : ""
                      }
                      onChange={(e) => setExpiry(viewing, e.target.value)}
                      className="mt-1 h-8"
                    />
                  </div>
                  <p className="text-xs text-[#8A8783]">
                    Ledger is source of truth. Expiry auto-updates on
                    record/void. Use override only for migration fixes.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-amber-500/25 bg-amber-50 p-3">
                  <div>
                    <p className="text-[13px] font-semibold">Premium listing</p>
                    <p className="mt-0.5 text-xs text-[#5F5C59]">
                      Premium vendors appear first on the home page, A–Z.
                    </p>
                  </div>
                  <Switch
                    checked={viewing.is_premium === true}
                    disabled={actingId === viewing.id}
                    onCheckedChange={(v) => togglePremium(viewing, v)}
                    aria-label="Premium listing"
                  />
                </div>

                <div className="rounded-lg border border-[#E5E2DE] p-3 space-y-2.5">
                  <p className="text-[13px] font-semibold">Map location <span className="font-normal text-[#8A8783]">(for “Near you”)</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="lat" className="text-xs">Latitude</Label>
                      <Input
                        id="lat"
                        inputMode="decimal"
                        placeholder="e.g. 9.005"
                        value={latDraft}
                        onChange={(e) => setLatDraft(e.target.value)}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lng" className="text-xs">Longitude</Label>
                      <Input
                        id="lng"
                        inputMode="decimal"
                        placeholder="e.g. 38.763"
                        value={lngDraft}
                        onChange={(e) => setLngDraft(e.target.value)}
                        className="mt-1 h-8"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveCoords}
                      disabled={actingId === viewing.id}
                    >
                      {actingId === viewing.id ? "Saving…" : "Save location"}
                    </Button>
                    {(viewing.latitude != null || viewing.longitude != null) && (
                      <span className="text-[11px] text-[#5F5C59]">
                        {viewing.latitude ?? "—"}, {viewing.longitude ?? "—"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8A8783]">
                    Empty = unknown (sorts last). Tip: right-click the spot in Google Maps → copy the numbers.
                  </p>
                </div>

                {(viewing.service_areas?.length ?? 0) > 0 ? (
                  <div className="text-xs text-[#5F5C59]">
                    <span className="font-medium">Service areas:</span>{" "}
                    {(viewing.service_areas ?? []).join(", ")}
                  </div>
                ) : null}

                <Label htmlFor="admin-notes" className="text-[13px]">
                  Admin notes{" "}
                  <span className="font-normal text-[#8A8783]">
                    (manual payment record, private)
                  </span>
                </Label>
                <Textarea
                  id="admin-notes"
                  placeholder="e.g. Paid Jan 2026 via bank transfer, receipt #123 — verified"
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="min-h-[88px] border-[#E5E2DE] focus-visible:border-[#74263A]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveNotes}
                  disabled={actingId === viewing.id}
                >
                  {actingId === viewing.id ? "Saving…" : "Save notes"}
                </Button>
              </section>
            </div>
          )}
          {viewing && (
            <SheetFooter className="flex-row justify-end gap-2 border-t border-[#EEECE8] px-5 py-4">
              <Button variant="outline" onClick={() => setViewingId(null)}>
                Cancel
              </Button>
              {getAccountStatus(viewing) === "APPROVED" ? (
                <Button
                  variant="destructive"
                  onClick={() =>
                    setStatus(viewing, false, notesDraft || viewing.admin_notes)
                  }
                  disabled={actingId === viewing.id}
                >
                  {actingId === viewing.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {actingId === viewing.id ? "Working…" : "Suspend"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setStatus(viewing, true, notesDraft || viewing.admin_notes)
                  }
                  disabled={actingId === viewing.id}
                >
                  {actingId === viewing.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {actingId === viewing.id ? "Approving…" : "Approve"}
                </Button>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <RecordPaymentDialog
        caterer={viewing}
        open={recordOpen && !!viewing}
        onOpenChange={setRecordOpen}
      />
    </AdminLayout>
  );
}

function CatererViewAnalytics({ caterer }: { caterer: Caterer }) {
  const { buckets, period, isLoading, error } = useCatererViewTrend(
    caterer.id,
    14,
  );
  const total = caterer.view_count ?? 0;
  const unique = caterer.unique_view_count ?? 0;
  const hasTrend = buckets.some((b) => b.views > 0);

  return (
    <section className="rounded-lg border border-[#E5E2DE] p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Profile views
        </p>
        <span className="text-[11px] text-[#8A8783]">last 14 days</span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-[#FAF9F7] p-2.5">
          <p className="text-[11px] font-medium text-[#8A8783]">
            Unique visitors
          </p>
          <p className="text-xl font-semibold tabular-nums">
            {unique.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#8A8783]">
            distinct users / devices
          </p>
        </div>
        <div className="rounded-md bg-[#FAF9F7] p-2.5">
          <p className="text-[11px] font-medium text-[#8A8783]">Total views</p>
          <p className="text-xl font-semibold tabular-nums">
            {total.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#8A8783]">
            {period.views.toLocaleString()} in last 14 days
          </p>
        </div>
      </div>
      <div className="mt-3 h-[160px]">
        {isLoading ? (
          <p className="text-xs text-[#8A8783]">Loading trend…</p>
        ) : error ? (
          <p className="text-xs text-[#8A8783]">
            Trend unavailable — run mobile/supabase-caterer-profile-views.sql
            and sign in as admin.
          </p>
        ) : !hasTrend ? (
          <p className="text-xs text-[#8A8783]">
            No views in the last 14 days yet. Views are tracked from the
            mobile caterer detail page.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={buckets}
              barGap={2}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EEECE8"
                vertical={false}
              />
              <ReXAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#8A8783" }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#8A8783" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <ReTooltip
                cursor={{ fill: "#F4F3F1" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E2DE",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="views"
                name="Views"
                fill="#74263A"
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {!isLoading && !error && hasTrend && (
        <p className="mt-1.5 text-[11px] text-[#8A8783]">
          {period.signedIn.toLocaleString()} signed-in ·{" "}
          {period.guests.toLocaleString()} guest in period
        </p>
      )}
    </section>
  );
}

function VendorPaymentHistory({ caterer }: { caterer: Caterer }) {
  const { data, isLoading } = usePaymentsByCaterer(caterer.id);
  if (isLoading)
    return <p className="text-xs text-[#8A8783]">Loading payments…</p>;
  const list = (data ?? []).slice(0, 5);
  if (list.length === 0) {
    return (
      <div className="rounded-md bg-[#FAF9F7] p-2.5 text-xs text-[#8A8783] flex items-center gap-1.5">
        <ReceiptText className="h-3.5 w-3.5" /> No ledger payments yet — record
        the first verified payment above.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[#EEECE8] rounded-md border border-[#EEECE8]">
      {list.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-[#181716]">
              {Number(p.amount).toLocaleString()} {p.currency} ·{" "}
              {String(p.payment_method)}
            </span>
            <span className="block truncate text-[#8A8783]">
              {p.period_start} → {p.period_end} · {p.status}
            </span>
          </span>
          {p.receipt_url ? (
            <a
              href={p.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-[#74263A] underline"
            >
              receipt
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function AdminMediaUploader({ viewing }: { viewing: Caterer }) {
  const updateCaterer = useUpdateCaterer();
  const { toast } = useToast();
  const [uploading, setUploading] = useState<"cover" | "gallery" | null>(null);

  if (!isCloudinaryConfigured()) {
    return (
      <div className="rounded-lg border border-dashed border-[#E5E2DE] bg-[#FAF9F7] p-3">
        <p className="text-xs font-medium text-[#5F5C59] flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" /> Media via Cloudinary not
          configured
        </p>
        <p className="text-xs text-[#8A8783] mt-1">
          Set{" "}
          <code className="px-1 py-0.5 bg-white rounded border">
            VITE_CLOUDINARY_CLOUD_NAME
          </code>{" "}
          and{" "}
          <code className="px-1 py-0.5 bg-white rounded border">
            VITE_CLOUDINARY_UPLOAD_PRESET
          </code>{" "}
          in{" "}
          <code className="px-1 py-0.5 bg-white rounded border">
            admin/.env
          </code>{" "}
          (same values as <code>New/frontend/.env</code>). Create an unsigned
          preset in Cloudinary console first.
        </p>
      </div>
    );
  }

  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    try {
      const url = await uploadToCloudinary(file, "catering_app/covers");
      await updateCaterer.mutateAsync({
        id: viewing.id,
        updates: { cover_image: url } as Partial<Caterer>,
      });
      toast({
        title: "Cover updated",
        description: "Cover image saved to Cloudinary.",
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const onGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 6) : [];
    if (files.length === 0) return;
    setUploading("gallery");
    try {
      const urls: string[] = [];
      for (const f of files)
        urls.push(await uploadToCloudinary(f, "catering_app/gallery"));
      const next = [...(viewing.images ?? []), ...urls].slice(0, 12);
      await updateCaterer.mutateAsync({
        id: viewing.id,
        updates: { images: next } as Partial<Caterer>,
      });
      toast({
        title: "Gallery updated",
        description: `${urls.length} image(s) added.`,
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-[#E5E2DE] p-3 space-y-3">
      <p className="text-[13px] font-semibold flex items-center gap-1.5">
        <Upload className="h-3.5 w-3.5" /> Media (Cloudinary)
      </p>
      <div className="flex flex-wrap gap-2">
        <label
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : "hover:bg-muted"}`}
        >
          {uploading === "cover" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
          {uploading === "cover" ? "Uploading…" : "Replace cover"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onCover}
            disabled={!!uploading}
          />
        </label>
        <label
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : "hover:bg-muted"}`}
        >
          {uploading === "gallery" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading === "gallery" ? "Uploading…" : "Add to gallery"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onGallery}
            disabled={!!uploading}
          />
        </label>
      </div>
      <p className="text-xs text-[#8A8783]">
        Uploads go directly to Cloudinary (unsigned preset), URL saved in
        Supabase. Same preset as New/frontend.
      </p>
    </div>
  );
}
