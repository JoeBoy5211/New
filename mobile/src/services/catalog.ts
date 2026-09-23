/**
 * Data-access for caterer catalog: menu items, packages, reviews, unavailability.
 * Pure Supabase calls, no React.
 */
import { supabase } from '@/lib/supabase';
import type {
  MenuItem,
  Package,
  Review,
  ReviewWithCustomer,
  Unavailability,
} from '@/types/domain';

export async function fetchMenuItemsByCaterer(
  catererId: string | undefined,
): Promise<MenuItem[]> {
  if (!catererId) return [];
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('caterer_id', catererId)
    .order('category', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MenuItem[];
}

export async function fetchPackagesByCaterer(
  catererId: string | undefined,
): Promise<Package[]> {
  if (!catererId) return [];
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('caterer_id', catererId)
    .eq('is_active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Package[];
}

export async function fetchReviewsByCaterer(
  catererId: string | undefined,
): Promise<ReviewWithCustomer[]> {
  if (!catererId) return [];
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('caterer_id', catererId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;

  const list = (reviews ?? []) as Review[];
  const customerIds = [...new Set(list.map((r) => r.customer_id))];
  if (customerIds.length === 0) {
    return list.map((review) => ({ ...review, customer: null }));
  }

  const { data: customerRows, error: customerError } = await supabase
    .from('profiles')
    .select('user_id, name, avatar_url')
    .in('user_id', customerIds);
  if (customerError) throw customerError;

  const byId = new Map((customerRows ?? []).map((p) => [p.user_id, p]));
  return list.map((review) => {
    const match = byId.get(review.customer_id) as
      | { name: string; avatar_url: string | null }
      | undefined;
    return {
      ...review,
      customer: match
        ? { name: match.name, avatar_url: match.avatar_url }
        : null,
    };
  });
}

export async function fetchUnavailabilityByCaterer(
  catererId: string | undefined,
): Promise<Unavailability[]> {
  if (!catererId) return [];
  const { data, error } = await supabase
    .from('vendor_unavailability')
    .select('*')
    .eq('caterer_id', catererId)
    .order('blocked_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Unavailability[];
}

export interface CreateReviewPayload {
  customer_id: string;
  caterer_id: string;
  booking_id?: string | null;
  rating: number;
  comment?: string | null;
}

export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  const rating = Math.round(Number(payload.rating));
  if (!payload.customer_id || !payload.caterer_id) {
    throw new Error('Missing customer or caterer.');
  }
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Please select a rating from 1 to 5.');
  }
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      customer_id: payload.customer_id,
      caterer_id: payload.caterer_id,
      booking_id: payload.booking_id ?? null,
      rating,
      comment: payload.comment?.trim() ? payload.comment.trim() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

export async function updateReview(
  reviewId: string,
  payload: { rating: number; comment?: string | null },
): Promise<Review> {
  const rating = Math.round(Number(payload.rating));
  if (!reviewId) throw new Error('Missing review.');
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Please select a rating from 1 to 5.');
  }
  const { data, error } = await supabase
    .from('reviews')
    .update({
      rating,
      comment: payload.comment?.trim() ? payload.comment.trim() : null,
    })
    .eq('id', reviewId)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

export interface CatererRatingAggregate {
  rating: number;
  count: number;
}

/**
 * Live rating aggregates computed directly from `reviews`.
 * This is the fallback when `caterers.rating` / `review_count` are stale
 * (e.g. the `update_caterer_rating()` trigger was never installed).
 * RLS already allows anyone to read reviews of approved caterers.
 */
export async function fetchCatererRatingSummaries(
  catererIds: readonly string[],
): Promise<Record<string, CatererRatingAggregate>> {
  const ids = [...new Set((catererIds ?? []).filter(Boolean))];
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from('reviews')
    .select('caterer_id, rating')
    .in('caterer_id', ids)
    .limit(2000);
  if (error) throw error;
  const sums = new Map<string, { total: number; count: number }>();
  for (const row of (data ?? []) as { caterer_id: string; rating: number }[]) {
    const n = Number(row.rating);
    if (!Number.isFinite(n) || n < 1 || n > 5) continue;
    const entry = sums.get(row.caterer_id) ?? { total: 0, count: 0 };
    entry.total += n;
    entry.count += 1;
    sums.set(row.caterer_id, entry);
  }
  const out: Record<string, CatererRatingAggregate> = {};
  for (const [catererId, { total, count }] of sums) {
    out[catererId] = { rating: Math.round((total / count) * 10) / 10, count };
  }
  return out;
}

/**
 * Best-effort heal for stale `caterers.rating` / `review_count` rows.
 * Customers are blocked by RLS from updating `caterers`, so this usually
 * no-ops for them — the UI does not depend on it (it uses the live
 * aggregate above). Vendors/admins who can update will heal the row so the
 * vendor + admin web apps also see the correct value.
 */
export async function refreshCatererRating(catererId: string): Promise<void> {
  if (!catererId) return;
  try {
    const aggregates = await fetchCatererRatingSummaries([catererId]);
    const agg = aggregates[catererId] ?? { rating: 0, count: 0 };
    await supabase
      .from('caterers')
      .update({ rating: agg.rating, review_count: agg.count })
      .eq('id', catererId);
  } catch {
    // Intentionally silent — RLS blocks customers; live aggregate still drives the UI.
  }
}
