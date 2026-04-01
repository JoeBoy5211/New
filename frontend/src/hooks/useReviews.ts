
import { useState } from 'react';
import { api } from '@/lib/api';

export interface ReviewData {
    customer_id: string;
    caterer_id: string;
    booking_id?: string;
    rating: number;
    comment: string;
}

export function useReviews() {
    const [isLoading, setIsLoading] = useState(false);

    const submitReview = async (reviewData: ReviewData) => {
        setIsLoading(true);
        try {
            const response = await api.post('/reviews', reviewData);
            return response;
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to submit review' };
        } finally {
            setIsLoading(false);
        }
    };

    const respondToReview = async (reviewId: string, response: string) => {
        setIsLoading(true);
        try {
            const res = await api.patch(`/reviews/${reviewId}/response`, { response });
            return res;
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to submit response' };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        submitReview,
        respondToReview,
        isLoading
    };
}
