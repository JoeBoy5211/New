// Mock Data for CaterConnect Marketplace

export type UserRole = 'guest' | 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
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
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  minGuests: number;
  maxGuests: number;
  images: string[];
  coverImage: string;
  isApproved: boolean;
  isPending: boolean;
  vendorId: string;
  yearsInBusiness: number;
  specialties: string[];
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

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'customer-1',
    email: 'customer@demo.com',
    password: 'demo123',
    name: 'Sarah Mitchell',
    role: 'customer',
    phone: '(555) 123-4567',
    createdAt: '2024-01-15',
  },
  {
    id: 'customer-2',
    email: 'john@example.com',
    password: 'demo123',
    name: 'John Doe',
    role: 'customer',
    phone: '(555) 234-5678',
    createdAt: '2024-02-20',
  },
  {
    id: 'vendor-1',
    email: 'vendor@demo.com',
    password: 'demo123',
    name: 'Marco Rossi',
    role: 'vendor',
    phone: '(555) 345-6789',
    createdAt: '2023-06-10',
  },
  {
    id: 'vendor-2',
    email: 'chef@elegante.com',
    password: 'demo123',
    name: 'Pierre Laurent',
    role: 'vendor',
    phone: '(555) 456-7890',
    createdAt: '2023-08-15',
  },
  {
    id: 'admin-1',
    email: 'admin@caterconnect.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2023-01-01',
  },
];

