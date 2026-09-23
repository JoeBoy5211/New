import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { fetchPackagesByCaterer } from '@/services/catalog';

export type { Package } from '@/types/domain';

export function usePackagesByCaterer(catererId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.packages(catererId),
    queryFn: () => fetchPackagesByCaterer(catererId),
    enabled: !!catererId,
  });
}
