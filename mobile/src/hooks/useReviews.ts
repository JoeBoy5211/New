import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import {
  createReview,
  fetchReviewsByCaterer,
  refreshCatererRating,
  updateReview,
  type CreateReviewPayload,
} from '@/services/catalog';

export type { Review, ReviewWithCustomer } from '@/types/domain';

export function useReviewsByCaterer(catererId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews(catererId),
    queryFn: () => fetchReviewsByCaterer(catererId),
    enabled: !!catererId,
  });
}

export function useCreateReview(catererId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(payload),
    onSuccess: (_data, variables) => {
      const id = catererId ?? variables.caterer_id;
      // Best-effort: heal the denormalized caterers.rating row (no-op for
      // customers blocked by RLS; UI uses the live aggregate regardless).
      void refreshCatererRating(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.caterer(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.caterersApproved });
      queryClient.invalidateQueries({ queryKey: queryKeys.catererRatings });
    },
  });
}

export function useUpdateReview(catererId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      rating,
      comment,
    }: {
      reviewId: string;
      rating: number;
      comment?: string | null;
    }) => updateReview(reviewId, { rating, comment }),
    onSuccess: () => {
      // Best-effort heal of the denormalized row (see useCreateReview).
      if (catererId) void refreshCatererRating(catererId);
      if (catererId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews(catererId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.caterer(catererId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.caterersApproved });
      queryClient.invalidateQueries({ queryKey: queryKeys.catererRatings });
    },
  });
}