// Mock Caterers
export const mockCaterers: Caterer[] = [
  {
    id: 'caterer-1',
    name: 'La Bella Cucina',
    description: 'Authentic Italian cuisine crafted with passion and tradition for unforgettable events.',
    longDescription: 'La Bella Cucina brings the heart of Italy to your special occasions. With over 15 years of experience, Chef Marco Rossi and his team create authentic Italian dishes using imported ingredients and family recipes passed down through generations. From intimate dinner parties to grand celebrations, we deliver an experience that transports your guests to the rolling hills of Tuscany.',
    cuisines: ['Italian', 'Mediterranean'],
    eventTypes: ['Wedding', 'Corporate', 'Private Party', 'Anniversary'],
    location: 'San Francisco, CA',
    rating: 4.9,
    reviewCount: 127,
    priceRange: '$$$',
    minGuests: 20,
    maxGuests: 300,
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    ],
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
    isApproved: true,
    isPending: false,
    vendorId: 'vendor-1',
    yearsInBusiness: 15,
    specialties: ['Handmade Pasta', 'Wood-Fired Pizza', 'Tiramisu'],
  },
  {
    id: 'caterer-2',
    name: 'Sakura Japanese Catering',
    description: 'Exquisite Japanese cuisine featuring fresh sushi, sashimi, and traditional dishes.',
    longDescription: 'Sakura Japanese Catering offers an authentic taste of Japan, combining traditional techniques with modern presentation. Our master chefs specialize in omakase experiences, live sushi stations, and elegant bento presentations that elevate any event.',
    cuisines: ['Japanese', 'Asian Fusion'],
    eventTypes: ['Corporate', 'Wedding', 'Private Dining', 'Cocktail Party'],
    location: 'Los Angeles, CA',
    rating: 4.8,
    reviewCount: 89,
    priceRange: '$$$$',
    minGuests: 15,
    maxGuests: 150,
    images: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800',
    ],
    coverImage: 'https://images.unsplash.com/photo-1540914124281-342587941389?w=1200',
    isApproved: true,
    isPending: false,
    vendorId: 'vendor-3',
    yearsInBusiness: 12,
    specialties: ['Omakase', 'Live Sushi Station', 'Wagyu Beef'],
  },
  {
    id: 'caterer-3',
    name: 'The French Table',
    description: 'Classic French gastronomy with a contemporary twist for sophisticated palates.',
    longDescription: 'The French Table brings Parisian elegance to your events. Chef Pierre Laurent, trained at Le Cordon Bleu, creates menus that honor French culinary traditions while embracing modern techniques. Perfect for those seeking refinement and culinary excellence.',
    cuisines: ['French', 'European'],
    eventTypes: ['Wedding', 'Gala', 'Corporate', 'Anniversary'],
    location: 'New York, NY',
    rating: 4.9,
    reviewCount: 156,
    priceRange: '$$$$',
    minGuests: 30,
    maxGuests: 400,
    images: [
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800',
    ],
    coverImage: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200',
    isApproved: true,
    isPending: false,
    vendorId: 'vendor-2',
    yearsInBusiness: 20,
    specialties: ['Beef Wellington', 'Soufflé', 'Wine Pairing'],
  },
  {
    id: 'caterer-4',
    name: 'Spice Route Kitchen',
    description: 'Bold Indian and Middle Eastern flavors that create memorable culinary journeys.',
    longDescription: 'Spice Route Kitchen celebrates the rich culinary heritage of India and the Middle East. Our chefs craft dishes using traditional spice blends and cooking methods, delivering authentic flavors that tell stories of ancient trade routes and cultural exchanges.',
    cuisines: ['Indian', 'Middle Eastern', 'Mediterranean'],
    eventTypes: ['Wedding', 'Corporate', 'Festival', 'Private Party'],
    location: 'Chicago, IL',
    rating: 4.7,
    reviewCount: 98,
    priceRange: '$$',
    minGuests: 25,
    maxGuests: 500,
    images: [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800',
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
    ],
    coverImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200',
    isApproved: true,
    isPending: false,
    vendorId: 'vendor-4',
    yearsInBusiness: 8,
    specialties: ['Tandoori', 'Biryani', 'Mezze Platters'],
  },
  {
    id: 'caterer-5',
    name: 'Garden Fresh Catering',
    description: 'Farm-to-table vegetarian and vegan cuisine celebrating seasonal ingredients.',
    longDescription: 'Garden Fresh Catering specializes in plant-based cuisine that delights even the most devoted carnivores. We partner with local organic farms to source the freshest seasonal ingredients, creating innovative dishes that are as beautiful as they are delicious.',
    cuisines: ['Vegetarian', 'Vegan', 'Farm-to-Table'],
    eventTypes: ['Wedding', 'Corporate', 'Wellness Retreat', 'Private Party'],
    location: 'Portland, OR',
    rating: 4.8,
    reviewCount: 72,
    priceRange: '$$',
    minGuests: 15,
    maxGuests: 200,
    images: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
      'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
    ],
    coverImage: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1200',
    isApproved: true,
    isPending: false,
    vendorId: 'vendor-5',
    yearsInBusiness: 6,
    specialties: ['Seasonal Tasting Menu', 'Raw Cuisine', 'Artisan Bread'],
  },
  {
    id: 'caterer-6',
    name: 'BBQ Brothers',
    description: 'Authentic Texas-style BBQ with slow-smoked meats and homestyle sides.',
    longDescription: 'BBQ Brothers brings the spirit of Texas to your events with authentic slow-smoked meats and homestyle Southern sides. Our custom-built smokers and 18-hour cooking process ensure perfectly tender, flavorful BBQ that keeps guests coming back for more.',
    cuisines: ['BBQ', 'American', 'Southern'],
    eventTypes: ['Corporate', 'Private Party', 'Festival', 'Family Reunion'],
    location: 'Austin, TX',
    rating: 4.6,
    reviewCount: 134,
    priceRange: '$$',
    minGuests: 30,
    maxGuests: 600,
    images: [
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
    ],
    coverImage: 'https://images.unsplash.com/photo-1523046755838-6f7e60c7dd6d?w=1200',
    isApproved: true,
    isPending: false,
    vendorId: 'vendor-6',
    yearsInBusiness: 10,
    specialties: ['Brisket', 'Pulled Pork', 'Smoked Ribs'],
  },
  {
    id: 'caterer-7',
    name: 'Ocean Blue Seafood',
    description: 'Premium seafood catering featuring the freshest catches from sustainable sources.',
    longDescription: 'Ocean Blue Seafood specializes in premium seafood experiences, from raw bars and oyster stations to elegant plated dinners. We partner with sustainable fisheries to bring you the finest and freshest seafood, prepared by chefs who understand the ocean\'s bounty.',
    cuisines: ['Seafood', 'Coastal', 'New England'],
    eventTypes: ['Wedding', 'Corporate', 'Cocktail Party', 'Beach Event'],
    location: 'Boston, MA',
    rating: 4.7,
    reviewCount: 88,
    priceRange: '$$$',
    minGuests: 20,
    maxGuests: 250,
    images: [
      'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800',
    ],
    coverImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200',
    isApproved: true,
    isPending: false,
    vendorId: 'vendor-7',
    yearsInBusiness: 14,
    specialties: ['Raw Bar', 'Lobster Bake', 'Sustainable Sushi'],
  },
  {
    id: 'caterer-8',
    name: 'Fiesta Mexicana',
    description: 'Vibrant Mexican cuisine with traditional recipes and fresh, authentic flavors.',
    longDescription: 'Fiesta Mexicana brings the colorful spirit of Mexico to your celebrations. From street taco stations to elegant plated dinners, our chefs create authentic dishes using traditional techniques and the freshest ingredients. Experience the warmth and joy of Mexican hospitality.',
    cuisines: ['Mexican', 'Latin American'],
    eventTypes: ['Wedding', 'Corporate', 'Birthday', 'Festival'],
    location: 'San Diego, CA',
    rating: 4.8,
    reviewCount: 112,
    priceRange: '$$',
    minGuests: 20,
    maxGuests: 400,
    images: [
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
      'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800',
    ],
    coverImage: 'https://images.unsplash.com/photo-1564767655658-4e6b365884f1?w=1200',
    isApproved: true,
    isPending: false,
    vendorId: 'vendor-8',
    yearsInBusiness: 11,
    specialties: ['Street Tacos', 'Mole', 'Fresh Guacamole'],
  },
  {
    id: 'caterer-pending-1',
    name: 'Pending Caterer',
    description: 'A new caterer awaiting approval.',
    longDescription: 'This is a pending caterer for testing purposes.',
    cuisines: ['American'],
    eventTypes: ['Corporate'],
    location: 'Denver, CO',
    rating: 0,
    reviewCount: 0,
    priceRange: '$$',
    minGuests: 10,
    maxGuests: 100,
    images: [],
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
    isApproved: false,
    isPending: true,
    vendorId: 'vendor-pending-1',
    yearsInBusiness: 2,
    specialties: [],
  },
];

