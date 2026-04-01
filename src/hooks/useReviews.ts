import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  customer_id: string;
  caterer_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  response: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithCustomer extends Review {
  customer?: {
    name: string;
    avatar_url: string | null;
  };
}

export function useReviewsByCaterer(catererId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', catererId],
    queryFn: async () => {
      if (!catererId) return [];
      
      // Fetch reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('caterer_id', catererId)
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      
      // Fetch customer profiles separately
      const customerIds = [...new Set(reviews.map(r => r.customer_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', customerIds);
      
      if (profilesError) throw profilesError;
      
      // Combine reviews with customer data
      const reviewsWithCustomer = reviews.map(review => ({
        ...review,
        customer: profiles.find(p => p.user_id === review.customer_id)
          ? { 
              name: profiles.find(p => p.user_id === review.customer_id)!.name,
              avatar_url: profiles.find(p => p.user_id === review.customer_id)!.avatar_url
            }
          : undefined
      }));
      
      return reviewsWithCustomer as ReviewWithCustomer[];
    },
    enabled: !!catererId,
  });
}

export function useAllReviews() {
  return useQuery({
    queryKey: ['reviews', 'all'],
    queryFn: async () => {
      // Fetch reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      
      // Fetch caterers
      const { data: caterers, error: caterersError } = await supabase
        .from('caterers')
        .select('id, name');
      
      if (caterersError) throw caterersError;
      
      // Fetch profiles
      const customerIds = [...new Set(reviews.map(r => r.customer_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', customerIds);
      
      if (profilesError) throw profilesError;
      
      // Combine data
      const reviewsWithData = reviews.map(review => ({
        ...review,
        customer: profiles.find(p => p.user_id === review.customer_id),
        caterer: caterers.find(c => c.id === review.caterer_id)
      }));
      
      return reviewsWithData;
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (review: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'response'>) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.caterer_id] });
    },
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ response })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
