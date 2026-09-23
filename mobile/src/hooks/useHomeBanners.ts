import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { fetchActiveHomeBanners } from '@/services/homeBanners';

export type { HomeBanner } from '@/types/domain';

/**
 * Active home banners for the fixed-size home slot.
 * Long staleTime — banners change rarely and only from admin Settings.
 * Falls back to [] (caller renders the built-in banner instead).
 */
export function useHomeBanners() {
  return useQuery({
    queryKey: queryKeys.homeBanners,
    queryFn: fetchActiveHomeBanners,
    staleTime: 10 * 60 * 1000,
  });
}
