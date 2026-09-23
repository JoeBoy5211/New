import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Caterer } from './useCaterers';

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
      return (data ?? []) as Caterer[];
    },
  });
}

export interface CatererDetail extends Caterer {
  menuItems: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    image: string | null;
    is_popular: boolean | null;
  }[];
  packages: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    min_guests: number | null;
    max_guests: number | null;
    includes: string[] | null;
    images: string[] | null;
    is_active: boolean | null;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    customer_name: string | null;
    response: string | null;
  }[];
}

export function useCatererDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['caterer', 'detail', id],
    queryFn: async (): Promise<CatererDetail | null> => {
      if (!id) return null;
      const { data: caterer, error: catererError } = await supabase
        .from('caterers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (catererError) throw catererError;
      if (!caterer) return null;

      const [{ data: menuItems }, { data: packages }, { data: reviews }] = await Promise.all([
        supabase.from('menu_items').select('id, name, description, price, category, image, is_popular').eq('caterer_id', id),
        supabase.from('packages').select('id, name, description, price, min_guests, max_guests, includes, images, is_active').eq('caterer_id', id).eq('is_active', true).order('price', { ascending: true }),
        supabase.from('reviews').select('id, rating, comment, response, created_at, customer_id').eq('caterer_id', id).order('created_at', { ascending: false }),
      ]);

      // Resolve customer names (RLS may hide some profiles - tolerate failure)
      let nameMap = new Map<string, string>();
      try {
        const customerIds = [...new Set((reviews ?? []).map((r) => r.customer_id))];
        if (customerIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', customerIds);
          nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.name]));
        }
      } catch {
        nameMap = new Map();
      }

      return {
        ...(caterer as Caterer),
        menuItems: (menuItems ?? []) as CatererDetail['menuItems'],
        packages: (packages ?? []) as CatererDetail['packages'],
        reviews: (reviews ?? []).map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          customer_name: nameMap.get(r.customer_id) ?? null,
          response: r.response,
        })),
      };
    },
    enabled: !!id,
  });
}
