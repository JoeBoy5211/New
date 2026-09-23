import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { fetchCatererRatingSummaries, type CatererRatingAggregate } from '@/services/catalog';

/** Live per-caterer rating aggregates computed from `reviews`. */
export function useCatererRatings(catererIds: readonly string[] | undefined) {
  const ids = (catererIds ?? []).filter(Boolean);
  const sorted = [...new Set(ids)].sort();
  return useQuery<Record<string, CatererRatingAggregate>>({
    queryKey: queryKeys.catererRatingsFor(sorted),
    queryFn: () => fetchCatererRatingSummaries(sorted),
    enabled: sorted.length > 0,
    staleTime: 30 * 1000,
  });
}
