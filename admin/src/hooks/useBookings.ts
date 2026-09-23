import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled'
  | string;

export interface AdminBooking {
  id: string;
  caterer_id: string;
  customer_id: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  guest_count: number;
  status: BookingStatus | null;
  request_status: string | null;
  total_amount: number | null;
  venue: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  menu_selections: string[] | null;
  package_ids: string[] | null;
  special_requests: string | null;
  created_at: string;
  updated_at?: string;
  caterer?: { id: string; name: string } | null;
}

/**
 * Canonical status for a booking row.
 * Vendor app writes `status` as pending | accepted | declined | completed | cancelled.
 * Older rows / other clients may use request_status or legacy labels
 * (NEW, CONTACTED, CONFIRMED, pending_review...) — normalize everything here
 * so admin filters + charts stay correct.
 */
export function bookingStatusOf(b: Pick<AdminBooking, 'status' | 'request_status'>): string {
  const raw = String(b.status ?? b.request_status ?? 'pending').toLowerCase().trim();
  if (['pending', 'pending_review', 'new', 'contacted', 'negotiating'].includes(raw)) return 'pending';
  if (['accepted', 'confirmed', 'approved'].includes(raw)) return 'accepted';
  if (['declined', 'rejected'].includes(raw)) return 'declined';
  if (['completed', 'done', 'fulfilled'].includes(raw)) return 'completed';
  if (['cancelled', 'canceled'].includes(raw)) return 'cancelled';
  return raw || 'pending';
}

export function useAllBookings(limit = 1000) {
  return useQuery({
    queryKey: ['bookings', 'all-admin', limit],
    queryFn: async () => {
      // NOTE: no customer:profiles embed — bookings.customer_id references
      // auth.users, so that FK does not exist (same lesson as the vendor app).
      // Customer contact is denormalized on the row (contact_name/contact_phone).
      const { data, error } = await supabase
        .from('bookings')
        .select('*, caterer:caterers(id,name)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as AdminBooking[];
    },
    retry: false,
  });
}