// Mock Menu Items
export const mockMenuItems: MenuItem[] = [
  // La Bella Cucina
  { id: 'menu-1', catererId: 'caterer-1', name: 'Bruschetta Trio', description: 'Classic tomato, mushroom truffle, and burrata selections', price: 14, category: 'Appetizers', isPopular: true },
  { id: 'menu-2', catererId: 'caterer-1', name: 'Handmade Pappardelle', description: 'With wild boar ragu and pecorino', price: 28, category: 'Pasta', isPopular: true },
  { id: 'menu-3', catererId: 'caterer-1', name: 'Osso Buco', description: 'Braised veal shank with saffron risotto', price: 42, category: 'Main Course' },
  { id: 'menu-4', catererId: 'caterer-1', name: 'Tiramisu', description: 'Classic espresso-soaked ladyfingers with mascarpone', price: 12, category: 'Desserts', isPopular: true },

  // Sakura Japanese Catering
  { id: 'menu-5', catererId: 'caterer-2', name: 'Omakase Selection', description: 'Chef\'s choice of 12 premium sushi pieces', price: 85, category: 'Sushi', isPopular: true },
  { id: 'menu-6', catererId: 'caterer-2', name: 'A5 Wagyu Tataki', description: 'Seared Japanese Wagyu with ponzu', price: 65, category: 'Premium' },
  { id: 'menu-7', catererId: 'caterer-2', name: 'Miso Black Cod', description: 'Marinated for 48 hours in white miso', price: 38, category: 'Main Course', isPopular: true },

  // The French Table
  { id: 'menu-8', catererId: 'caterer-3', name: 'Foie Gras Terrine', description: 'With brioche and fig compote', price: 32, category: 'Appetizers', isPopular: true },
  { id: 'menu-9', catererId: 'caterer-3', name: 'Beef Wellington', description: 'Prime tenderloin wrapped in mushroom duxelles and puff pastry', price: 58, category: 'Main Course', isPopular: true },
  { id: 'menu-10', catererId: 'caterer-3', name: 'Grand Marnier Soufflé', description: 'Light and airy orange-infused soufflé', price: 18, category: 'Desserts' },
];

