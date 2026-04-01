import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Caterer {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  long_description: string | null;
  location: string | null;
  rating: number;
  review_count: number;
  price_range: '$' | '$$' | '$$$' | '$$$$' | null;
  min_guests: number;
  max_guests: number;
  cover_image: string | null;
  images: string[];
  cuisines: string[];
  event_types: string[];
  specialties: string[];
  years_in_business: number;
  is_approved: boolean;
  is_pending: boolean;
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
        .single();

      if (error) throw error;
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
