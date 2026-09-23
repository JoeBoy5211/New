import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Booking {
  id: string;
  customer_id: string;
  caterer_id: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  guest_count: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  request_status: string | null;
  special_requests: string | null;
  total_amount: number | null;
  menu_selections: string[];
  package_ids: string[] | null;
  venue: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithCaterer extends Booking {
  caterer?: {
    id: string;
    name: string;
    cover_image: string | null;
  };
}

export function useCustomerBookings(customerId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', 'customer', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          caterer:caterers(id, name, cover_image)
        `)
        .eq('customer_id', customerId)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      return data as BookingWithCaterer[];
    },
    enabled: !!customerId,
  });
}

export function useCatererBookings(catererId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', 'caterer', catererId],
    queryFn: async () => {
      if (!catererId) return [];
      // NOTE: select bookings only. The previous
      // `customer:profiles!bookings_customer_id_fkey(...)` embed broke this
      // query: bookings.customer_id references auth.users, so that FK does
      // not exist (and vendors have no SELECT on other users' profiles
      // anyway). Customer contact is already on the row (contact_name /
      // contact_phone) from the booking request.
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('caterer_id', catererId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!catererId,
  });
}

export function useAllBookings() {
  return useQuery({
    queryKey: ['bookings', 'all'],
    queryFn: async () => {
      // NOTE: no customer:profiles embed here — bookings.customer_id
      // references auth.users, so that FK does not exist.
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          caterer:caterers(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'status' | 'request_status'>) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Booking> }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
