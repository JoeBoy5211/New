
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
};

export function useFavorites() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchFavorites = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/favorites/user/${user.id}`);
            if (response.success) {
                const mapped = response.data.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    location: c.location,
                    rating: Number(c.ratingValue) || Number(c.rating) || 0,
                    reviewCount: c.reviewCount || 0,
                    priceRange: c.price_range,
                    minGuests: c.min_guests,
                    maxGuests: c.max_guests,
                    coverImage: getImageUrl(c.cover_image),
                    cuisines: c.cuisines ? (typeof c.cuisines === 'string' ? c.cuisines.split(',') : c.cuisines) : [],
                    eventTypes: c.event_types ? (typeof c.event_types === 'string' ? c.event_types.split(',') : c.event_types) : [],
                    specialties: c.specialties ? (typeof c.specialties === 'string' ? c.specialties.split(',') : c.specialties) : [],
                    yearsInBusiness: c.years_in_business || 0
                }));
                setFavorites(mapped);
            }
        } catch (error) {
            console.error('Fetch favorites error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    const toggleFavorite = async (catererId: string) => {
        if (!user) {
            toast({
                title: 'Authentication required',
                description: 'Please login to save favorites',
                variant: 'destructive'
            });
            return false;
        }

        try {
            const response = await api.post('/favorites/toggle', {
                userId: user.id,
                catererId
            });

            if (response.success) {
                toast({
                    title: response.isFavorited ? 'Added to favorites' : 'Removed from favorites',
                    description: response.message
                });
                fetchFavorites();
                return response.isFavorited;
            }
            return false;
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update favorites',
                variant: 'destructive'
            });
            return false;
        }
    };

    const isFavorited = async (catererId: string) => {
        if (!user?.id) return false;
        try {
            const response = await api.get(`/favorites/check?userId=${user.id}&catererId=${catererId}`);
            return response.isFavorited;
        } catch (error) {
            return false;
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    return { favorites, isLoading, toggleFavorite, isFavorited, refresh: fetchFavorites };
}
