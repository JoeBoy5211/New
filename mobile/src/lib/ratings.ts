/**
 * Rating helpers — single source of truth for displaying caterer ratings.
 *
 * Root cause of "New · No reviews yet" sticking after a review:
 * `caterers.rating` / `review_count` are denormalized columns maintained by
 * the `update_caterer_rating()` DB trigger. If that trigger was never applied
 * to the live Supabase project, those columns stay 0 forever even though
 * rows exist in `reviews`. All cards/detail screens read the stale columns.
 *
 * Fix: treat the `reviews` table (readable by anyone for approved caterers)
 * as authoritative. When a live aggregate for a caterer has been loaded,
 * prefer it; otherwise fall back to the stored columns (covers loading
 * state and offline cache).
 */

export interface RatingSummary {
  rating: number;
  count: number;
  hasReviews: boolean;
}

export function toRatingSummary(rating: unknown, count: unknown): RatingSummary {
  const r = Number(rating ?? 0);
  const c = Math.trunc(Number(count ?? 0));
  const safeRating = Number.isFinite(r) && r > 0 ? r : 0;
  const safeCount = Number.isFinite(c) && c > 0 ? c : 0;
  return {
    rating: safeRating,
    count: safeCount,
    hasReviews: safeCount > 0 && safeRating > 0,
  };
}

/** Summarize a list of raw 1–5 ratings the same way the DB trigger does (AVG rounded to 1 decimal). */
export function summarizeRatings(ratings: Array<number | null | undefined>): RatingSummary {
  const nums = (ratings ?? []).map(Number).filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
  if (nums.length === 0) return { rating: 0, count: 0, hasReviews: false };
  const avg = nums.reduce((sum, n) => sum + n, 0) / nums.length;
  const rounded = Math.round(avg * 10) / 10;
  return { rating: rounded, count: nums.length, hasReviews: true };
}

/**
 * Effective rating for display.
 * Pass the live aggregate from `useCatererRatings` (or from the detail
 * screen's reviews list) when available — it wins over the stored columns.
 */
export function getEffectiveRating(
  caterer: { rating?: number | string | null; review_count?: number | string | null } | null | undefined,
  live?: RatingSummary | { rating: number; count: number } | null,
): RatingSummary {
  if (live && Number(live.count) > 0) {
    return toRatingSummary(live.rating, live.count);
  }
  // Live query resolved to zero reviews — trust it over a stale positive column.
  if (live && Number(live.count) === 0) {
    // If the stored row claims reviews but live says zero, live (the actual
    // reviews table) is authoritative. Still, during the brief window where
    // the live query hasn't refetched after a new review, callers should pass
    // `undefined` (not `{count: 0}`) so we fall through to the stored value.
    return { rating: 0, count: 0, hasReviews: false };
  }
  return toRatingSummary(caterer?.rating, caterer?.review_count);
}
