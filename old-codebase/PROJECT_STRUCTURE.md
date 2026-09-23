# CaterConnect - Project Structure

**Last Updated:** September 8, 2026

## 📁 Current Clean Structure

```
CaterConnect/
│
├── frontend/                           # Complete React Frontend Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── customer/              # Customer dashboard & bookings
│   │   │   │   └── Dashboard.tsx
│   │   │   ├── vendor/                # Vendor portal pages
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── Pending.tsx
│   │   │   ├── Home.tsx               # Landing page
│   │   │   ├── BrowseCaterers.tsx     # Browse/search caterers
│   │   │   ├── CatererProfile.tsx     # Caterer detail page
│   │   │   ├── BookingForm.tsx        # Booking creation
│   │   │   ├── Login.tsx              # Customer login
│   │   │   ├── PromotionsFeed.tsx     # Promotions page
│   │   │   └── NotFound.tsx           # 404 page
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components (50+ files)
│   │   │   ├── vendor/                # Vendor-specific components
│   │   │   ├── layout/                # Layout components
│   │   │   ├── CatererCard.tsx
│   │   │   ├── BookingDetailsModal.tsx
│   │   │   ├── ReviewModal.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── NavLink.tsx
│   │   ├── hooks/                     # React custom hooks
│   │   │   ├── useCaterers.ts         # Caterer data fetching
│   │   │   ├── useVendorData.ts       # Vendor dashboard data
│   │   │   ├── useCustomerBookings.ts # Customer bookings
│   │   │   ├── useFavorites.ts        # Favorites management
│   │   │   ├── usePromotions.ts       # Promotions
│   │   │   ├── useReviews.ts          # Reviews
│   │   │   └── use-toast.ts           # Toast notifications
│   │   ├── context/
│   │   │   └── AuthContext.tsx        # Authentication context
│   │   ├── lib/
│   │   │   ├── api.ts                 # API client
│   │   │   └── utils.ts               # Utility functions
│   │   ├── data/
│   │   │   └── mockData.ts            # Mock data types
│   │   ├── test/                      # Test files
│   │   ├── App.tsx                    # Main app component
│   │   ├── main.tsx                   # Entry point
│   │   └── index.css                  # Global styles
│   ├── public/                        # Static assets
│   │   ├── chef-hat.svg
│   │   ├── placeholder.svg
│   │   ├── favicon.ico
│   │   └── robots.txt
│   ├── package.json                   # Dependencies & scripts
│   ├── vite.config.ts                 # Vite configuration
│   ├── tailwind.config.ts             # Tailwind CSS config
│   ├── tsconfig.json                  # TypeScript config
│   └── ... (other config files)
│
├── backend/                            # Node.js/Express Backend API
│   ├── src/
│   │   ├── controllers/               # Route handlers
│   │   │   ├── auth.controller.ts     # Authentication
│   │   │   ├── authController.ts      # (duplicate - needs review)
│   │   │   ├── vendor.controller.ts   # Vendor endpoints
│   │   │   ├── vendorController.ts    # (duplicate - needs review)
│   │   │   ├── booking.controller.ts  # Booking management
│   │   │   ├── bookingController.ts   # (duplicate - needs review)
│   │   │   ├── catererController.ts   # Caterer endpoints
│   │   │   ├── favoriteController.ts  # Favorites
│   │   │   ├── reviewController.ts    # Reviews
│   │   │   ├── promotionController.ts # Promotions
│   │   │   └── uploadController.ts    # Image uploads
│   │   ├── routes/                    # API route definitions
│   │   │   ├── authRoutes.ts
│   │   │   ├── vendorRoutes.ts
│   │   │   ├── bookingRoutes.ts
│   │   │   ├── catererRoutes.ts
│   │   │   ├── favoriteRoutes.ts
│   │   │   └── ... (other routes)
│   │   ├── middleware/                # Express middleware
│   │   │   ├── authenticate.ts        # JWT authentication
│   │   │   ├── authorize.ts           # Role-based authorization
│   │   │   └── subscriptionLimits.ts  # Subscription checks
│   │   ├── services/                  # Business logic services
│   │   │   ├── auth.service.ts        # Auth service
│   │   │   ├── token.service.ts       # JWT tokens
│   │   │   ├── emailService.ts        # Email sending
│   │   │   └── pushNotificationService.ts # Push notifications
│   │   ├── config/                    # Configuration
│   │   │   ├── database.ts            # Database connection
│   │   │   ├── cloudinary.ts          # Cloudinary setup
│   │   │   ├── env.ts                 # Environment variables
│   │   │   └── upload.ts              # File upload config
│   │   ├── utils/                     # Utilities
│   │   │   └── hash.ts                # Password hashing
│   │   ├── scripts/                   # Utility scripts
│   │   ├── app.ts                     # Express app setup
│   │   └── server.ts                  # Server entry point
│   ├── prisma/                        # Prisma ORM (if used)
│   │   └── schema.prisma
│   ├── migrations/                    # Database migrations
│   ├── package.json                   # Dependencies
│   ├── tsconfig.json                  # TypeScript config
│   └── ... (other backend files)
│
├── Reserve mobile app and admin/      # 🗄️ Archived Code (Not in use)
│   ├── mobile-app/                    # Mobile app code
│   │   ├── capacitor.config.ts        # Capacitor configuration
│   │   ├── ANDROID_BUILD_GUIDE.md     # Build instructions
│   │   ├── ANDROID_SDK_LIGHTWEIGHT_SETUP.md
│   │   ├── BUILD_APK_CLI.md
│   │   └── react-native-app/          # Complete React Native app
│   │       ├── app/                   # Expo Router pages
│   │       ├── assets/                # Mobile assets
│   │       ├── components/            # Mobile components
│   │       ├── src/                   # Mobile source
│   │       └── package.json
│   ├── admin-code/                    # Admin portal code
│   │   ├── frontend/
│   │   │   ├── pages/                 # Admin pages (2 sets)
│   │   │   ├── components/            # Admin components
│   │   │   └── hooks/                 # Admin hooks
│   │   └── backend/
│   │       ├── admin.controller.ts    # Admin controller v1
│   │       ├── adminController.ts     # Admin controller v2 (duplicate)
│   │       ├── admin.routes.ts        # Admin routes v1
│   │       ├── adminRoutes.ts         # Admin routes v2 (duplicate)
│   │       ├── superAdminOnly.ts      # Super admin middleware
│   │       └── seedAdmin.ts           # Admin seeding script
│   ├── README.md                      # Reserve folder documentation
│   └── FILE_INVENTORY.md              # File inventory
│
├── .env                               # Environment variables
├── .gitignore                         # Git ignore rules
├── README.md                          # Main project README
├── CLEANUP_SUMMARY.md                 # Cleanup documentation
└── PROJECT_STRUCTURE.md               # This file

```

