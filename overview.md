# Catering Marketplace — System Overview

A three-frontend catering marketplace connecting **customers (clients)**, **vendors (caterers)**, and **platform admins** through one shared backend.

- **Customers** discover caterers, request bookings, and leave reviews.
- **Vendors** manage their business profile, menu catalog, packages, bookings, availability, and reviews.
- **Admins** approve/suspend vendors, monitor bookings, manage subscription payments/plans, users, and admins.

All three apps talk directly to the **same Supabase project** — there is no custom REST API in the active system. Media uploads go directly to **Cloudinary (unsigned)** from browser/device, with URLs stored in Supabase.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Vendor Web App   │     │ Client Mobile App│     │ Admin Web App    │
│ New-Vendor/      │     │ mobile/          │     │ admin/           │
│ frontend/        │     │ (Expo)           │     │ (Vite)           │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         └────────────┬───────────┴───────────┬────────────┘
                      ▼                       ▼
            ┌─────────────────┐     ┌──────────────────┐
            │ Supabase Postgres│     │ Cloudinary       │
            │ Auth + PostgREST │     │ (images only,    │
            │ + Storage        │     │ URL in DB)       │
            └─────────────────┘     └──────────────────┘
```

Shared Supabase project (from `.env.example` files): `https://trgfpdhfiyxezmeobrgs.supabase.co`.
Canonical DB types: `admin/src/types/database.ts` (12 tables, superset). See `database.md`.

> Note on legacy folders (not part of the active system): `New-Vendor/backend/` (old Express + MySQL `catering_db`), `vendors-legacy/`, and `New-Vendor/Reserve mobile app and admin/` are historical and are **not** used by the three apps below.

---

## 1. Vendor App — `New-Vendor/frontend/`

Dual-purpose web app: public marketplace storefront **+** authenticated vendor portal. This is where vendors run their business day-to-day.

### 1.1 Technology