// Mock Bookings
export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    customerId: 'customer-1',
    catererId: 'caterer-1',
    eventDate: '2025-02-14',
    eventType: 'Wedding',
    guestCount: 150,
    status: 'accepted',
    totalAmount: 12500,
    createdAt: '2025-01-05',
    venue: 'The Grand Ballroom, SF',
    specialRequests: 'Vegetarian options for 20 guests',
  },
  {
    id: 'booking-2',
    customerId: 'customer-1',
    catererId: 'caterer-3',
    eventDate: '2025-03-20',
    eventType: 'Corporate',
    guestCount: 75,
    status: 'pending',
    createdAt: '2025-01-20',
    venue: 'Tech Hub Conference Center',
    specialRequests: 'Gluten-free options needed',
  },
  {
    id: 'booking-3',
    customerId: 'customer-2',
    catererId: 'caterer-1',
    eventDate: '2024-12-15',
    eventType: 'Private Party',
    guestCount: 40,
    status: 'completed',
    totalAmount: 3200,
    createdAt: '2024-11-28',
    venue: 'Private Residence',
  },
  {
    id: 'booking-4',
    customerId: 'customer-1',
    catererId: 'caterer-5',
    eventDate: '2024-11-10',
    eventType: 'Corporate',
    guestCount: 60,
    status: 'completed',
    totalAmount: 4500,
    createdAt: '2024-10-25',
  },
  {
    id: 'booking-5',
    customerId: 'customer-2',
    catererId: 'caterer-2',
    eventDate: '2025-04-05',
    eventType: 'Anniversary',
    guestCount: 30,
    status: 'pending',
    createdAt: '2025-01-22',
    venue: 'Waterfront Restaurant',
    specialRequests: 'Omakase experience for all guests',
  },
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: 'review-1',
    customerId: 'customer-1',
    catererId: 'caterer-1',
    bookingId: 'booking-3',
    rating: 5,
    comment: 'Absolutely incredible! The pasta was authentic and delicious. Chef Marco and his team exceeded our expectations. Our guests are still talking about the tiramisu!',
    createdAt: '2024-12-20',
    response: 'Thank you so much, Sarah! It was our pleasure to be part of your celebration. We hope to serve you again soon!',
  },
  {
    id: 'review-2',
    customerId: 'customer-2',
    catererId: 'caterer-1',
    bookingId: 'booking-4',
    rating: 5,
    comment: 'Perfect for our corporate event. Professional service, beautiful presentation, and the food was outstanding.',
    createdAt: '2024-11-15',
  },
  {
    id: 'review-3',
    customerId: 'customer-1',
    catererId: 'caterer-3',
    bookingId: 'booking-1',
    rating: 5,
    comment: 'The French Table made our wedding unforgettable. The Beef Wellington was cooked to perfection, and the soufflé was divine.',
    createdAt: '2024-08-20',
  },
];

// Cuisine Categories
export const cuisineCategories = [
  'Italian',
  'French',
  'Japanese',
  'Indian',
  'Mexican',
  'Mediterranean',
  'American',
  'BBQ',
  'Seafood',
  'Vegetarian',
  'Vegan',
  'Asian Fusion',
];

// Event Types
export const eventTypes = [
  'Wedding',
  'Corporate',
  'Private Party',
  'Anniversary',
  'Birthday',
  'Gala',
  'Festival',
  'Cocktail Party',
  'Family Reunion',
  'Holiday Party',
];

// Helper functions
export const getCatererById = (id: string): Caterer | undefined => {
  return mockCaterers.find(c => c.id === id);
};

export const getApprovedCaterers = (): Caterer[] => {
  return mockCaterers.filter(c => c.isApproved);
};

export const getMenuItemsByCaterer = (catererId: string): MenuItem[] => {
  return mockMenuItems.filter(m => m.catererId === catererId);
};

export const getReviewsByCaterer = (catererId: string): Review[] => {
  return mockReviews.filter(r => r.catererId === catererId);
};

export const getBookingsByCustomer = (customerId: string): Booking[] => {
  return mockBookings.filter(b => b.customerId === customerId);
};

export const getBookingsByCaterer = (catererId: string): Booking[] => {
  return mockBookings.filter(b => b.catererId === catererId);
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
};
