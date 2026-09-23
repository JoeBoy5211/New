# Caternet — Catering Marketplace

A three-frontend marketplace that connects **customers**, **catering vendors**, and **platform admins** through one shared backend.

- **Customers** discover caterers, send booking requests, and leave reviews — from a native mobile app.
- **Vendors** run their business day-to-day: profile, menu catalog, packages, bookings, availability, and review replies — from a web portal.
- **Admins** operate the platform: approve or suspend vendors, oversee bookings, record subscription payments, and manage users and admins — from a back-office console.

All three apps talk directly to the **same Supabase project** (Auth + Postgres + PostgREST). There is no custom REST API in the active system. Image uploads go straight from the browser/device to **Cloudinary**, and only the resulting URLs are stored in the database. Currency throughout is **Birr (ETB)**.

---

## Architecture

```
 ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
 │  Vendor Web App    │   │ Customer Mobile App│   │   Admin Web App    │
 │     vendor/        │   │      mobile/       │   │      admin/        │
 │  Vite · React 18   │   │  Expo · React Native│  │  Vite · React 18   │
 │  port 8080         │   │  Metro (8081)      │   │  port 8081         │
 └─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘
           │                        │                        │
           └───────────────┬────────┴────────┬───────────────┘
                           ▼                 ▼
                  ┌─────────────────┐  ┌──────────────────┐
                  │    Supabase     │  │   Cloudinary     │
                  │ Auth · Postgres │  │ unsigned uploads │
                  │ PostgREST · RLS │  │ (URL stored in   │
                  │   + Storage     │  │      the DB)     │
                  └─────────────────┘  └──────────────────┘
```

Authorization is role-based via the `user_roles` table (`customer` · `vendor` · `admin`), enforced by Postgres RLS and helper RPCs (`has_role()`, `is_admin()`, `is_vendor()`, …).

---

## Repository layout

| Path | What it is | Stack | Dev port |
|---|---|---|---|
| `admin/` | **Caternet Admin** — back-office console | React 18, Vite, TypeScript, Tailwind + shadcn/ui, React Query | `8081` |
| `vendor/` | **Vendor Web** — public marketplace storefront *and* vendor portal | React 18, Vite, TypeScript, Tailwind + shadcn/ui, React Query, Vitest | `8080` |
| `mobile/` | **Caternet** — customer-facing native app | Expo SDK 57, React Native 0.86, React Navigation, React Query | Metro `8081` |
| `docs/` | Platform documentation — `overview.md` (system) and `database.md` (schema) | — | — |
| `old-codebase/` | **Legacy** — old Express/MySQL backend and archived apps. *Not part of the active system.* | Express, Prisma, MySQL | — |

> `old-codebase/vendors-legacy/` is intentionally excluded from version control (see the root `.gitignore`).

---

## Prerequisites

- **Node.js 18+** and npm
- A **Supabase** project (shared by all three apps) — credentials live in each app's `.env`
- A **Cloudinary** account with an **unsigned upload preset** (image uploads)
- For mobile testing: the **Expo Go** app on your phone, or an Android/iOS simulator
- For mobile phone-OTP login: **Phone auth enabled + an SMS provider (e.g. Twilio)** configured in Supabase → *Authentication → Sign In / Up → Phone*

---

## Getting started

Each app is self-contained: install, configure, run.

### 1. Configure environment (once per app)

```sh
cd vendor && cp .env.example .env
cd ../admin && cp .env.example .env
cd ../mobile && cp .env.example .env
```

Then fill in the values. `.env` files are **git-ignored** — only `.env.example` templates are committed.

| App | File | Variables |
|---|---|---|
| `vendor/` | `vendor/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`), `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` |
| `admin/` | `admin/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` |
| `mobile/` | `mobile/.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` |

> All three point at the **same** Supabase project — see `vendor/.env.example` for the shared project reference.

### 2. Vendor web app — `vendor/`

```sh
cd vendor
npm install
npm run dev          # http://localhost:8080
```

Other scripts: `npm test` (Vitest), `npm run test:watch`, `npm run typecheck`, `npm run build`, `npm run lint`.

### 3. Admin console — `admin/`

```sh
cd admin
npm install
npm run dev          # http://localhost:8081
```

Other scripts: `npm run build` (type-check + build), `npm run lint`, `npm run preview`.

### 4. Mobile app — `mobile/`

```sh
cd mobile
npm install
npm start            # Metro → scan the QR code with Expo Go
npm run android      # Android emulator
npm run ios          # iOS simulator (macOS only)
npm run web          # run in a browser
```

