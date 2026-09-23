import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  UserPlus,
  CalendarClock,
  History,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  UserMinus,
  Info,
  Crown,
} from "lucide-react";
import { useAllProfiles, ProfileWithRole } from "@/hooks/useProfiles";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateAdmin,
  useRemoveAdminRole,
  useSendPasswordReset,
  postgrestMessage,
} from "@/hooks/useAdmins";
import { cn } from "@/lib/utils";

function passwordScore(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s += 1;
  else if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += s >= 2 ? 1 : 0;
  const clamped = Math.min(4, s);
  return {
    score: clamped,
    label:
      pw.length === 0
        ? "Enter a password"
        : clamped <= 1
          ? "Weak"
          : clamped === 2
            ? "Fair"
            : clamped === 3
              ? "Good"
              : "Strong",
  };
}

export default function Admins() {
  const { data: profiles, isLoading, error, refetch } = useAllProfiles();
  const { user } = useAuth();
  const { toast } = useToast();
  const createAdmin = useCreateAdmin();
  const sendReset = useSendPasswordReset();
  const removeRole = useRemoveAdminRole();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProfileWithRole | null>(
    null,
  );
  const [resettingEmail, setResettingEmail] = useState<string | null>(null);

  // Add-form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const admins = useMemo(
    () =>
      (profiles ?? []).filter((p) =>
        (p.roles ?? []).some((r) => r.role === "admin"),
      ),
    [profiles],
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const d30 = now - 30 * 86400000;
    const d7 = now - 7 * 86400000;
    const new30 = admins.filter(
      (a) => a.created_at && new Date(a.created_at).getTime() >= d30,
    ).length;
    const new7 = admins.filter(
      (a) => a.created_at && new Date(a.created_at).getTime() >= d7,
    ).length;
    const earliest = admins.reduce<Date | null>((acc, a) => {
      if (!a.created_at) return acc;
      const d = new Date(a.created_at);
      return !acc || d < acc ? d : acc;
    }, null);
    const tenureDays = earliest
      ? Math.max(0, Math.floor((now - earliest.getTime()) / 86400000))
      : 0;
    return { total: admins.length, new30, new7, earliest, tenureDays };
  }, [admins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...admins].sort((a, b) => {
      // current user first, then newest
      if (user?.id) {
        if (a.user_id === user.id) return -1;
        if (b.user_id === user.id) return 1;
      }
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
    if (!q) return sorted;
    return sorted.filter((p) =>
      `${p.name} ${p.email ?? ""} ${p.phone ?? ""}`.toLowerCase().includes(q),
    );
  }, [admins, search, user?.id]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setShowPw(false);
    setShowConfirm(false);
    setFormError(null);
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!name.trim()) return setFormError("Please enter a full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setFormError("Please enter a valid email address.");
    if (password.length < 8)
      return setFormError("Password must be at least 8 characters.");
    if (password !== confirm) return setFormError("Passwords do not match.");
    try {
      const res = await createAdmin.mutateAsync({ name, email, password });
      toast({
        title:
          res.mode === "promoted"
            ? "Existing account promoted"
            : "Admin created",
        description:
          res.mode === "promoted"
            ? `${email.trim()} already had an account and now has admin access.`
            : `${name.trim()} can now sign in at /login with ${email.trim().toLowerCase()}. If email confirmation is on, they must confirm first.`,
      });
      setAddOpen(false);
      resetForm();
    } catch (e) {
      const msg = postgrestMessage(e);
      setFormError(msg);
    }
  };

  const handleReset = async (targetEmail: string) => {
    setResettingEmail(targetEmail);
    try {
      await sendReset.mutateAsync(targetEmail);
      toast({
        title: "Reset link sent",
        description: `A secure password-reset link was emailed to ${targetEmail}. It opens the login page to set a new password.`,
      });
    } catch (e) {
      toast({
        title: "Could not send reset link",
        description: postgrestMessage(e),
        variant: "destructive",
      });
    } finally {
      setResettingEmail(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    if (removeTarget.user_id === user?.id) {
      toast({
        title: "Action blocked",
        description: "You cannot remove your own admin access.",
        variant: "destructive",
      });
      return;
    }
    if (admins.length <= 1) {
      toast({
        title: "Action blocked",
        description: "You cannot remove the last remaining admin.",
        variant: "destructive",
      });
      return;
    }
    try {
      await removeRole.mutateAsync(removeTarget.user_id);
      toast({
        title: "Admin access removed",
        description: `${removeTarget.name} is no longer an admin.`,
      });
      setRemoveTarget(null);
    } catch (e) {
      toast({
        title: "Could not remove admin",
        description: postgrestMessage(e),
        variant: "destructive",
      });
    }
  };

  const pw = passwordScore(password);
  const canSubmit =
    name.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    password.length >= 8 &&
    password === confirm &&
    !createAdmin.isPending;

  return (
    <AdminLayout>
      <PageHeader
        title="Admins"
        description="Trusted team members with full console access. Create admins with a password, or reset access via secure email link."
        action={
          <Button
            onClick={() => {
              resetForm();
              setAddOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" /> Add admin
          </Button>
        }
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#E5E2DE] bg-white p-3.5 text-[13px] text-[#5F5C59]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          <span className="font-semibold text-foreground">
            How passwords work:
          </span>{" "}
          set the initial password when you create an admin. To change it later,
          send a secure reset link — Supabase emails the admin a one-time link
          to choose a new password. For an immediate manual override, use{" "}
          <code className="rounded border border-[#E5E2DE] bg-[#FAF9F7] px-1 py-0.5 font-mono text-xs">
            scripts/reset-admin-password.mjs
          </code>{" "}
          with the service-role key (never in the browser).
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          tint="bg-primary-subtle text-primary"
          label="Total Admins"
          value={stats.total}
          hint={
            stats.total === 1
              ? "Single admin — add a backup"
              : stats.total > 1
                ? "Team coverage looks healthy"
                : "No admins found"
          }
          delta={
            stats.total > 1
              ? { text: "protected", tone: "up" }
              : stats.total === 1
                ? { text: "add backup", tone: "down" }
                : undefined
          }
          loading={isLoading}
        />
        <StatCard
          icon={UserPlus}
          tint="bg-[#EEF3F8] text-[#4D6B8A]"
          label="Added · Last 30 Days"
          value={stats.new30}
          hint={stats.new30 ? "Recent team growth" : "No new admins in 30 days"}
          loading={isLoading}
        />
        <StatCard
          icon={CalendarClock}
          tint="bg-[#E9F6F0] text-[#16845B]"
          label="Added · Last 7 Days"
          value={stats.new7}
          hint={stats.new7 ? "Joined this week" : "No joins this week"}
          loading={isLoading}
        />
        <StatCard
          icon={History}
          tint="bg-[#FFF5DF] text-[#B7791F]"
          label="Console Since"
          value={stats.earliest ? stats.earliest.toLocaleDateString() : "—"}
          hint={
            stats.earliest
              ? `${stats.tenureDays} day${stats.tenureDays === 1 ? "" : "s"} of admin coverage`
              : "—"
          }
          loading={isLoading}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8783]" />
          <Input
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
            aria-label="Search admins"
          />
        </div>
        <p className="text-xs text-[#8A8783]">
          {filtered.length} of {admins.length} admin
          {admins.length === 1 ? "" : "s"}
        </p>
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <p className="text-sm font-semibold">Unable to load admins</p>
            <p className="mt-1 text-[13px] text-[#5F5C59]">
              Something went wrong while retrieving the admin list.
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
                <TableHead>Admin</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={ShieldCheck}
                      title={
                        search ? "No admins match your search" : "No admins yet"
                      }
                      description={
                        search
                          ? "Try changing your search."
                          : "Add your first admin to share console access."
                      }
                      action={
                        search ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearch("")}
                          >
                            Clear search
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              resetForm();
                              setAddOpen(true);
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Add admin
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((admin) => {
                  const isSelf = admin.user_id === user?.id;
                  const isLast = admins.length <= 1;
                  const disableRemove = isSelf || isLast;
                  const initials = (admin.name || "?")
                    .slice(0, 2)
                    .toUpperCase();
                  const otherRoles = (admin.roles ?? [])
                    .map((r) => r.role)
                    .filter((r) => r !== "admin");
                  return (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium">
                              <span className="truncate">{admin.name}</span>
                              {isSelf && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary">
                                  <Crown className="h-3 w-3" /> You
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-[#8A8783]">
                              {admin.email ?? "No email"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {admin.phone ?? (
                          <span className="text-[#8A8783]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[13px] text-[#5F5C59]">
                        {admin.created_at
                          ? new Date(admin.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="border-transparent bg-[#FFF5DF] text-[#B7791F]"
                          >
                            <ShieldCheck className="h-3 w-3" /> admin
                          </Badge>
                          {otherRoles.map((r) => (
                            <Badge
                              key={r}
                              variant="outline"
                              className="text-[#8A8783]"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title={`Send password-reset link to ${admin.email}`}
                            disabled={
                              !admin.email || resettingEmail === admin.email
                            }
                            onClick={() =>
                              admin.email && handleReset(admin.email)
                            }
                          >
                            {resettingEmail === admin.email ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="h-3.5 w-3.5" />
                            )}
                            <span className="sr-only">Send reset link</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title={
                              isSelf
                                ? "You cannot remove your own admin access"
                                : isLast
                                  ? "Cannot remove the last admin"
                                  : `Remove ${admin.name} as admin`
                            }
                            disabled={disableRemove || removeRole.isPending}
                            className={cn(
                              !disableRemove &&
                                "text-[#C24141] hover:bg-[#FCECEC] hover:text-[#A83535]",
                            )}
                            onClick={() => setRemoveTarget(admin)}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove admin</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add admin dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setFormError(null);
        }}
      >
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <UserPlus className="h-4 w-4" />
              </span>
              Add admin
            </DialogTitle>
            <DialogDescription>
              Creates a login the new admin can use immediately. They sign in at{" "}
              <span className="font-medium">/login</span> with this email and
              password.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-1">
            <div>
              <Label htmlFor="admin-name">Full name</Label>
              <Input
                id="admin-name"
                placeholder="e.g. Hana Tesfaye"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@Caternet.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                autoComplete="email"
              />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="admin-password"
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#8A8783] hover:text-foreground"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="admin-confirm">Confirm password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="admin-confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#8A8783] hover:text-foreground"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {password.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8A8783]">Password strength</span>
                  <span className="font-semibold text-foreground">
                    {pw.label}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full",
                        i < pw.score
                          ? pw.score <= 1
                            ? "bg-[#C24141]"
                            : pw.score === 2
                              ? "bg-[#B7791F]"
                              : pw.score === 3
                                ? "bg-[#4D6B8A]"
                                : "bg-[#16845B]"
                          : "bg-[#EFECE8]",
                      )}
                    />
                  ))}
                </div>
                {confirm.length > 0 && password !== confirm && (
                  <p className="mt-1.5 text-xs text-[#C24141]">
                    Passwords do not match.
                  </p>
                )}
              </div>
            )}

            {formError && (
              <div className="rounded-lg border border-[#F3C2C2] bg-[#FCECEC] p-3 text-[13px] text-[#8A2B2B]">
                {formError}
              </div>
            )}
            <p className="text-xs leading-relaxed text-[#8A8783]">
              If the email already belongs to a customer or vendor, we will
              promote that account to admin instead of creating a duplicate.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={createAdmin.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!canSubmit}>
              {createAdmin.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {createAdmin.isPending ? "Creating…" : "Create admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCECEC] text-[#C24141]">
                <UserMinus className="h-4 w-4" />
              </span>
              Remove admin access?
            </DialogTitle>
            <DialogDescription>
              {removeTarget
                ? `${removeTarget.name} (${removeTarget.email ?? "no email"}) will lose console access immediately. Their login remains, but they can no longer open admin pages.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={removeRole.isPending}
            >
              Keep admin
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeRole.isPending}
            >
              {removeRole.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Remove access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
