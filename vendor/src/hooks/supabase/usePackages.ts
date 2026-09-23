import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Package {
  id: string;
  caterer_id: string;
  name: string;
  description: string | null;
  price: number;
  min_guests: number | null;
  max_guests: number | null;
  includes: string[] | null;
  images: string[] | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export function usePackagesByCaterer(catererId: string | undefined, activeOnly = false) {
  return useQuery({
    queryKey: ['packages', catererId, activeOnly ? 'active' : 'all'],
    queryFn: async () => {
      if (!catererId) return [];
      let query = supabase.from('packages').select('*').eq('caterer_id', catererId);
      if (activeOnly) query = query.eq('is_active', true);
      query = query.order('price', { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Package[];
    },
    enabled: !!catererId,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pkg: Omit<Package, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('packages').insert(pkg).select().single();

      if (error) throw error;
      return data as Package;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['packages', data.caterer_id] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Package> }) => {
      const { data, error } = await supabase.from('packages').update(updates).eq('id', id).select().single();

      if (error) throw error;
      return data as Package;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('packages').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}