Other scripts: `npm run typecheck`.

> ⚠️ **Port conflict:** Metro defaults to `8081`, which is also the admin console's port. If you run both at once, start Expo on another port: `npx expo start --port 8082`.

---

## Testing the platform

### Suggested end-to-end walkthrough

Running the three apps together exercises the whole marketplace:

| # | App | Action |
|---|---|---|
| 1 | **Admin** (`:8081`) | Sign in as an admin (see below) |
| 2 | **Vendor** (`:8080`) | Go to `/vendor/login` and register a new catering business |
| 3 | **Admin** | Open **Vendors** → the new signup is *Pending* → **Approve** it |
| 4 | **Mobile** | Sign in, open **Explore**, tap the approved caterer, send a **booking request** |
| 5 | **Vendor** | In the dashboard **Bookings** tab, **accept** the request |
| 6 | **Mobile** | In **My Bookings**, leave a **review** (1–5★) — the aggregate trigger updates the caterer's rating |
| 7 | **Admin** | Review the booking under **Bookings**, record a subscription payment under **Payments** |

You can also exercise it entirely on the web: the vendor app has public routes (`/`, `/caterers`, `/caterer/:id`, `/caterer/:id/book`) and a customer area (`/my-bookings`), so no mobile device is strictly required.

### Testing the Admin console (`admin/`)

```sh
cd admin && npm run dev     # http://localhost:8081/login
```

**Getting an admin account.** Only users holding the `admin` row in `public.user_roles` can sign in — the app signs non-admins right back out. Two ways to create one:

1. **Script (recommended):** `admin/scripts/reset-admin-password.mjs` sets a user's password, ensures the `admin` role, and creates the profile row. The user must already exist (create it in *Supabase → Authentication → Users*).

   ```sh
   cd admin
   node scripts/reset-admin-password.mjs <email> "<new-password>"
   ```

   > The script needs a Supabase **`service_role`** key, which bypasses RLS. Keep it out of version control — pass it via an environment variable or a local, git-ignored file, and rotate it if it has ever been committed.

2. **SQL:** insert the role row yourself in the Supabase SQL editor:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = '<your-email>'
   on conflict (user_id, role) do nothing;
   ```

**Routes to exercise:**

| Route | What to test |
|---|---|
| `/` | Dashboard KPIs — vendors, pending approvals, customers, revenue; growth and status charts |
| `/vendors` | **Core workflow** — tabs for all / pending / approved / suspended, search, approve · suspend · reject, cover upload, per-vendor payments (`/caterers` redirects here) |
| `/vendors/:id` | Vendor detail — contacts, images, internal `admin_notes` |
| `/bookings` | Read-only oversight filtered by status, searchable by vendor / customer / venue |
| `/analytics` | Platform analytics views |
| `/payments` | Record / void / refund subscription payments, manage `subscription_plans`, receipt links |
| `/users` | Customers (profiles without vendor/admin roles) and their engagement |
| `/admins` | Create / remove admins, password resets |
| `/settings` | Platform settings — home banner management |

**Tip:** create a *pending* vendor via the vendor app first — it gives you something real to approve.

### Testing the Vendor portal (`vendor/`)

```sh
cd vendor && npm run dev    # http://localhost:8080
```

**No pre-existing account needed** — registration creates everything:

1. Visit **`/vendor/login`** and register with a business name, cuisine, and location. This creates the `user_roles(vendor)` row and a `caterers` record with `is_pending: true`.
2. You land on **`/vendor/pending`**, an approval waiting room that polls every 15s.
3. Approve the vendor from the **Admin console** → *Vendors*.
4. You are then in **`/vendor/dashboard`**, tabbed via `?tab=`:

| Tab | What to test |
|---|---|
| `overview` | KPI cards + revenue area chart |
| `bookings` | Accept / decline incoming booking requests |
| `menu` | Full menu-item CRUD — `/vendor/menu/new`, `/vendor/menu/:id/edit`, photo upload (Cloudinary) |
| `packages` | Package CRUD — `/vendor/packages/new`, `/vendor/packages/:id/edit` |
| `reviews` | Reply to customer reviews |
| `profile` | Edit business profile, logo and licence uploads |

**Public/customer side (no login required for browsing):**

| Route | What to test |
|---|---|
| `/` | Marketplace landing — premium vendors listed first |
| `/caterers` | Browse / search approved caterers |
| `/caterer/:id` | Profile + menu items + active packages + reviews |
| `/caterer/:id/book` | Booking request form |
| `/login` → `/my-bookings` | Customer sign-in and "my bookings" list |

Vendor sign-in is **email/password**; roles resolve from `user_roles` with priority `admin > vendor > customer`.

### Testing the Mobile app (`mobile/`)

```sh
cd mobile && npm start      # scan the QR code with Expo Go
```

**Prerequisites for login:** phone OTP needs an SMS provider configured in Supabase (otherwise no code is ever sent). If SMS isn't set up, configure the **Google** provider instead — both paths are supported.

| Flow | What to test |
|---|---|
| `Onboarding` → `PhoneAuth` / **Continue with Google** → `OtpVerify` → `ProfileSetup` | Sign-up and sign-in; a DB trigger assigns the `customer` role and a starter profile |
| `Explore` | Approved caterers, cuisine tiles, favorites (stored **device-locally**) |
| `Search` | Text + cuisine / max price / min rating / location / sort filters |
| `CatererDetail` | Tabs: **Menu · Gallery · Reviews · Contact**; share, social links, review modal |
| `CatererPackages` | Expandable package cards |
| `BookingRequest` | 12 event types, 09:00–21:00 slots, blocked-date check, Birr totals |
| `MyBookings` | Own bookings, newest first; create / update reviews |
| `Profile` | Edit name, avatar upload (image-picker → Cloudinary → `profiles.avatar_url`), sign out |

Deep links work too: `caternet://`, plus `exp://…/auth/callback` while testing in Expo Go.

