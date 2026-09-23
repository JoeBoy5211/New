# File Inventory

Complete list of all files moved to this reserve folder.

## Mobile App Files

### Configuration & Documentation
```
mobile-app/
├── capacitor.config.ts
├── ANDROID_BUILD_GUIDE.md
├── ANDROID_SDK_LIGHTWEIGHT_SETUP.md
└── BUILD_APK_CLI.md
```

**Original Locations:**
- `capacitor.config.ts` → Root directory
- `ANDROID_BUILD_GUIDE.md` → Root directory
- `ANDROID_SDK_LIGHTWEIGHT_SETUP.md` → Root directory
- `BUILD_APK_CLI.md` → Root directory

---

## Admin Frontend Files

```
admin-code/frontend/
├── pages/
│   └── admin/
│       ├── Login.tsx
│       └── Dashboard.tsx
├── components/
│   └── admin/
│       └── AnalyticsTab.tsx
└── hooks/
    ├── useAdminData.ts
    └── useAdmin.ts (if exists)
```

**Original Locations:**
- Admin pages → `frontend/src/pages/admin/`
- Admin components → `frontend/src/components/admin/`
- Admin hooks → `frontend/src/hooks/useAdminData.ts` and `src/hooks/useAdmin.ts`

---

## Admin Backend Files

```
admin-code/backend/
├── admin.controller.ts
├── adminController.ts (DUPLICATE)
├── admin.routes.ts
├── adminRoutes.ts (DUPLICATE)
├── superAdminOnly.ts
└── seedAdmin.ts
```

**Original Locations:**
- Controllers → `backend/src/controllers/`
- Routes → `backend/src/routes/`
- Middleware → `backend/src/middleware/superAdminOnly.ts`
- Scripts → `backend/src/scripts/seedAdmin.ts`

---

## Files Still in Main Project

The following files were **NOT** moved but may reference admin code:

### Frontend
- `frontend/src/App.tsx` - Contains admin routes
- `frontend/src/context/AuthContext.tsx` - Handles admin authentication

### Backend
- `backend/src/app.ts` - Registers admin routes
- `backend/src/middleware/authorize.ts` - Contains admin role checks
- Database schema files with admin tables

### To Remove Admin from Main App
If you want to completely remove admin functionality from the main app:
1. Remove admin routes from `frontend/src/App.tsx`
2. Remove admin route registration from `backend/src/app.ts`
3. Update `ProtectedRoute` component if needed
4. Remove admin role checks from middleware

---

## Package Dependencies

### Frontend Dependencies (for admin features)
- `@tanstack/react-query` - Data fetching
- `recharts` - Analytics charts
- All shadcn/ui components

### Backend Dependencies (for admin features)
- Express route handlers
- Database access (via config/database.ts)
- Authentication middleware

---

**Total Files Moved:** 15+ files
**Date:** September 8, 2026
