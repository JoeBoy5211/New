import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ReceiptText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import {
  PAYMENT_METHODS,
  computePeriod,
  postgrestMessage,
  suggestPeriodStart,
  usePaymentsByCaterer,
  usePlans,
  useRecordPayment,
  type PaymentMethod,
  type RecordPaymentInput,
} from '@/hooks/usePayments';
import type { Caterer } from '@/hooks/useCaterers';

export function RecordPaymentDialog({
  caterer,
  open,
  onOpenChange,
  onRecorded,
}: {
  caterer: Caterer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}) {
  const { toast } = useToast();
  const { data: plans } = usePlans(true);
  const { data: history } = usePaymentsByCaterer(caterer?.id);
  const record = useRecordPayment();

  const [planId, setPlanId] = useState<string>('custom');
  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState('ETB');
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodStart, setPeriodStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [months, setMonths] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset when a different vendor is opened.
  useEffect(() => {
    if (open && caterer) {
      const suggested = suggestPeriodStart(caterer.subscription_expires_at, history);
      setPeriodStart(suggested);
      setPaidAt(new Date().toISOString().slice(0, 10));
      setPlanId('custom');
      setMonths(1);
      setNotes('');
      setReference('');
      setReceiptUrl('');
      setReceiptFile(null);
      const first = (plans ?? [])[0];
      if (first) {
        setPlanId(first.id);
        setAmount(String(first.price ?? 0));
        setCurrency(first.currency ?? 'ETB');
        setMonths(first.duration_months ?? 1);
      } else {
        setAmount('0');
        setCurrency('ETB');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, caterer?.id]);

  // When plan changes, autofill amount/currency/duration (still editable).
  useEffect(() => {
    if (planId === 'custom') return;
    const p = (plans ?? []).find((x) => x.id === planId);
    if (p) {
      setAmount(String(p.price ?? 0));
      setCurrency(p.currency ?? 'ETB');
      setMonths(p.duration_months ?? 1);
    }
  }, [planId, plans]);

  const periodEnd = useMemo(() => {
    try {
      return computePeriod(periodStart || new Date().toISOString().slice(0, 10), months || 1).end;
    } catch {
      return '';
    }
  }, [periodStart, months]);

  const canSave = !!caterer && !record.isPending && !uploading && Number(amount) >= 0 && !!periodStart && !!periodEnd && periodEnd > periodStart;

  const handleSave = async () => {
    if (!caterer) return;
    try {
      let finalReceipt = receiptUrl.trim() || null;
      if (receiptFile) {
        setUploading(true);
        try {
          finalReceipt = await uploadToCloudinary(receiptFile, 'catering_app/receipts');
        } finally {
          setUploading(false);
        }
      }
      const input: RecordPaymentInput = {
        caterer_id: caterer.id,
        vendor_id: caterer.vendor_id,
        plan_id: planId === 'custom' ? null : planId,
        amount: Number(amount) || 0,
        currency: currency.trim() || 'ETB',
        payment_method: method,
        reference_no: reference.trim() || null,
        receipt_url: finalReceipt,
        period_start: periodStart,
        period_end: periodEnd,
        paid_at: new Date((paidAt || periodStart) + 'T00:00:00').toISOString(),
        notes: notes.trim() || null,
      };
      await record.mutateAsync(input);
      toast({ title: 'Payment recorded', description: `${caterer.name} covered until ${new Date(periodEnd).toLocaleDateString()}.` });
      onOpenChange(false);
      onRecorded?.();
    } catch (e) {
      console.error('Record payment failed', e);
      toast({ title: 'Could not record payment', description: postgrestMessage(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4" /> Record payment
          </DialogTitle>
          <DialogDescription>
            {caterer ? `Verify the offline payment, then register coverage for ${caterer.name}.` : 'Select a vendor first.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-1 pr-0.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan (flexible)</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom / one-off</SelectItem>
                  {(plans ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.price} {p.currency} · {p.duration_months}mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (months)</Label>
              <Input type="number" min={1} max={36} value={months} onChange={(e) => setMonths(Math.max(1, Number(e.target.value) || 1))} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Amount</Label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1" maxLength={6} />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Paid on</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Coverage from</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Coverage until</Label>
              <Input value={periodEnd ? new Date(periodEnd).toLocaleDateString() : '—'} disabled className="mt-1 bg-muted" />
            </div>
          </div>

          <div>
            <Label>Reference no. (optional)</Label>
            <Input placeholder="e.g. bank ref, TeleBirr SMS id" value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Receipt {isCloudinaryConfigured() ? '(upload or URL)' : '(URL)'}</Label>
            <div className="mt-1 flex gap-2">
              <Input placeholder="https://… (optional)" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} />
              {isCloudinaryConfigured() && (
                <label className="inline-flex shrink-0 cursor-pointer items-center rounded-md border px-3 text-xs font-medium hover:bg-muted">
                  {uploading ? 'Uploading…' : receiptFile ? receiptFile.name.slice(0, 14) : 'Upload'}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label>Admin notes (private)</Label>
            <Textarea placeholder="e.g. Verified bank slip #123, Jan coverage" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 min-h-[64px]" />
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {(record.isPending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
