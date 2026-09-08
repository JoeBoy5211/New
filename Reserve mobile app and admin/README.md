# Reserved: Mobile App & Admin Code

This folder contains mobile app and admin-related code that has been moved out of the main project structure.

## 📱 Mobile App (`mobile-app/`)

Contains all Android mobile app configuration and build guides:

- `capacitor.config.ts` - Capacitor configuration for mobile app
- `ANDROID_BUILD_GUIDE.md` - Complete guide for building Android app
- `ANDROID_SDK_LIGHTWEIGHT_SETUP.md` - Lightweight Android SDK setup instructions
- `BUILD_APK_CLI.md` - CLI commands for building APK

### Mobile App Features
The mobile app was built using Capacitor to wrap the React web application as a native Android app with features like:
- Push notifications support
- Native splash screen
- Android-specific configurations

## 👔 Admin Code (`admin-code/`)

Contains all admin portal code from both frontend and backend:

### Frontend (`admin-code/frontend/`)
- **Pages:**
  - `pages/admin/Login.tsx` - Admin login page
  - `pages/admin/Dashboard.tsx` - Admin dashboard with full management features

- **Components:**
  - `components/admin/AnalyticsTab.tsx` - Analytics visualization component

- **Hooks:**
  - `hooks/useAdminData.ts` - React hook for admin data management
  - `hooks/useAdmin.ts` - Alternative admin hook (if exists)

### Backend (`admin-code/backend/`)
- `admin.controller.ts` - Admin API controller (version 1)
- `adminController.ts` - Admin API controller (version 2) - DUPLICATE
- `admin.routes.ts` - Admin routes (version 1)
- `adminRoutes.ts` - Admin routes (version 2) - DUPLICATE
- `superAdminOnly.ts` - Middleware for super admin authorization
- `seedAdmin.ts` - Script to seed initial admin user

### Admin Features
The admin portal includes:
- User management (customers, vendors, admins)
- Vendor approval/rejection
- Booking management
- Review moderation
- Analytics dashboard
- System notifications
- Super admin controls

## ⚠️ Important Notes

1. **Duplicates Exist**: There are duplicate controller and route files in the backend admin code. These should be reviewed and merged.

2. **Integration**: If you need to re-integrate this code:
   - The frontend admin code was originally at `frontend/src/pages/admin/`
   - The backend admin code was originally at `backend/src/controllers/` and `backend/src/routes/`
   - Routes were registered in `backend/src/app.ts`

3. **Dependencies**: These files may have dependencies on:
   - Shared components and utilities
   - Database models
   - Authentication middleware
   - API configuration

## 🔄 Next Steps

If you want to use this code:
1. Review and merge duplicate backend files
2. Update import paths as needed
3. Re-integrate into main project structure
4. Test all admin and mobile features

---

**Date Moved**: September 8, 2026
**Reason**: Code reorganization to separate admin and mobile features from main application
