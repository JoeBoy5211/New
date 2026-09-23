/**
 * Centralized React Query keys.
 * Values intentionally match the previous inline keys so existing caches
 * survive the refactor — change them in one place from now on.
 */

export const queryKeys = {
  caterersApproved: ['caterers', 'approved'] as const,
  caterer: (id: string | undefined) => ['caterer', id] as const,
  customerBookings: (customerId: string | undefined) =>
    ['bookings', 'customer', customerId] as const,
  bookingsAll: ['bookings'] as const,
  menuItems: (catererId: string | undefined) =>
    ['menu_items', catererId] as const,
  packages: (catererId: string | undefined) =>
    ['packages', catererId] as const,
  reviews: (catererId: string | undefined) =>
    ['reviews', catererId] as const,
  unavailability: (catererId: string | undefined) =>
    ['vendor_unavailability', catererId] as const,
  profile: (userId: string | undefined) => ['profile', userId] as const,
  /** Live rating aggregates computed from `reviews` (see lib/ratings.ts). */
  catererRatings: ['caterer-ratings'] as const,
  catererRatingsFor: (catererIds: readonly string[]) =>
    ['caterer-ratings', ...[...catererIds].sort()] as const,
  /** Active home page banners posted from admin Settings. */
  homeBanners: ['home-banners'] as const,
} as const;
