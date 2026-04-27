
// Types and Interfaces for CaterConnect Marketplace

export type UserRole = 'guest' | 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  is_approved?: boolean;
}

export interface Caterer {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  cuisines: string[];
  eventTypes: string[];
  location: string;
  rating: number;
  reviewCount: number;
  priceRange: 'ETB' | 'ETBETB' | 'ETBETBETB' | 'ETBETBETBETB';
  minGuests: number;
  maxGuests: number;
  images: string[];
  coverImage: string;
  isApproved: boolean;
  isPending: boolean;
  vendorId: string;
  yearsInBusiness: number;
  specialties: string[];
  hasMenu?: boolean;
  isProfileComplete?: boolean;
  is_premium?: number;
}

export interface MenuItem {
  id: string;
  catererId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isPopular?: boolean;
  dietaryInfo?: string[];
}

export interface Booking {
  id: string;
  customerId: string;
  catererId: string;
  eventDate: string;
  eventType: string;
  guestCount: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  specialRequests?: string;
  totalAmount?: number;
  createdAt: string;
  menuSelections?: string[];
  venue?: string;
  contactPhone?: string;
}

export interface Review {
  id: string;
  customerId: string;
  catererId: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
  response?: string;
}

// Mock Users - Keeping only admin for reference as requested
export const mockUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@admin.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2023-01-01',
  },
];

// Empty arrays for other mock data
export const mockCaterers: Caterer[] = [];
export const mockMenuItems: MenuItem[] = [];
export const mockBookings: Booking[] = [];
export const mockReviews: Review[] = [];


// Helper functions (returning empty/default values)
export const getCatererById = (id: string): Caterer | undefined => {
  return undefined;
};

export const getApprovedCaterers = (): Caterer[] => {
  return [];
};

export const getMenuItemsByCaterer = (catererId: string): MenuItem[] => {
  return [];
};

export const getReviewsByCaterer = (catererId: string): Review[] => {
  return [];
};

export const getBookingsByCustomer = (customerId: string): Booking[] => {
  return [];
};

export const getBookingsByCaterer = (catererId: string): Booking[] => {
  return [];
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
};
