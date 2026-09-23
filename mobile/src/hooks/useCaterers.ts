import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import {
  fetchApprovedCaterers,
  fetchCatererById,
} from '@/services/caterers';

export type { Caterer } from '@/types/domain';

export function useApprovedCaterers() {
  return useQuery({
    queryKey: [...queryKeys.caterersApproved],
    queryFn: fetchApprovedCaterers,
  });
}

export function useCatererById(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.caterer(id),
    queryFn: () => fetchCatererById(id),
    enabled: !!id,
  });
}
