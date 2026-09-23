import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, EmptyState, ErrorState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LicenceViewer } from "@/components/LicenceViewer";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Store,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  Tag,
  CalendarDays,
  Clock,
  FileWarning,
  User,
  Loader2,
  Instagram,
  Send,
  Music2,
} from "lucide-react";
import {
  useCatererById,
  useUpdateCaterer,
  type Caterer,
} from "@/hooks/useCaterers";
import { useProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

function errMsg(e: unknown): string {
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
  }
  return "Could not update vendor.";
}

function statusOf(c: Caterer): "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED" {
  if (c.account_status)
    return c.account_status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  if (c.is_pending) return "PENDING";
  if (c.is_approved) return "APPROVED";
  return "SUSPENDED";
}

function toneOf(
  s: string,
): "pending" | "live" | "suspended" {
  if (s === "PENDING") return "pending";
  if (s === "APPROVED") return "live";
  return "suspended";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8783]">
        {label}
      </p>
      <div className="mt-1 text-[14px] text-[#181716]">{value}</div>
    </div>
  );
}

function ChipRow({ items, empty }: { items: (string | null)[]; empty: string }) {
  const list = (items ?? []).filter(Boolean) as string[];
  if (list.length === 0)
    return <p className="text-[13px] text-[#8A8783]">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((c) => (
        <span
          key={c}
          className="rounded-full bg-[#F4F3F1] px-2.5 py-1 text-xs font-medium text-[#5F5C59] ring-1 ring-inset ring-black/[0.06]"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

export default function VendorReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const updateCaterer = useUpdateCaterer();
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const {
    data: caterer,
    isLoading,
    error,
    refetch,
  } = useCatererById(id);
  const { data: applicant } = useProfile(caterer?.vendor_id);

  const decide = async (approved: boolean) => {
    if (!caterer) return;
    setActing(true);
    try {
      const notes = notesDraft ?? caterer.admin_notes ?? null;
      const full = {
        is_approved: approved,
        is_pending: false,
        account_status: (approved ? "APPROVED" : "SUSPENDED") as Caterer["account_status"],
        admin_notes: notes,
        approved_at: approved ? new Date().toISOString() : null,
        approved_by: approved ? (user?.id ?? null) : null,
      } as Partial<Caterer>;
      try {
        await updateCaterer.mutateAsync({ id: caterer.id, updates: full });
      } catch (firstErr) {
        const msg = errMsg(firstErr);
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
        title: approved ? "Vendor approved" : "Vendor rejected",
        description: `${caterer.name} ${approved ? "is now live in the mobile app." : "has been sent back."}`,
      });
      navigate("/vendors");
    } catch (e) {
      toast({ title: "Action failed", description: errMsg(e), variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const saveNotes = async () => {
    if (!caterer) return;
    setActing(true);
    try {
      await updateCaterer.mutateAsync({
        id: caterer.id,
        updates: { admin_notes: notesDraft || null },
      });
      toast({ title: "Notes saved" });
      refetch();
    } catch (e) {
      toast({ title: "Action failed", description: errMsg(e), variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  return (
    <AdminLayout>
      <Link
        to="/vendors"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5F5C59] hover:text-[#181716]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </Link>

      {isLoading ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ) : error || !caterer ? (
        <Card>
          <ErrorState
            title="Unable to load application"
            description="This vendor may have been deleted."
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
        <>
          <PageHeader
            title={caterer.name}
            description={`Application received ${new Date(caterer.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`}
            action={
              <div className="flex gap-2">
                <StatusDot tone={toneOf(statusOf(caterer))} label={statusOf(caterer)} />
              </div>
            }
          />

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              {/* What the vendor filled in at registration */}
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                    <Store className="h-4 w-4 text-primary" /> Business details
                  </h2>
                  <p className="mt-0.5 text-[13px] text-[#8A8783]">
                    Exactly as submitted in the registration form.
                  </p>
                  {caterer.cover_image && (
                    <img
                      src={caterer.cover_image}
                      alt=""
                      className="mt-4 h-48 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Business name" value={caterer.name} />
                    <Field
                      label="Location"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#8A8783]" />
                          {caterer.location || "—"}
                        </span>
                      }
                    />
                    <div className="sm:col-span-2">
                      <Field
                        label="Short description"
                        value={caterer.description || <span className="text-[#8A8783]">—</span>}
                      />
                    </div>
                    {caterer.long_description && (
                      <div className="sm:col-span-2">
                        <Field label="Long description" value={caterer.long_description} />
                      </div>
                    )}
                    <Field
                      label="Guest capacity"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-[#8A8783]" />
                          {caterer.min_guests ?? 1} – {caterer.max_guests ?? 100} guests
                        </span>
                      }
                    />
                    <Field
                      label="Price range"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-[#8A8783]" />
                          {caterer.price_range ?? "—"}
                        </span>
                      }
                    />
                    <Field
                      label="Experience"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-[#8A8783]" />
                          {(caterer.years_in_business ?? 0) > 0
                            ? `${caterer.years_in_business} years`
                            : "New business"}
                        </span>
                      }
                    />
                    <Field
                      label="Applied on"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#8A8783]" />
                          {new Date(caterer.created_at).toLocaleString()}
                        </span>
                      }
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8783]">
                        Cuisines
                      </p>
                      <ChipRow items={caterer.cuisines ?? []} empty="None listed" />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8783]">
                        Event types
                      </p>
                      <ChipRow items={caterer.event_types ?? []} empty="None listed" />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8783]">
                        Specialties
                      </p>
                      <ChipRow items={caterer.specialties ?? []} empty="None listed" />
                    </div>
                  </div>
                  {(caterer.images ?? []).length > 0 && (
                    <div className="mt-4">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8783]">
                        Gallery ({(caterer.images ?? []).length})
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {(caterer.images ?? []).slice(0, 8).map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noreferrer">
                            <img
                              src={img}
                              alt=""
                              className="h-20 w-full rounded-md object-cover transition-opacity hover:opacity-85"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Licence */}
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-[15px] font-semibold">Business licence</h2>
                  <p className="mt-0.5 text-[13px] text-[#8A8783]">
                    PDF submitted with the application — verify it before approving.
                  </p>
                  <div className="mt-4">
                    <LicenceViewer path={caterer.licence_path} />
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-[15px] font-semibold">Contact</h2>
                  <div className="mt-3 grid gap-3 text-[14px] sm:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-[#8A8783]" />
                      {caterer.contact_phone ? (
                        <a href={`tel:${caterer.contact_phone}`} className="text-primary hover:underline">
                          {caterer.contact_phone}
                        </a>
                      ) : (
                        <span className="text-[#8A8783]">No phone</span>
                      )}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-[#8A8783]" />
                      {caterer.contact_email ? (
                        <a href={`mailto:${caterer.contact_email}`} className="text-primary hover:underline">
                          {caterer.contact_email}
                        </a>
                      ) : (
                        <span className="text-[#8A8783]">No email</span>
                      )}
                    </p>
                    <p className="flex items-center gap-2">
                      <Globe className="h-4 w-4 shrink-0 text-[#8A8783]" />
                      {caterer.website ? (
                        <a href={caterer.website} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
                          {caterer.website}
                        </a>
                      ) : (
                        <span className="text-[#8A8783]">No website</span>
                      )}
                    </p>
                    <SocialLinks caterer={caterer} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Decision sidebar */}
            <div className="space-y-4">
              <Card className="xl:sticky xl:top-20">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                      <User className="h-4 w-4 text-primary" /> Applicant
                    </h2>
                    <div className="mt-2 text-[13.5px]">
                      <p className="font-medium">{applicant?.name ?? "—"}</p>
                      <p className="text-[#5F5C59]">{applicant?.email ?? caterer.contact_email ?? "—"}</p>
                      {applicant?.phone && <p className="text-[#5F5C59]">{applicant.phone}</p>}
                    </div>
                  </div>

                  <div className="border-t border-[#EEECE8] pt-4">
                    <h2 className="text-[15px] font-semibold">Decision</h2>
                    {statusOf(caterer) !== "PENDING" ? (
                      <p className="mt-1.5 rounded-lg bg-[#FAF9F7] p-3 text-[13px] text-[#5F5C59]">
                        Already {statusOf(caterer).toLowerCase()}. You can still
                        suspend or re-approve below.
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[13px] text-[#5F5C59]">
                        Check the business details and licence, then decide.
                      </p>
                    )}
                    <div className="mt-3">
                      <Label htmlFor="review-notes" className="text-[13px]">
                        Review notes <span className="font-normal text-[#8A8783]">(private)</span>
                      </Label>
                      <Textarea
                        id="review-notes"
                        placeholder="e.g. Licence verified, called the owner…"
                        value={notesDraft ?? caterer.admin_notes ?? ""}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        className="mt-1.5 min-h-[88px] border-[#E5E2DE] focus-visible:border-[#74263A]"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={saveNotes}
                        disabled={acting}
                      >
                        Save notes
                      </Button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button onClick={() => void decide(true)} disabled={acting}>
                        {acting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => void decide(false)}
                        disabled={acting}
                      >
                        {acting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                    {!caterer.licence_path && statusOf(caterer) === "PENDING" && (
                      <p className="mt-2.5 flex items-start gap-1.5 text-xs text-[#B7791F]">
                        <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        No licence attached — consider waiting before approving.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function SocialLinks({ caterer }: { caterer: Caterer }) {
  const socials = (caterer as unknown as Record<string, string | null>);
  const items = [
    { icon: Instagram, label: "Instagram", href: socials["instagram_url"] },
    { icon: Send, label: "Telegram", href: socials["telegram_url"] },
    { icon: Music2, label: "TikTok", href: socials["tiktok_url"] },
  ].filter((s) => !!s.href);
  if (items.length === 0)
    return (
      <p className="flex items-center gap-2 text-[#8A8783]">
        <Globe className="h-4 w-4 shrink-0" /> No socials
      </p>
    );
  return (
    <>
      {items.map((s) => (
        <p key={s.label} className="flex items-center gap-2">
          <s.icon className="h-4 w-4 shrink-0 text-[#8A8783]" />
          <a href={s.href!} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
            {s.label}
          </a>
        </p>
      ))}
    </>
  );
}

export function VendorReviewEmpty() {
  return (
    <AdminLayout>
      <EmptyState
        icon={Store}
        title="Vendor not found"
        description="This application may have been deleted."
      />
    </AdminLayout>
  );
}
