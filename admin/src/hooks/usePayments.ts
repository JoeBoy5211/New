import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'TELEBIRR' | 'CHAPA' | 'CARD' | 'OTHER';
export type PaymentStatus = 'VERIFIED' | 'VOID' | 'REFUNDED';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'TELEBIRR', label: 'TeleBirr' },
  { value: 'CHAPA', label: 'Chapa' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
];

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_months: number;
  grace_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorPayment {
  id: string;
  caterer_id: string;
  vendor_id: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod | string;
  reference_no: string | null;
  receipt_url: string | null;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  paid_at: string;
  recorded_by: string | null;
  status: PaymentStatus | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  caterer?: { id: string; name: string; vendor_id: string } | null;
  plan?: { id: string; name: string } | null;
}

export interface RecordPaymentInput {
  caterer_id: string;
  vendor_id: string;
  plan_id?: string | null;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  reference_no?: string | null;
  receipt_url?: string | null;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  paid_at?: string; // ISO
  notes?: string | null;
}

function isMissingTableError(e: unknown) {
  const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : JSON.stringify(e ?? '');
  return /could not find the table|schema cache|PGRST205|relation .* does not exist|404/i.test(msg);
}

/** PostgREST errors from supabase-js are plain objects ({message, details, hint, code}), not Errors. */
export function postgrestMessage(e: unknown, fallback = 'Request failed.'): string {
  if (e instanceof Error && e.message && !/^PostgREST/.test(e.message)) return e.message;
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o['message'] === 'string' && o['message']) parts.push(o['message'] as string);
    if (typeof o['details'] === 'string' && o['details']) parts.push(o['details'] as string);
    if (typeof o['hint'] === 'string' && o['hint']) parts.push(`Hint: ${o['hint'] as string}`);
    if (typeof o['code'] === 'string' && o['code']) parts.push(`(${o['code'] as string})`);
    if (parts.length > 0) return parts.join(' ');
    // supabase-js sometimes nests under .error
    if (o['error'] && typeof o['error'] === 'object') return postgrestMessage(o['error'], fallback);
  }
  if (typeof e === 'string' && e) return e;
  return fallback;
}

function throwNormalized(error: unknown): never {
  throw new Error(postgrestMessage(error));
}

export function isPaymentsLedgerAvailable() {
  return true; // runtime probe via query error handling instead
}

// ---------------------------------------------------------------- plans

export function usePlans(activeOnly = false) {
  return useQuery({
    queryKey: ['subscription_plans', activeOnly ? 'active' : 'all'],
    queryFn: async () => {
      let q = supabase.from('subscription_plans').select('*').order('duration_months', { ascending: true });
      if (activeOnly) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) {
        if (isMissingTableError(error)) return [] as SubscriptionPlan[];
        throwNormalized(error);
      }
      return (data ?? []) as SubscriptionPlan[];
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; price: number; currency?: string; duration_months: number; grace_days?: number }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          name: input.name,
          price: input.price,
          currency: input.currency ?? 'ETB',
          duration_months: input.duration_months,
          grace_days: input.grace_days ?? 7,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SubscriptionPlan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription_plans'] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubscriptionPlan> }) => {
      const { data, error } = await supabase.from('subscription_plans').update(updates).eq('id', id).select().single();
      if (error) throwNormalized(error);
      return data as SubscriptionPlan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription_plans'] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft-disable so existing payment rows keep plan reference.
      const { error } = await supabase.from('subscription_plans').update({ is_active: false }).eq('id', id);
      if (error) throwNormalized(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription_plans'] }),
  });
}

// ---------------------------------------------------------------- payments

export function useAllPayments(limit = 500) {
  return useQuery({
    queryKey: ['vendor_payments', 'all', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('*, caterer:caterers(id,name,vendor_id), plan:subscription_plans(id,name)')
        .order('paid_at', { ascending: false })
        .limit(limit);
      if (error) {
        if (isMissingTableError(error)) {
          const err = new Error('PAYMENTS_TABLE_MISSING: run migration 20260917000000_vendor_payments.sql');
          (err as Error & { code?: string }).code = 'PAYMENTS_TABLE_MISSING';
          throw err;
        }
        throwNormalized(error);
      }
      return (data ?? []) as unknown as VendorPayment[];
    },
    retry: false,
  });
}

