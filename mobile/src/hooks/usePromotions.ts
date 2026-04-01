import { useState, useEffect, useCallback } from 'react';
import { api } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';

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
  const { user } = useAuth();
  
  const fetchPromotions = useCallback(async (searchTerm?: string, savedOnly?: boolean, isBackground?: boolean, followingOnly?: boolean) => {
    try {
      if (!isBackground) setIsLoading(true);

      if (searchTerm !== undefined) setCurrentSearch(searchTerm);
      if (savedOnly !== undefined) setCurrentSavedOnly(savedOnly);
      if (followingOnly !== undefined) setCurrentFollowingOnly(followingOnly);

      let url = '/promotions';
      const params = new URLSearchParams();

      const finalSearch = searchTerm !== undefined ? searchTerm : currentSearch;
      const finalSaved = savedOnly !== undefined ? savedOnly : currentSavedOnly;
      const finalFollowing = followingOnly !== undefined ? followingOnly : currentFollowingOnly;

      if (finalSearch) params.append('tag', finalSearch);
      if (finalSaved) params.append('savedOnly', 'true');
      if (finalFollowing) params.append('followingOnly', 'true');

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await api.get(url, {
        headers: user?.id ? { 'user-id': user.id } : {}
      });
      if (res.data?.success) {
        setPromotions(res.data.promotions || []);
      }
    } catch (error: any) {
      console.error('Error loading promotions', error.message);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [user?.id, currentSearch, currentSavedOnly, currentFollowingOnly]);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const toggleLike = useCallback(async (promotionId: string) => {
    if (!user?.id) return;
    try {
      setPromotions(prev => prev.map(p =>
        p.id === promotionId ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 } : p
      ));
      const res = await api.post(`/promotions/${promotionId}/like`, { userId: user.id });
      if (!res.data?.success) fetchPromotions(undefined, undefined, true);
    } catch (e) {
      fetchPromotions(undefined, undefined, true);
    }
  }, [user?.id, fetchPromotions]);

  const toggleSave = useCallback(async (promotionId: string) => {
    if (!user?.id) return;
    try {
      setPromotions(prev => prev.map(p =>
        p.id === promotionId ? { ...p, is_saved: !p.is_saved } : p
      ));
      const res = await api.post(`/promotions/${promotionId}/save`, { userId: user.id });
      if (!res.data?.success) fetchPromotions(undefined, undefined, true);
    } catch (e) {
      fetchPromotions(undefined, undefined, true);
    }
  }, [user?.id, fetchPromotions]);

  const toggleFollow = useCallback(async (catererId: string) => {
    if (!user?.id) return;
    try {
      setPromotions(prev => prev.map(p =>
        p.caterer_id === catererId ? { ...p, is_following: !p.is_following } : p
      ));
      const res = await api.post(`/promotions/${catererId}/follow`, { userId: user.id });
      if (!res.data?.success) fetchPromotions(undefined, undefined, true);
    } catch (e) {
      fetchPromotions(undefined, undefined, true);
    }
  }, [user?.id, fetchPromotions]);

  const trackShare = useCallback(async (promotionId: string) => {
    try {
      setPromotions(prev => prev.map(p =>
        p.id === promotionId ? { ...p, shares_count: p.shares_count + 1 } : p
      ));
      await api.post(`/promotions/${promotionId}/share`, {});
    } catch (e) {}
  }, []);

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
