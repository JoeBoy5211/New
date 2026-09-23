import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Caterer {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  long_description: string | null;
  location: string | null;
  rating: number;
  review_count: number;
  view_count: number | null;
  unique_view_count: number | null;
  licence_path: string | null;
  price_range: '$' | '$$' | '$$$' | '$$$$' | null;
  min_guests: number;
  max_guests: number;
  cover_image: string | null;
  images: string[];
  cuisines: string[];
  event_types: string[];
  specialties: string[];
  years_in_business: number;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  is_premium: boolean;
  latitude: number | null;
  longitude: number | null;
  admin_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  is_approved: boolean;
  is_pending: boolean;
  account_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | string | null;
  subscription_status: 'ACTIVE' | 'PAYMENT_DUE' | 'EXPIRED' | string | null;
  subscription_expires_at: string | null;
  service_areas: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useApprovedCaterers() {
  return useQuery({
    queryKey: ['caterers', 'approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caterers')
        .select('*')
        .eq('is_approved', true)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      return data as Caterer[];
    },
  });
}

export function useCatererById(id: string | undefined) {
  return useQuery({
    queryKey: ['caterers', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('caterers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Caterer | null;
    },
    enabled: !!id,
  });
}

export function useVendorCaterer(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['caterers', 'vendor', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      const { data, error } = await supabase
        .from('caterers')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Caterer | null;
    },
    enabled: !!vendorId,
  });
}

export function useAllCaterers() {
  return useQuery({
    queryKey: ['caterers', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caterers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Caterer[];
    },
  });
}

export function useUpdateCaterer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Caterer> }) => {
      const { data, error } = await supabase
        .from('caterers')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        // supabase-js throws a plain PostgREST object ({message, details, hint, code}),
        // not an Error — normalize so callers can read e.message.
        const o = error as unknown as Record<string, unknown>;
        const parts: string[] = [];
        if (typeof o['message'] === 'string' && o['message']) parts.push(o['message'] as string);
        if (typeof o['details'] === 'string' && o['details']) parts.push(o['details'] as string);
        if (typeof o['hint'] === 'string' && o['hint']) parts.push(`Hint: ${o['hint'] as string}`);
        if (typeof o['code'] === 'string' && o['code']) parts.push(`(${(o['code'] as string)})`);
        throw new Error(parts.length > 0 ? parts.join(' ') : JSON.stringify(error));
      }
      // PostgREST returns 0 rows (no error) when RLS blocks the UPDATE.
      // Surface that instead of faking success — otherwise the button looks dead.
      if (!data) {
        throw new Error('Update returned no rows. The admin UPDATE policy on `caterers` likely blocked it (or the row was deleted).');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caterers'] });
    },
  });
}

export function useCreateCaterer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (caterer: Omit<Caterer, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count'>) => {
      const { data, error } = await supabase
        .from('caterers')
        .insert(caterer)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caterers'] });
    },
  });
}