export function usePaymentsByCaterer(catererId: string | null | undefined) {
  return useQuery({
    queryKey: ['vendor_payments', 'caterer', catererId],
    queryFn: async () => {
      if (!catererId) return [] as VendorPayment[];
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('*, plan:subscription_plans(id,name)')
        .eq('caterer_id', catererId)
        .order('period_end', { ascending: false });
      if (error) {
        if (isMissingTableError(error)) return [] as VendorPayment[];
        throwNormalized(error);
      }
      return (data ?? []) as unknown as VendorPayment[];
    },
    enabled: !!catererId,
    retry: false,
  });
}

/** Latest VERIFIED period_end for a caterer (null if none). */
export function latestVerifiedEnd(payments: VendorPayment[] | undefined): string | null {
  if (!payments) return null;
  const verified = payments.filter((p) => p.status === 'VERIFIED');
  if (verified.length === 0) return null;
  return verified.reduce((max, p) => (p.period_end > max ? p.period_end : max), verified[0].period_end);
}

export function computePeriod(startIsoOrDate: string | Date, months: number): { start: string; end: string } {
  const s = typeof startIsoOrDate === 'string' ? new Date(startIsoOrDate) : new Date(startIsoOrDate);
  const e = new Date(s);
  e.setMonth(e.getMonth() + months);
  const toDate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toDate(s), end: toDate(e) };
}

/** Suggest period_start = max(existing expiry, today). */
export function suggestPeriodStart(existingExpiresAt: string | null, verifiedPayments?: VendorPayment[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const candidates = [today];
  if (existingExpiresAt) candidates.push(new Date(existingExpiresAt).toISOString().slice(0, 10));
  const latest = latestVerifiedEnd(verifiedPayments);
  if (latest) candidates.push(latest);
  candidates.sort();
  // If latest expiry is in the past, start today; else continue from expiry.
  const max = candidates[candidates.length - 1];
  return max < today ? today : max;
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('vendor_payments')
        .insert({
          caterer_id: input.caterer_id,
          vendor_id: input.vendor_id,
          plan_id: input.plan_id ?? null,
          amount: input.amount,
          currency: input.currency ?? 'ETB',
          payment_method: input.payment_method,
          reference_no: input.reference_no ?? null,
          receipt_url: input.receipt_url ?? null,
          period_start: input.period_start,
          period_end: input.period_end,
          paid_at: input.paid_at ?? new Date().toISOString(),
          recorded_by: user?.id ?? null,
          status: 'VERIFIED',
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) {
        console.error('recordPayment insert failed', { caterer_id: input.caterer_id, error });
        const code = (error as unknown as { code?: string })?.code;
        const msg = (error as unknown as { message?: string })?.message ?? '';
        if (code === '42703' && msg.includes('subscription_expires_at')) {
          throw new Error(
            'caterers table is missing subscription columns. Run migration 20260916090000_marketplace_mvp.sql (caterers columns section) in the Supabase SQL Editor, then retry. Original: ' + msg
          );
        }
        throwNormalized(error);
      }

      // Best-effort cache sync: DB trigger also refreshes, but update explicitly
      // so UI is correct even if trigger is disabled.
      try {
        const endIso = new Date(input.period_end + 'T00:00:00').toISOString();
        await supabase
          .from('caterers')
          .update({ subscription_status: 'ACTIVE', subscription_expires_at: endIso })
          .eq('id', input.caterer_id);
      } catch {
        /* trigger covers it */
      }
      return data as unknown as VendorPayment;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vendor_payments'] });
      qc.invalidateQueries({ queryKey: ['caterers'] });
      qc.invalidateQueries({ queryKey: ['vendor_payments', 'caterer', vars.caterer_id] });
    },
  });
}

export function useVoidPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, catererId, status }: { id: string; catererId: string; status: PaymentStatus }) => {
      const { data, error } = await supabase
        .from('vendor_payments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throwNormalized(error);

      // Recompute expiry from remaining VERIFIED payments.
      const { data: remaining } = await supabase
        .from('vendor_payments')
        .select('period_end')
        .eq('caterer_id', catererId)
        .eq('status', 'VERIFIED')
        .order('period_end', { ascending: false })
        .limit(1);
      const maxEnd = (remaining as { period_end: string }[] | null)?.[0]?.period_end ?? null;
      if (maxEnd) {
        await supabase
          .from('caterers')
          .update({
            subscription_expires_at: new Date(maxEnd + 'T00:00:00').toISOString(),
            subscription_status: new Date(maxEnd) >= new Date(new Date().toISOString().slice(0, 10)) ? 'ACTIVE' : 'EXPIRED',
          })
          .eq('id', catererId);
      } else {
        await supabase.from('caterers').update({ subscription_status: 'EXPIRED' }).eq('id', catererId);
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor_payments'] });
      qc.invalidateQueries({ queryKey: ['caterers'] });
    },
  });
}
