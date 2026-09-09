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
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  is_approved: boolean;
  is_pending: boolean;
  created_at: string;
  updated_at: string;
}

export function useVendorCaterer(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['caterers', 'vendor', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      const { data, error } = await supabase.from('caterers').select('*').eq('vendor_id', vendorId).maybeSingle();
      if (error) throw error;
      return data as Caterer | null;
    },
    enabled: !!vendorId,
  });
}

export function useUpdateCaterer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Caterer> }) => {
      const { data, error } = await supabase.from('caterers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caterers'] }),
  });
}

// Idempotent self-heal: missing vendor role / caterer row
// (email-confirmation deferral, legacy accounts).
export async function ensureVendorSetup(userId: string): Promise<void> {
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  if (!roles?.some((r) => r.role === 'vendor')) {
    await supabase.from('user_roles').insert({ user_id: userId, role: 'vendor' });
  }

  const { data: existing } = await supabase.from('caterers').select('id').eq('vendor_id', userId).maybeSingle();
  if (existing) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const { data: profile } = await supabase.from('profiles').select('name, email, phone').eq('user_id', userId).maybeSingle();

  const businessName = meta.business_name?.trim() || (profile as { name?: string } | null)?.name || 'My Catering Business';
  const cuisine = meta.cuisine_type?.trim();
  const location = meta.location?.trim() || null;
  const email = user?.email || (profile as { email?: string } | null)?.email || '';
  const phone = meta.phone || (profile as { phone?: string } | null)?.phone || null;

  await supabase.from('caterers').insert({
    vendor_id: userId,
    name: businessName,
    location,
    cuisines: cuisine ? [cuisine] : [],
    contact_phone: phone,
    contact_email: email || null,
    is_approved: false,
    is_pending: true,
  });
}
