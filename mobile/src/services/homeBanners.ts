/** Data-access for `home_banners` — pure Supabase calls, no React. */
import { supabase } from '@/lib/supabase';
import type { HomeBanner } from '@/types/domain';

export async function fetchActiveHomeBanners(): Promise<HomeBanner[]> {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as HomeBanner[];
}
