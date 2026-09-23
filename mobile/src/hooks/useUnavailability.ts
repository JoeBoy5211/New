import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { fetchUnavailabilityByCaterer } from '@/services/catalog';

export type { Unavailability } from '@/types/domain';

export function useUnavailabilityByCaterer(catererId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.unavailability(catererId),
    queryFn: () => fetchUnavailabilityByCaterer(catererId),
    enabled: !!catererId,
  });
}
