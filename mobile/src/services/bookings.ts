/** Data-access for `bookings` — pure Supabase calls, no React. */
import { supabase } from '@/lib/supabase';
import type {
  Booking,
  BookingWithCaterer,
  CreateBookingPayload,
} from '@/types/domain';

export async function fetchCustomerBookings(
  customerId: string | undefined,
): Promise<BookingWithCaterer[]> {
  if (!customerId) return [];
  const { data, error } = await supabase
    .from('bookings')
    .select('*, caterer:caterers(id, name, cover_image, location)')
    .eq('customer_id', customerId)
    .order('event_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BookingWithCaterer[];
}

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<Booking> {
  const row = {
    caterer_id: payload.caterer_id,
    customer_id: payload.customer_id,
    event_date: payload.event_date,
    event_time: payload.event_time ?? null,
    event_type: payload.event_type,
    guest_count: payload.guest_count,
    venue: payload.venue ?? null,
    contact_phone: payload.contact_phone ?? null,
    contact_name: payload.contact_name ?? null,
    special_requests: payload.special_requests ?? null,
    menu_selections: payload.menu_selections ?? [],
    package_ids: payload.package_ids ?? [],
    total_amount: payload.total_amount ?? null,
    status: 'pending',
    request_status: 'NEW',
  };
  const { data, error } = await supabase
    .from('bookings')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data as Booking;
}
