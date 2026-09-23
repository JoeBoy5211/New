/**
 * Shared domain models — single source of truth for Supabase-derived types.
 * Hook files re-export these for backward compatibility
 * (`@/hooks/useCaterers` etc. keep working).
 */

export interface Caterer {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  long_description: string | null;
  location: string | null;
  rating: number;
  review_count: number;
  view_count: number;
  unique_view_count: number;
  price_range: '$' | '$$' | '$$$' | '$$$$' | null;
  min_guests: number;
  max_guests: number;
  cover_image: string | null;
  logo_url?: string | null;
  is_premium: boolean;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  cuisines: string[];
  event_types: string[];
  specialties: string[];
  years_in_business: number;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  telegram_url?: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  is_approved: boolean;
  is_pending: boolean;
  created_at: string;
  updated_at: string;
}

export type RequestStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'NEGOTIATING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Booking {
  id: string;
  customer_id: string;
  caterer_id: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  guest_count: number;
  status: string | null;
  request_status: RequestStatus | string | null;
  special_requests: string | null;
  total_amount: number | null;
  menu_selections: string[] | null;
  package_ids: string[] | null;
  venue: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithCaterer extends Booking {
  caterer?: {
    id: string;
    name: string;
    cover_image: string | null;
    logo_url?: string | null;
    location: string | null;
  } | null;
}

export interface CreateBookingPayload {
  caterer_id: string;
  customer_id: string;
  event_date: string;
  event_time?: string | null;
  event_type: string;
  guest_count: number;
  venue?: string | null;
  contact_phone?: string | null;
  contact_name?: string | null;
  special_requests?: string | null;
  menu_selections?: string[] | null;
  package_ids?: string[] | null;
  total_amount?: number | null;
}

export interface MenuItem {
  id: string;
  caterer_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image: string | null;
  is_popular: boolean;
  dietary_info: string[];
  created_at: string;
}

export interface Package {
  id: string;
  caterer_id: string;
  name: string;
  description: string | null;
  price: number;
  min_guests: number | null;
  max_guests: number | null;
  includes: string[] | null;
  images: string[] | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  customer_id: string;
  caterer_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  response: string | null;
  created_at: string;
}

export interface ReviewWithCustomer extends Review {
  customer?: { name: string; avatar_url: string | null } | null;
}

export interface Unavailability {
  caterer_id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomeBanner {
  id: string;
  image_url: string;
  title: string;
  link_caterer_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
