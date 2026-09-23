import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { fetchMenuItemsByCaterer } from '@/services/catalog';

export type { MenuItem } from '@/types/domain';

export function useMenuItemsByCaterer(catererId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.menuItems(catererId),
    queryFn: () => fetchMenuItemsByCaterer(catererId),
    enabled: !!catererId,
  });
}