| Layer          | Technology                                                                                                                                     | Source                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Framework      | React 18.3.1, TypeScript 5.8.3, Vite 5.4.19 (`@vitejs/plugin-react-swc`)                                                                       | `package.json`, `vite.config.ts`, `tsconfig.app.json`         |
| Routing        | `react-router-dom` 6.30.1                                                                                                                      | `src/App.tsx`                                                 |
| UI             | Tailwind CSS 3.4.17, shadcn/ui (`slate`, CSS vars), full Radix UI set, `lucide-react`, `embla-carousel`, `vaul`, `sonner`                      | `tailwind.config.ts`, `components.json`, `src/components/ui/` |
| Forms          | `react-hook-form` 7.61.1 + `zod` 3.25.76 + `@hookform/resolvers`                                                                               | `src/pages/vendor/Login.tsx`                                  |
| Data           | `@tanstack/react-query` 5.83.0 (stale 5m, gc 10m, no refetch-on-focus), React Context (auth only)                                              | `src/App.tsx`, `src/hooks/supabase/`                          |
| Charts / dates | `recharts` 2.15.4, `date-fns` 3.6.0, `react-day-picker` 8.10.1                                                                                 | `src/pages/vendor/Dashboard.tsx`                              |
| Backend        | `@supabase/supabase-js` 2.116.0 only (no axios/REST)                                                                                           | `src/integrations/supabase/client.ts`                         |
| Media          | Cloudinary unsigned browser upload + Supabase Storage `caterer-media` fallback                                                                 | `src/lib/cloudinary.ts`, `src/lib/media.ts`                   |
| Tests / deploy | `vitest` 3.2.4 + jsdom, ESLint 9, Vercel SPA rewrite                                                                                           | `vitest.config.ts`, `vercel.json`                             |
| Dev server     | `vite` port `8080`, `@` → `./src`                                                                                                              | `vite.config.ts`                                              |
| Env            | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` | `.env.example`                                                |

### 1.2 Structure (`src/`)

- `App.tsx`, `main.tsx` — router + `QueryClientProvider` + `AuthProvider`.
- `pages/`: `Home.tsx`, `BrowseCaterers.tsx`, `CatererProfile.tsx`, `BookingForm.tsx`, `MyBookings.tsx`, `Login.tsx`, `NotFound.tsx`.
- `pages/vendor/`: `Dashboard.tsx` (tabbed via `?tab=`), `Login.tsx`, `Pending.tsx`, `MenuItemForm.tsx`, `PackageForm.tsx`.
- `components/layout/`: `Navbar.tsx`, `MainLayout.tsx`, `Footer.tsx`; `components/vendor/`: `portal.tsx` (`VendorLayout`, KPI cards), `menu-catalog.tsx`, `package-catalog.tsx`; `ProtectedRoute.tsx`, `CatererCard.tsx`.
- `components/ui/` — ~45 shadcn primitives.
- `context/AuthContext.tsx` — session, profile, role.
- `hooks/supabase/`: `useCaterers.ts`, `usePublicCaterers.ts`, `useMenuItems.ts`, `usePackages.ts`, `useBookings.ts`, `useReviews.ts`.
- `integrations/supabase/client.ts` — singleton Supabase client.
- `types/database.ts` — generated DB types.
- `lib/`: `cloudinary.ts`, `media.ts`, `social.ts`, `utils.ts`.

### 1.3 Features & routes (`src/App.tsx`)

Public:

- `/` — Home / marketplace landing.
- `/caterers` — browse/search approved caterers.
- `/caterer/:id` — caterer detail (profile + menu items + active packages + reviews).
- `/caterer/:id/book` — booking request form.
- `/login` — customer login.

Customer (protected, `customer|vendor|admin`):

- `/my-bookings` — own bookings with caterer join.

Vendor (protected, `vendor`):

- `/vendor/login` — vendor sign-in / register (business name, cuisine, location).
- `/vendor/pending` — approval waiting room (polls every 15s).
- `/vendor/dashboard` — tabs: `overview | bookings | menu | packages | reviews | profile`; KPIs + revenue `AreaChart`; accept/decline bookings; reply to reviews; edit profile.
- `/vendor/menu/new`, `/vendor/menu/:itemId/edit` — menu item CRUD.
- `/vendor/packages/new`, `/vendor/packages/:packageId/edit` — package CRUD.

### 1.4 Auth & state

- Supabase Auth email/password (`signInWithPassword` / `signUp` / `signOut`, `onAuthStateChange`, localStorage persist) in `context/AuthContext.tsx`.
- Role resolution from `user_roles` with priority `admin > vendor > customer`; profile from `profiles` (`user_id`).
- Registration creates `user_roles` + `caterers(is_approved:false, is_pending:true)`; `ensureVendorSetup()` self-heals missing rows.
- `ProtectedRoute.tsx` enforces roles; vendor approval gating lives in the pages, not the guard.
- Server state only via React Query per-entity hooks; no Redux/Zustand.

---

## 2. Client App — `mobile/` (Caternet)

Customer-facing native app for discovering caterers and managing bookings. Expo managed workflow, portrait-only, light theme.

### 2.1 Technology

| Layer        | Technology                                                                                                                                                                                                    | Source                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Runtime      | Expo SDK 57.0.18, React 19.2.3, React Native 0.86.3, TypeScript 6.0.3 (`strict:true`, `@/*` → `./src/*`)                                                                                                      | `package.json`, `tsconfig.json`, `app.json` |
| Navigation   | `@react-navigation/native` 7.3.18, `native-stack` 7.18.10, `bottom-tabs` 7.19.1                                                                                                                               | `App.tsx`, `src/navigation/`                |
| Data         | `@tanstack/react-query` 5.102.8 (stale 60s, gc 5m), React Context (auth only)                                                                                                                                 | `src/lib/queryClient.ts`                    |
| Backend      | `@supabase/supabase-js` 2.112.4 (AsyncStorage session, `react-native-url-polyfill`)                                                                                                                           | `src/lib/supabase.ts`                       |
| Auth helpers | `expo-auth-session`, `expo-web-browser`, `expo-crypto`, `expo-linking` (Google OAuth + deep links)                                                                                                            | `src/lib/googleAuth.ts`, `App.tsx`          |
| Device       | `@react-native-async-storage/async-storage` (session/favorites/onboarding), `expo-image-picker` (avatar), `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `lucide-react-native` | `package.json`, `app.json`                  |
| Identity     | `name:Caternet`, `slug:Caternet`, `scheme:Caternet`, `com.Caternet.client` (iOS + Android), v1.0.0                                                                                                            | `app.json`                                  |
| Env          | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`                                                                      | `.env.example`, `src/config/env.ts`         |

### 2.2 Structure (`src/`)

- `config/` — validated env only; `constants/` — scheme, query keys, storage keys; `theme/colors.ts` — brand tokens.
- `lib/` — `supabase.ts`, `queryClient.ts`, `googleAuth.ts`, `cloudinary.ts`, `format.ts`, `social.ts`, `onboardingStorage.ts`.
- `services/` — pure Supabase queries (no React): `caterers.ts`, `catalog.ts`, `bookings.ts`, `profiles.ts`.
- `hooks/` — React Query wrappers: `useCaterers.ts`, `useMenuItems.ts`, `usePackages.ts`, `useBookings.ts`, `useReviews.ts`, `useUnavailability.ts`, `useFavorites.ts` (local-only).
- `context/AuthContext.tsx` — session/user/profile/onboarding only.
- `navigation/types.ts`, `MainTabs.tsx` — typed routes + bottom tabs.
- `screens/` (11): `OnboardingScreen`, `PhoneAuthScreen`, `OtpVerifyScreen`, `ProfileSetupScreen`, `ExploreScreen`, `SearchScreen`, `CatererDetailScreen`, `CatererPackagesScreen`, `BookingRequestScreen`, `MyBookingsScreen`, `ProfileScreen`.
- `types/domain.ts` — domain models; `types/database.ts` — generated Supabase types.

### 2.3 Features & navigation (`App.tsx`)

Deep links: `Caternet://`, `exp://` → `auth/callback`, `home/search/bookings/account`, `caterer/:id`, `caterer-packages/:catererId`, `booking/:catererId`.

Unauthenticated: `Onboarding` (marketing carousel) → `PhoneAuth` (phone + Google) → `OtpVerify` (6-digit SMS).

Authenticated (`MainTabs` bottom tabs + stack):

- `Explore` — approved caterers, cuisine tiles, favorites.
- `Search` — text + cuisine / max price / min rating / location / sort filters; cheapest-price probe per caterer.
- `CatererDetail` — tabs `Menu | Gallery | Reviews | Contact`; share, socials, review modal.
- `CatererPackages` — expandable package cards.
- `BookingRequest` — 12 event types, 09:00–21:00 slots, blocked-date check, Birr totals.
- `MyBookings` — own bookings (newest first), create/update reviews.
- `Profile` — view/edit name, avatar upload (`image-picker` → Cloudinary → `profiles.avatar_url`), logout.

### 2.4 Auth & state

- Supabase only: phone OTP (`signInWithOtp` + `verifyOtp`, SMS) and Google OAuth (`signInWithOAuth` → `openAuthSessionAsync` → `exchangeCodeForSession`/`setSession`).
- DB trigger assigns `customer` role on signup; `needsOnboarding` = missing/short name.
- React Query for server state; `AuthContext` for session only; favorites are **device-local** (`AsyncStorage`, no `favorites` table).

---

## 3. Admin App — `admin/` (Caternet Admin)

Internal back-office for platform operators. Strictly admin-gated; handles vendor lifecycle, bookings oversight, subscription revenue, users, and admin accounts.

### 3.1 Technology

| Layer      | Technology                                                                                                                                      | Source                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Framework  | React 18.3.1, TypeScript 5.8.3, Vite 5.4.19 (`@vitejs/plugin-react-swc`)                                                                        | `package.json`, `vite.config.ts`                              |
| Routing    | `react-router-dom` 6.30.1                                                                                                                       | `src/App.tsx`                                                 |
| UI         | Tailwind CSS 3.4.17, shadcn/ui (`slate`, CSS vars), full Radix set, `lucide-react`, `recharts` 2.15.4, `sonner`, `date-fns`, `react-day-picker` | `tailwind.config.ts`, `components.json`, `src/components/ui/` |
| Forms      | `react-hook-form` 7.61.1 + `zod` 3.25.76 + `@hookform/resolvers`                                                                                | `package.json`                                                |
| Data       | `@tanstack/react-query` 5.83.0, React Context (auth only)                                                                                       | `src/App.tsx`, `src/hooks/`                                   |
| Backend    | `@supabase/supabase-js` 2.93.3 (direct PostgREST, no REST wrapper)                                                                              | `src/lib/supabase.ts`                                         |
| Media      | Cloudinary unsigned browser upload                                                                                                              | `src/lib/cloudinary.ts`                                       |
| Dev server | port `8081`, `@` → `./src`                                                                                                                      | `vite.config.ts`                                              |
| Env        | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`                                    | `.env.example`                                                |

### 3.2 Structure (`src/`)

- `App.tsx`, `main.tsx` — `QueryClientProvider` + `AuthProvider` + `AdminRoute` guard.
- `pages/` (9): `Dashboard.tsx`, `Caterers.tsx` (vendors), `Bookings.tsx`, `Payments.tsx`, `Users.tsx`, `Admins.tsx`, `Settings.tsx` (placeholder), `Login.tsx`, `NotFound.tsx`.
- `components/`: `AdminLayout.tsx` (collapsible sidebar, pending badge, breadcrumbs), `StatCard.tsx`, `PageHeader.tsx`, `RecordPaymentDialog.tsx`; `components/ui/` — ~49 shadcn files.
- `context/AuthContext.tsx` — admin session only.
- `hooks/`: `useCaterers.ts`, `useBookings.ts`, `usePayments.ts`, `useProfiles.ts`, `useCategories.ts`, `useAdmins.ts`.
- `lib/`: `supabase.ts`, `cloudinary.ts`, `utils.ts`; `types/database.ts` — canonical generated types.

### 3.3 Features & routes (`src/App.tsx`)

All routes except `/login` require `isAdmin` (`AdminRoute` → spinner → redirect).

| Route                                   | Page            | Purpose                                                                                                                                                                                                    |
| --------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`                                | `Login.tsx`     | Email + password → admin session                                                                                                                                                                           |
| `/`                                     | `Dashboard.tsx` | KPIs (vendors, pending, customers, revenue), growth/status charts, recent + top vendors                                                                                                                    |
| `/vendors` (`/caterers` redirects here) | `Caterers.tsx`  | Core workflow: tabs all/pending/approved/suspended, search, approve / suspend / reject (`is_approved`, `is_pending`, `account_status`, `approved_at/by`, `admin_notes`), cover upload, per-vendor payments |
| `/bookings`                             | `Bookings.tsx`  | Read-only oversight by `request_status`/`status`, search vendor/customer/venue                                                                                                                             |
| `/payments`                             | `Payments.tsx`  | Record / void / refund payments (updates `subscription_status`), `subscription_plans` CRUD, receipt links                                                                                                  |
| `/users`                                | `Users.tsx`     | Customers (profiles minus vendor/admin roles), engagement via bookings                                                                                                                                     |
| `/admins`                               | `Admins.tsx`    | List/create/remove admins, password resets (isolated anon client so session is untouched)                                                                                                                  |
| `/settings`                             | `Settings.tsx`  | Placeholder (“Coming soon”)                                                                                                                                                                                |

### 3.4 Auth & state

- Supabase email/password; after sign-in the app checks `user_roles(role=admin)` and immediately signs out non-admins.
- No Redux/Zustand; React Query + Context + local state; toasts via shadcn `toaster`; sidebar state in `localStorage`.

---

## 4. Cross-Cutting Comparison

| Concern      | Vendor web (`New-Vendor/frontend`) | Client mobile (`mobile`)          | Admin web (`admin`)         |
| ------------ | ---------------------------------- | --------------------------------- | --------------------------- |
| Platform     | Web SPA (Vite, port 8080)          | Native (Expo, iOS/Android/web)    | Web SPA (Vite, port 8081)   |
| React        | 18.3.1                             | 19.2.3                            | 18.3.1                      |
| Router       | `react-router-dom` 6               | React Navigation 7 (stack + tabs) | `react-router-dom` 6        |
| UI system    | Tailwind + shadcn/Radix            | Native primitives + theme tokens  | Tailwind + shadcn/Radix     |
| Auth method  | Email/password                     | Phone OTP + Google OAuth          | Email/password (admin-only) |
| Server state | React Query                        | React Query                       | React Query                 |
| Backend SDK  | `supabase-js` 2.116.0              | `supabase-js` 2.112.4             | `supabase-js` 2.93.3        |
| Media        | Cloudinary + Storage fallback      | Cloudinary                        | Cloudinary                  |
| Roles used   | `vendor` (+ public, `customer`)    | `customer`                        | `admin`                     |

Shared conventions: direct Supabase PostgREST (no BFF), typed clients (`Database`), per-entity Query hooks with cache invalidation, Cloudinary URLs stored as plain text in Postgres, Birr (`ETB`) currency formatting.
