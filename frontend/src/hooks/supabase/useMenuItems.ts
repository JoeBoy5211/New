import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  caterer_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image: string | null;
  is_popular: boolean;
  dietary_info: string[];
  created_at: string;
  updated_at: string;
}

export function useMenuItemsByCaterer(catererId: string | undefined) {
  return useQuery({
    queryKey: ['menu_items', catererId],
    queryFn: async () => {
      if (!catererId) return [];
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('caterer_id', catererId)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!catererId,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu_items', variables.caterer_id] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MenuItem> }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
}
