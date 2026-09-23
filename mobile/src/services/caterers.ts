/** Data-access for `caterers` — pure Supabase calls, no React. */
import { supabase } from '@/lib/supabase';
import type { Caterer } from '@/types/domain';

export async function fetchApprovedCaterers(): Promise<Caterer[]> {
  const { data, error } = await supabase
    .from('caterers')
    .select('*')
    .eq('is_approved', true)
    .order('rating', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Caterer[];
}

export async function fetchCatererById(
  id: string | undefined,
): Promise<Caterer | null> {
  if (!id) return null;
  const { data, error } = await supabase
    .from('caterers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Caterer | null;
}
