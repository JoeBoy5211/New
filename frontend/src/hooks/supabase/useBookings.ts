import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Booking {
  id: string;
  customer_id: string;
  caterer_id: string;
  event_date: string;
  event_type: string;
  guest_count: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  special_requests: string | null;
  total_amount: number | null;
  menu_selections: string[];
  venue: string | null;
  contact_phone: string | null;
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
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(name, email, phone)
        `)
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
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          caterer:caterers(id, name),
          customer:profiles!bookings_customer_id_fkey(name, email)
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
    mutationFn: async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
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