> Google sign-in is a one-time dashboard setup (Google Cloud OAuth client → Supabase *Providers → Google* → add `caternet://auth/callback` to *Redirect URLs*). Full steps are in [`mobile/README.md`](./mobile/README.md).

---

## Database

A single shared Supabase Postgres database backs all three apps — 12 tables (`profiles`, `user_roles`, `caterers`, `cuisine_categories`, `event_types`, `menu_items`, `packages`, `bookings`, `reviews`, `vendor_unavailability`, `subscription_plans`, `vendor_payments`).

**Full reference: [`docs/database.md`](./docs/database.md)** — column-by-column tables, ER summary, enums, RPCs, and triggers.

Migrations ship as standalone SQL files to run in the Supabase SQL editor (only needed when standing up a fresh project):

| File | Adds |
|---|---|
| `admin/scripts/supabase-home-banners.sql` | Home banner management |
| `admin/scripts/supabase-vendor-premium.sql` | Premium (paid-tier) vendor flag |
| `mobile/scripts/migration/supabase-caterer-profile-views.sql` | Caterer profile view tracking |
| `mobile/scripts/migration/supabase-review-rating-aggregate.sql` | Rating / review-count trigger |
| `mobile/scripts/migration/supabase-vendor-geo.sql` | Vendor latitude / longitude |
| `vendor/scripts/migration/supabase-vendor-licence.sql` | Vendor licence uploads |
| `vendor/scripts/migration/supabase-vendor-logo.sql` | Vendor logo uploads |

Canonical TypeScript types: **`admin/src/types/database.ts`** (the superset); the other apps carry narrower copies.

---

## Tests & code quality

```sh
cd vendor
npm test             # Vitest + Testing Library (jsdom)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint

cd ../admin
npm run build        # includes tsc --noEmit
npm run lint

cd ../mobile
npm run typecheck    # tsc --noEmit
```

---

## Deployment

Both web apps are SPAs and ship a Vercel config that rewrites all routes to `index.html`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Deploy `vendor/` and `admin/` as **separate** Vercel projects (set the same env vars in each). The mobile app builds with EAS (`eas.json`).

---

## Documentation map

| Document | Contents |
|---|---|
| [`docs/overview.md`](./docs/overview.md) | System-wide overview — tech matrix, folder structure, routes, and auth/state model for every app |
| [`docs/database.md`](./docs/database.md) | Schema, ER diagram, triggers, RPCs, table-usage matrix |
| [`admin/README.md`](./admin/README.md) | Admin-specific notes |
| [`mobile/README.md`](./mobile/README.md) | Mobile setup, auth flow, Google sign-in setup, screen list |

---

## Security notes

- **Never commit secrets.** `.env` is git-ignored in every app; only `.env.example` templates are tracked. The Supabase **anon/publishable** key is safe for the client — the **`service_role`** key and Cloudinary **secret** key are not, and must stay server-side or local-only.
- Row-level security is the real enforcement layer: the apps rely on `user_roles` + RLS, not on hidden UI.
- Found a committed credential? Rotate it at the provider first, then scrub it from history.
