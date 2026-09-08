
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Caterer } from '@/data/mockData';

// Helper to convert relative URLs to absolute URLs
const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
};


export function useCaterers(date?: string) {
    const [caterers, setCaterers] = useState<Caterer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCaterers = async () => {
            setIsLoading(true);
            try {
                const url = date ? `/caterers?date=${date}` : '/caterers';
                const response = await api.get(url);
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
                        cuisines: typeof c.cuisines === 'string' ? c.cuisines.split(',') : (c.cuisines || []),
                        eventTypes: typeof (c.eventTypes || c.event_types) === 'string' ? (c.eventTypes || c.event_types).split(',') : (c.eventTypes || c.event_types || []),
                        specialties: typeof c.specialties === 'string' ? c.specialties.split(',') : (c.specialties || []),
                        yearsInBusiness: c.years_in_business || 0,
                        hasMenu: Boolean(c.hasMenu),
                        isProfileComplete: Boolean(c.isProfileComplete)
                    }));
                    setCaterers(mapped);
                } else {
                    setError(response.message || 'Failed to fetch caterers');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCaterers();
    }, [date]);

    return { caterers, isLoading, error };
}


export function useCatererDetail(id: string | undefined) {
    const [caterer, setCaterer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchCaterer = async () => {
            try {
                const response = await api.get(`/caterers/${id}?incrementView=true`);
                if (response.success) {
                    const c = response.data;
                    const mapped = {
                        id: c.id,
                        name: c.name,
                        description: c.description,
                        longDescription: c.long_description,
                        location: c.location,
                        rating: Number(c.ratingValue) || Number(c.rating) || 0,
                        reviewCount: c.reviewCount || 0,
                        priceRange: c.price_range,
                        minGuests: c.min_guests,
                        maxGuests: c.max_guests,
                        coverImage: getImageUrl(c.cover_image),
                        images: (typeof c.images === 'string' ? c.images.split(',') : (c.images || [])).map((img: string) => getImageUrl(img)),
                        cuisines: typeof c.cuisines === 'string' ? c.cuisines.split(',') : (c.cuisines || []),
                        eventTypes: typeof (c.eventTypes || c.event_types) === 'string' ? (c.eventTypes || c.event_types).split(',') : (c.eventTypes || c.event_types || []),
                        specialties: typeof c.specialties === 'string' ? c.specialties.split(',') : (c.specialties || []),
                        yearsInBusiness: c.years_in_business || 0,
                        menuItems: (c.menuItems || []).map((item: any) => ({
                            ...item,
                            image: getImageUrl(item.image)
                        })),
                        reviews: c.reviews || [],
                        services: (c.services || []).map((s: any) => ({
                            ...s,
                            sample_images: (s.sample_images || []).map((img: string) => getImageUrl(img))
                        })),
                        hasMenu: Boolean(c.hasMenu),
                        isProfileComplete: Boolean(c.isProfileComplete)
                    };
                    setCaterer(mapped);
                } else {
                    setError(response.message || 'Caterer not found');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCaterer();
    }, [id]);

    return { caterer, isLoading, error };
}
