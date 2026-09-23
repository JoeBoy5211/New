import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { PaymentsRevenueChart } from '@/components/PaymentsRevenueChart';
import { PageHeader, EmptyState, ErrorState } from '@/components/PageHeader';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Search, Plus, ReceiptText, Download, Ban, Undo2, ExternalLink, Wallet, CalendarClock, AlertTriangle, Eye, Store } from 'lucide-react';
import { useAllCaterers, type Caterer } from '@/hooks/useCaterers';
import {
  PAYMENT_METHODS,
  postgrestMessage,
  useAllPayments,
  useDeletePlan,
  useCreatePlan,
  usePlans,
  useUpdatePlan,
  useVoidPayment,
  type SubscriptionPlan,
  type VendorPayment,
} from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';

function fmtMoney(n: number, currency: string) {
  return `${Number(n).toLocaleString()} ${currency}`;
}

export default function Payments() {
  const { toast } = useToast();
  const { data: payments, isLoading, error, refetch } = useAllPayments();
  const { data: caterers } = useAllCaterers();
  const { data: plans } = usePlans();
  const voidPayment = useVoidPayment();

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [recordFor, setRecordFor] = useState<Caterer | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<VendorPayment | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const catererById = useMemo(() => Object.fromEntries((caterers ?? []).map((c) => [c.id, c])), [caterers]);
  const viewing = useMemo(() => (payments ?? []).find((p) => p.id === viewingId) ?? null, [payments, viewingId]);

  const stats = useMemo(() => {
    const list = (payments ?? []).filter((p) => p.status === 'VERIFIED');
    const monthKey = new Date().toISOString().slice(0, 7);
    const collected = list.filter((p) => (p.paid_at ?? '').slice(0, 7) === monthKey).reduce((s, p) => s + Number(p.amount || 0), 0);
    const total = list.reduce((s, p) => s + Number(p.amount || 0), 0);
    return { collected, total, count: list.length, voided: (payments ?? []).filter((p) => p.status !== 'VERIFIED').length };
  }, [payments]);

  const filtered = useMemo(() => {
    let list = payments ?? [];
    if (tab === 'verified') list = list.filter((p) => p.status === 'VERIFIED');
    if (tab === 'voided') list = list.filter((p) => p.status !== 'VERIFIED');
    if (methodFilter !== 'all') list = list.filter((p) => p.payment_method === methodFilter);
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter((p) =>
        `${p.caterer?.name ?? catererById[p.caterer_id]?.name ?? ''} ${p.reference_no ?? ''} ${p.notes ?? ''} ${p.amount}`.toLowerCase().includes(qq)
      );
    }
    return list;
  }, [payments, tab, q, methodFilter, catererById]);

  const exportCsv = () => {
    const rows = [['paid_at', 'vendor', 'amount', 'currency', 'method', 'period_start', 'period_end', 'reference', 'status', 'notes']];
    for (const p of filtered) {
      rows.push([
        p.paid_at, p.caterer?.name ?? catererById[p.caterer_id]?.name ?? p.caterer_id,
        String(p.amount), p.currency, String(p.payment_method), p.period_start, p.period_end,
        p.reference_no ?? '', p.status, (p.notes ?? '').replace(/\n/g, ' '),
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vendor-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const isMissingTable = error instanceof Error && (error as Error & { code?: string }).code === 'PAYMENTS_TABLE_MISSING';

  return (
    <AdminLayout>
      <PageHeader
        title="Payments"
        description="Verify offline payments and register coverage. Ledger is auditable — void instead of delete."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <VendorPicker caterers={caterers ?? []} onPick={(c) => { setRecordFor(c); setRecordOpen(true); }} />
          </div>
        }
      />

      {isMissingTable ? (
        <Card>
          <ErrorState
            title="Payments ledger not installed"
            description="Run vendors/supabase/migrations/20260917000000_vendor_payments.sql with `supabase db push`, then reload."
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-[13px] font-medium text-foreground-secondary flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Collected this month</p><p className="kpi-number mt-2">{isLoading ? '—' : stats.collected.toLocaleString()}</p><p className="text-xs text-foreground-muted">{stats.count} verified payments total</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-[13px] font-medium text-foreground-secondary flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Lifetime verified</p><p className="kpi-number mt-2">{isLoading ? '—' : stats.total.toLocaleString()}</p><p className="text-xs text-foreground-muted">across all vendors</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-[13px] font-medium text-foreground-secondary flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Voided / refunded</p><p className="kpi-number mt-2">{isLoading ? '—' : stats.voided}</p><p className="text-xs text-foreground-muted">kept for audit, excluded from coverage</p></CardContent></Card>
          </div>

          <PaymentsRevenueChart payments={payments} isLoading={isLoading} />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8783]" />
              <Input placeholder="Search vendor, reference, notes..." value={q} onChange={(e) => setQ(e.target.value)} className="h-10 pl-9" />
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="mt-3">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="all">All ({payments?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="voided">Voided / refunded</TabsTrigger>
              <TabsTrigger value="plans">Plans ({plans?.length ?? 0})</TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === 'plans' ? (
            <PlansManager />
          ) : (
            <Card className="mt-3 overflow-hidden">
              {error ? (
                <ErrorState title="Unable to load payments" onRetry={() => refetch()} />
              ) : isLoading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <EmptyState icon={ReceiptText} title="No payments found" description="Record the first verified payment to start coverage tracking." />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Paid on</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewingId(p.id)}>
                        <TableCell>
                          <p className="text-[13.5px] font-medium">{p.caterer?.name ?? catererById[p.caterer_id]?.name ?? '—'}</p>
                          <p className="text-xs text-[#8A8783]">{p.reference_no ?? p.plan?.name ?? ''}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[13px]">{new Date(p.period_start).toLocaleDateString()} → {new Date(p.period_end).toLocaleDateString()}</TableCell>
                        <TableCell className="whitespace-nowrap text-[13px] font-medium">{fmtMoney(p.amount, p.currency)}</TableCell>
                        <TableCell><Badge variant="outline">{String(p.payment_method)}</Badge></TableCell>
                        <TableCell className="text-[13px]">{new Date(p.paid_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'VERIFIED' ? 'default' : 'secondary'}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setViewingId(p.id)} title="View details">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {p.receipt_url && (
                              <Button size="sm" variant="ghost" asChild><a href={p.receipt_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><ExternalLink className="h-3.5 w-3.5" /></a></Button>
                            )}
                            {p.status === 'VERIFIED' ? (
                              <Button size="sm" variant="outline" onClick={() => setVoidTarget(p)}><Ban className="h-3.5 w-3.5" /> Void</Button>
                            ) : (
                              <Button size="sm" variant="ghost" disabled><Undo2 className="h-3.5 w-3.5" /> {p.status}</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}
        </>
      )}

      <RecordPaymentDialog caterer={recordFor} open={recordOpen} onOpenChange={setRecordOpen} onRecorded={() => refetch()} />

      <Sheet open={!!viewing} onOpenChange={(open) => !open && setViewingId(null)}>
        <SheetContent className="w-full overflow-y-auto border-l border-[#E5E2DE] bg-white p-0 sm:max-w-[480px]">
          <SheetHeader className="border-b border-[#EEECE8] px-5 py-4 text-left">
            <SheetTitle className="text-[17px]">Payment details</SheetTitle>
            <SheetDescription>
              {viewing ? `${viewing.reference_no ?? viewing.plan?.name ?? 'Ledger entry'} · ${new Date(viewing.paid_at).toLocaleDateString()}` : ''}
            </SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="space-y-5 px-5 py-5">
              <section className="rounded-lg border border-[#E5E2DE] bg-[#FAF9F7] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#8A8783]">Amount</p>
                <p className="kpi-number mt-1">{fmtMoney(viewing.amount, viewing.currency)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={viewing.status === 'VERIFIED' ? 'default' : 'secondary'}>{viewing.status}</Badge>
                  <Badge variant="outline">{String(viewing.payment_method)}</Badge>
                  {viewing.plan?.name && <Badge variant="secondary">{viewing.plan.name}</Badge>}
                </div>
              </section>

              <section className="rounded-lg border border-[#E5E2DE] p-3.5">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold"><Store className="h-3.5 w-3.5" /> Vendor</p>
                <p className="mt-1.5 text-[13.5px] font-medium">
                  {viewing.caterer?.name ?? catererById[viewing.caterer_id]?.name ?? '—'}
                </p>
                <p className="mt-0.5 break-all text-xs text-[#8A8783]">{viewing.caterer_id}</p>
              </section>

              <section className="grid grid-cols-2 gap-2.5 text-[13px]">
                <div className="rounded-lg border border-[#E5E2DE] p-3">
                  <p className="text-xs text-[#8A8783]">Coverage period</p>
                  <p className="mt-1 font-medium">{new Date(viewing.period_start).toLocaleDateString()} → {new Date(viewing.period_end).toLocaleDateString()}</p>
                </div>
                <div className="rounded-lg border border-[#E5E2DE] p-3">
                  <p className="text-xs text-[#8A8783]">Paid on</p>
                  <p className="mt-1 font-medium">{new Date(viewing.paid_at).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-[#E5E2DE] p-3">
                  <p className="text-xs text-[#8A8783]">Reference</p>
                  <p className="mt-1 font-medium">{viewing.reference_no || '—'}</p>
                </div>
                <div className="rounded-lg border border-[#E5E2DE] p-3">
                  <p className="text-xs text-[#8A8783]">Method</p>
                  <p className="mt-1 font-medium">{String(viewing.payment_method)}</p>
                </div>
              </section>

              {viewing.receipt_url && (
                <section className="rounded-lg border border-[#E5E2DE] p-3.5">
                  <p className="text-[13px] font-semibold">Receipt</p>
                  <a href={viewing.receipt_url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-[#74263A] underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Open receipt
                  </a>
                </section>
              )}

              <section>
                <p className="text-[13px] font-semibold">Notes</p>
                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] text-[#5F5C59]">{viewing.notes || 'No notes'}</p>
              </section>

              <section className="rounded-lg bg-[#FAF9F7] p-3 text-xs text-[#8A8783]">
                <p className="font-medium text-[#5F5C59]">Audit</p>
                <p className="mt-1 break-all">ID: {viewing.id}</p>
                <p>Recorded: {new Date(viewing.created_at).toLocaleString()} · Updated: {new Date(viewing.updated_at).toLocaleString()}</p>
                {viewing.recorded_by && <p>Recorded by: {viewing.recorded_by}</p>}
              </section>
            </div>
          )}
          {viewing && (
            <SheetFooter className="flex-row justify-end gap-2 border-t border-[#EEECE8] px-5 py-4">
              <Button variant="outline" onClick={() => setViewingId(null)}>
                Close
              </Button>
              {viewing.receipt_url && (
                <Button variant="outline" asChild>
                  <a href={viewing.receipt_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" /> Receipt
                  </a>
                </Button>
              )}
              {viewing.status === 'VERIFIED' ? (
                <Button
                  variant="destructive"
                  onClick={() => { setVoidTarget(viewing); setViewingId(null); }}
                >
                  <Ban className="h-4 w-4" /> Void
                </Button>
              ) : null}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!voidTarget} onOpenChange={(o) => !o && setVoidTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Void payment?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#5F5C59]">
            This keeps the row for audit but excludes it from coverage. Expiry will be recomputed from remaining verified payments.
            {voidTarget && <> {fmtMoney(voidTarget.amount, voidTarget.currency)} · {voidTarget.period_start} → {voidTarget.period_end}.</>}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={voidPayment.isPending}
              onClick={async () => {
                if (!voidTarget) return;
                try {
                  await voidPayment.mutateAsync({ id: voidTarget.id, catererId: voidTarget.caterer_id, status: 'VOID' });
                  toast({ title: 'Payment voided', description: 'Coverage recomputed.' });
                  setVoidTarget(null);
                } catch (e) {
                  toast({ title: 'Void failed', description: postgrestMessage(e), variant: 'destructive' });
                }
              }}
            >
              Void payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function VendorPicker({ caterers, onPick }: { caterers: Caterer[]; onPick: (c: Caterer) => void }) {
  const [open, setOpen] = useState(false);
  const [qq, setQq] = useState('');
  const list = caterers.filter((c) => `${c.name} ${c.location ?? ''}`.toLowerCase().includes(qq.toLowerCase())).slice(0, 8);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Record payment</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Choose vendor</DialogTitle></DialogHeader>
          <Input placeholder="Search vendors..." value={qq} onChange={(e) => setQq(e.target.value)} />
          <div className="max-h-[280px] space-y-1 overflow-y-auto">
            {list.map((c) => (
              <button key={c.id} onClick={() => { setOpen(false); onPick(c); }} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.subscription_expires_at ? `until ${new Date(c.subscription_expires_at).toLocaleDateString()}` : 'no expiry'}</span>
              </button>
            ))}
            {list.length === 0 && <p className="p-3 text-sm text-muted-foreground">No vendors match.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlansManager() {
  const { toast } = useToast();
  const { data: plans, isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const removePlan = useDeletePlan();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [months, setMonths] = useState('1');
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle className="text-[15px]">Subscription plans</CardTitle>
        <CardDescription>Flexible pricing. Recording a payment can use a plan or a fully custom amount/duration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_140px_120px_auto]">
          <Input placeholder="Plan name e.g. Monthly Standard" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" min={0} placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input type="number" min={1} max={36} placeholder="Months" value={months} onChange={(e) => setMonths(e.target.value)} />
          <Button
            disabled={!name.trim() || createPlan.isPending}
            onClick={async () => {
              try {
                await createPlan.mutateAsync({ name: name.trim(), price: Number(price) || 0, duration_months: Math.max(1, Number(months) || 1) });
                setName(''); setPrice('0'); setMonths('1');
                toast({ title: 'Plan created' });
              } catch (e) {
                toast({ title: 'Create failed', description: postgrestMessage(e), variant: 'destructive' });
              }
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <div className="space-y-2">
            {(plans ?? []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                {editing?.id === p.id ? (
                  <>
                    <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-8 w-[180px]" />
                    <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="h-8 w-[120px]" />
                    <Input type="number" value={editing.duration_months} onChange={(e) => setEditing({ ...editing, duration_months: Number(e.target.value) })} className="h-8 w-[90px]" />
                    <Button size="sm" onClick={async () => { await updatePlan.mutateAsync({ id: p.id, updates: { name: editing.name, price: editing.price, duration_months: editing.duration_months } }); setEditing(null); }}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">{p.name}</p>
                    <Badge variant="outline">{Number(p.price).toLocaleString()} {p.currency}</Badge>
                    <Badge variant="secondary">{p.duration_months}mo</Badge>
                    {!p.is_active && <Badge variant="destructive">disabled</Badge>}
                    <div className="ml-auto flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
                      {p.is_active && <Button size="sm" variant="outline" onClick={() => removePlan.mutate(p.id)}>Disable</Button>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
