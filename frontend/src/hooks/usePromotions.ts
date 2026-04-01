
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from './use-toast';

export interface Promotion {
    id: string;
    caterer_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    caption: string;
    tags: string;
    created_at: string;
    caterer_name: string;
    caterer_image: string;
    likes_count: number;
    followers_count: number;
    shares_count: number;
    comments_count: number;
    is_liked: boolean;
    is_saved: boolean;
    is_following: boolean;
}

export function usePromotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSearch, setCurrentSearch] = useState<string | undefined>();
    const [currentSavedOnly, setCurrentSavedOnly] = useState<boolean>(false);
    const [currentFollowingOnly, setCurrentFollowingOnly] = useState<boolean>(false);
    const { toast } = useToast();

    const fetchPromotions = async (searchTerm?: string, savedOnly?: boolean, isBackground?: boolean, followingOnly?: boolean) => {
        try {
            if (!isBackground) setIsLoading(true);

            // Update state if new filters are provided
            if (searchTerm !== undefined) setCurrentSearch(searchTerm);
            if (savedOnly !== undefined) setCurrentSavedOnly(savedOnly);
            if (followingOnly !== undefined) setCurrentFollowingOnly(followingOnly);

            const userStr = localStorage.getItem('caterconnect_auth');
            const currentUser = userStr ? JSON.parse(userStr) : null;

            let url = '/promotions';
            const params = new URLSearchParams();

            // Use provided values OR current state values
            const finalSearch = searchTerm !== undefined ? searchTerm : currentSearch;
            const finalSaved = savedOnly !== undefined ? savedOnly : currentSavedOnly;
            const finalFollowing = followingOnly !== undefined ? followingOnly : currentFollowingOnly;

            if (finalSearch) params.append('tag', finalSearch);
            if (finalSaved) params.append('savedOnly', 'true');
            if (finalFollowing) params.append('followingOnly', 'true');

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            const data = await api.get(url, {
                headers: currentUser?.id ? { 'user-id': currentUser.id } : {}
            });
            if (data.success) {
                setPromotions(data.promotions || []);
            }
        } catch (error: any) {
            toast({
                title: 'Error loading promotions',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const toggleLike = async (promotionId: string, userId: string) => {
        try {
            // Optimistic update
            setPromotions(prev => prev.map(p =>
                p.id === promotionId ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 } : p
            ));

            const res = await api.post(`/promotions/${promotionId}/like`, { userId });
            if (!res.success) fetchPromotions(undefined, undefined, true);
        } catch (e) {
            fetchPromotions(undefined, undefined, true);
        }
    };

    const toggleSave = async (promotionId: string, userId: string) => {
        try {
            setPromotions(prev => prev.map(p =>
                p.id === promotionId ? { ...p, is_saved: !p.is_saved } : p
            ));

            const res = await api.post(`/promotions/${promotionId}/save`, { userId });
            if (!res.success) fetchPromotions(undefined, undefined, true);
        } catch (e) {
            fetchPromotions(undefined, undefined, true);
        }
    };

    const toggleFollow = async (catererId: string, userId: string) => {
        try {
            // Optimistic update for all promotions from this caterer
            setPromotions(prev => prev.map(p =>
                p.caterer_id === catererId ? { ...p, is_following: !p.is_following } : p
            ));

            const res = await api.post(`/promotions/${catererId}/follow`, { userId });
            if (!res.success) fetchPromotions(undefined, undefined, true);
        } catch (e) {
            fetchPromotions(undefined, undefined, true);
        }
    };

    const trackShare = async (promotionId: string) => {
        try {
            setPromotions(prev => prev.map(p =>
                p.id === promotionId ? { ...p, shares_count: p.shares_count + 1 } : p
            ));
            await api.post(`/promotions/${promotionId}/share`, {});
        } catch (e) {
            // Non-critical, don't revert
        }
    };

    return {
        promotions,
        isLoading,
        refetch: fetchPromotions,
        toggleLike,
        toggleSave,
        toggleFollow,
        trackShare
    };
}