## 🔑 Key Points

### Active Code (In Use)
1. **Frontend** (`frontend/`) - Complete React web application for:
   - Customers (browse, book, manage bookings)
   - Vendors (manage business, bookings, menu)
   
2. **Backend** (`backend/`) - Node.js/Express API for:
   - Authentication & authorization
   - Caterer management
   - Booking system
   - Reviews & favorites
   - Image uploads (Cloudinary)
   - Promotions

### Archived Code (Not Active)
1. **Mobile App** - React Native/Expo mobile application
2. **Admin Portal** - Admin dashboard and management (has duplicates)

### User Roles Supported (Active)
- ✅ **Customer** - Browse and book caterers
- ✅ **Vendor** - Manage catering business
- ❌ **Admin** - Code archived (not active)

### Database
- PostgreSQL database
- Located at connection string in `.env`
- Schema managed via migrations

### APIs & Integrations
- Cloudinary (image storage)
- JWT authentication
- Push notifications (Expo)

## 📝 Notes

1. **Backend Duplicates:** Some controller files have two versions (e.g., `auth.controller.ts` and `authController.ts`). These need to be reviewed to determine which is active.

2. **Admin Portal:** All admin code has been moved to the reserve folder. To re-enable:
   - Review duplicate controllers/routes
   - Merge best code
   - Re-integrate into main structure

3. **Mobile App:** A complete React Native app exists in reserve. Different from Capacitor wrapper approach.

4. **Environment Variables:** Make sure `.env` is configured for both frontend and backend.

## 🚀 Getting Started

See `README.md` for installation and setup instructions.

---

**Structure last updated:** September 8, 2026 after major cleanup
