import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CuisineCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface EventType {
  id: string;
  name: string;
  created_at: string;
}

export function useCuisineCategories() {
  return useQuery({
    queryKey: ['cuisine_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuisine_categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as CuisineCategory[];
    },
  });
}

export function useEventTypes() {
  return useQuery({
    queryKey: ['event_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as EventType[];
    },
  });
}

export function useCreateCuisineCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('cuisine_categories')
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuisine_categories'] });
    },
  });
}

export function useUpdateCuisineCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('cuisine_categories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuisine_categories'] });
    },
  });
}

export function useDeleteCuisineCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cuisine_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuisine_categories'] });
    },
  });
}

export function useCreateEventType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('event_types')
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event_types'] });
    },
  });
}

export function useUpdateEventType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('event_types')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event_types'] });
    },
  });
}

export function useDeleteEventType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event_types'] });
    },
  });
}
