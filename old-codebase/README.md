# CaterConnect - Catering Marketplace Platform

A comprehensive catering marketplace connecting customers with professional caterers for events and special occasions.

## 🎯 Project Overview

CaterConnect is a full-stack web application that enables customers to browse, compare, and book catering services while providing vendors with tools to manage their business and showcase their offerings.

### Key Features

**For Customers:**
- Browse and search caterers by cuisine, location, and price range
- View detailed caterer profiles with menus, services, and reviews
- Book catering services with customizable guest counts and event details
- Save favorite caterers
- View and manage bookings
- Leave reviews and ratings
- Browse promotional offers

**For Vendors:**
- Create and manage business profiles
- Upload menus with items, pricing, and photos
- Manage bookings and customer requests
- Set availability schedules
- Respond to reviews
- Track business analytics
- Manage additional services offered

## 🏗️ Project Structure

```
.
├── frontend/           # React frontend application (all user interfaces)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── customer/      # Customer dashboard
│   │   │   └── vendor/        # Vendor portal
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities and API client
│   └── package.json
│
├── backend/            # Node.js/Express backend API
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Authentication & authorization
│   │   ├── services/         # Business logic
│   │   └── config/           # Configuration files
│   └── package.json
│
└── Reserve mobile app and admin/   # Reserved code (not in active use)
    ├── mobile-app/              # Android mobile app files
    └── admin-code/              # Admin portal code
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your database and API credentials
   
   # Run database migrations
   npm run migrate
   
   # Start backend server
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your API URL
   
   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173 (or port shown in terminal)
   - Backend API: http://localhost:3000

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **TanStack Query** - Data fetching and caching
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Radix UI** - Headless UI components
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **date-fns** - Date utilities
- **Recharts** - Analytics charts

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma** - ORM (if configured)
- **Cloudinary** - Image storage
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens

## 📁 Key Directories

### Frontend
- `frontend/src/pages/` - All page components
  - `customer/` - Customer dashboard
  - `vendor/` - Vendor portal pages
  - Root level files - Public pages (home, browse, login, etc.)
- `frontend/src/components/` - Reusable components
  - `ui/` - shadcn/ui components
  - `vendor/` - Vendor-specific components
  - `layout/` - Layout components
- `frontend/src/hooks/` - Custom React hooks for data fetching
- `frontend/src/lib/` - API client and utilities

### Backend
- `backend/src/controllers/` - Business logic and request handlers
- `backend/src/routes/` - API endpoint definitions
- `backend/src/middleware/` - Auth, validation, rate limiting
- `backend/src/services/` - Email, push notifications
- `backend/src/config/` - Database, Cloudinary, environment

## 🔐 Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

### Backend (.env)
```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/caterconnect
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests (if configured)
cd backend
npm run test
```

## 📱 Mobile App & Admin Portal

Mobile app and admin portal code have been moved to the `Reserve mobile app and admin/` folder for future reference. See the README in that folder for details.

## 🚢 Deployment

### Frontend
The frontend can be deployed to:
- Vercel (recommended)
- Netlify
- Any static hosting service

```bash
cd frontend
npm run build
# Deploy the 'dist' folder
```

### Backend
The backend can be deployed to:
- Railway
- Heroku
- DigitalOcean
- AWS/GCP/Azure

Ensure environment variables are configured in your hosting platform.

## 📝 API Documentation

The backend exposes RESTful APIs:

- `/api/auth/*` - Authentication endpoints
- `/api/caterers/*` - Caterer listings and profiles
- `/api/bookings/*` - Booking management
- `/api/reviews/*` - Review system
- `/api/favorites/*` - Favorites management
- `/api/vendors/*` - Vendor portal endpoints
- `/api/promotions/*` - Promotional offers

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For issues or questions, please open an issue in the repository or contact the development team.

---

**Last Updated**: September 8, 2026
