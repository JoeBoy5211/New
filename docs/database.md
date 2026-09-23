# Catering Marketplace — Database Overview

Single shared **Supabase Postgres** database used by all three frontends (vendor web, client mobile, admin web).

- Project (from `.env.example`): `https://trgfpdhfiyxezmeobrgs.supabase.co`.
- Access pattern: direct **PostgREST** via typed `supabase-js` clients — no custom API server in the active system.
- Canonical type source: `admin/src/types/database.ts` (12 tables, superset of `mobile/src/types/database.ts` and `New-Vendor/frontend/src/types/database.ts`). PostgREST v14.1.
- Auth source: **Supabase Auth** (`auth.users`). `profiles.user_id`, `user_roles.user_id`, `caterers.vendor_id`, `bookings.customer_id`, `reviews.customer_id`, and `vendor_payments.vendor_id` all reference `auth.users.id`.
- Media is **not** stored in Postgres: Cloudinary URLs are stored as `TEXT` (`cover_image`, `images`, `receipt_url`, `avatar_url`). Supabase Storage bucket `caterer-media` is a fallback in the vendor app.
- Favorites are **device-local** in the mobile app (`AsyncStorage`, `src/hooks/useFavorites.ts`) — there is no `favorites` table in Supabase.

## Entity-Relationship Summary

```
auth.users (Supabase Auth)
  ├─1:1─ profiles (user_id UNIQUE)
  ├─1:N─ user_roles (user_id, UNIQUE(user_id, role))
  ├─1:N─ caterers (vendor_id)
  ├─1:N─ bookings (customer_id)
  ├─1:N─ reviews (customer_id)
  └─1:N─ vendor_payments (vendor_id)

caterers (center)
  ├─1:N─ menu_items (caterer_id → caterers.id CASCADE)
  ├─1:N─ packages (caterer_id → caterers.id CASCADE)
  ├─1:N─ bookings (caterer_id → caterers.id CASCADE)
  ├─1:N─ reviews (caterer_id → caterers.id CASCADE)
  ├─1:N─ vendor_unavailability (caterer_id → caterers.id CASCADE, PK(caterer_id, blocked_date))
  └─1:N─ vendor_payments (caterer_id → caterers.id CASCADE)

bookings ─1:N─ reviews (booking_id → bookings.id SET NULL, optional link)
subscription_plans ─1:N─ vendor_payments (plan_id → subscription_plans.id SET NULL)

Lookup (no FKs, referenced by name/array in app code):
  cuisine_categories, event_types
```

| # | Table | Purpose | Primary key | Key relations |
|---|---|---|---|---|
| 1 | `profiles` | Display profile for every auth user | `id` UUID; `user_id` UNIQUE | `user_id → auth.users.id` CASCADE |
| 2 | `user_roles` | Role assignments (`customer`/`vendor`/`admin`) | `id` UUID; `UNIQUE(user_id, role)` | `user_id → auth.users.id` CASCADE |
| 3 | `caterers` | Vendor business (central entity) | `id` UUID | `vendor_id → auth.users.id`; parent of 6 tables |
| 4 | `cuisine_categories` | Cuisine lookup | `id` UUID; `name` UNIQUE | None (joined by name in app) |
| 5 | `event_types` | Event-type lookup | `id` UUID; `name` UNIQUE | None (joined by name in app) |
| 6 | `menu_items` | À-la-carte items per caterer | `id` UUID | `caterer_id → caterers.id` CASCADE |
| 7 | `packages` | Bundled offers per caterer | `id` UUID | `caterer_id → caterers.id` CASCADE; logically referenced by `bookings.package_ids UUID[]` |
| 8 | `bookings` | Booking requests | `id` UUID | `caterer_id → caterers.id` CASCADE; `customer_id → auth.users.id`; parent of `reviews.booking_id` |
| 9 | `reviews` | Ratings + vendor replies | `id` UUID | `caterer_id → caterers.id`; `booking_id → bookings.id SET NULL`; `customer_id → auth.users.id` |
| 10 | `vendor_unavailability` | Blocked dates per caterer | `PK(caterer_id, blocked_date)` | `caterer_id → caterers.id` CASCADE |
| 11 | `subscription_plans` | Billing plans (admin-managed) | `id` UUID; `name` UNIQUE | Parent of `vendor_payments.plan_id` |
| 12 | `vendor_payments` | Subscription payments | `id` UUID | `caterer_id → caterers.id`; `vendor_id → auth.users.id`; `plan_id → subscription_plans.id SET NULL`; `recorded_by → auth.users.id SET NULL` |

---

## 1. `profiles`

One display profile per auth user. Read by all apps (mobile joins `profiles(user_id, name, avatar_url)` onto reviews; admin lists customers from it).

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `user_id` | UUID | UNIQUE, NOT NULL, `→ auth.users.id` CASCADE |
| `name` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL |
| `phone` | TEXT | NULL |
| `avatar_url` | TEXT | NULL (Cloudinary URL) |
| `created_at` | TIMESTAMPTZ | default `now()` |
| `updated_at` | TIMESTAMPTZ | default `now()` |

Relations: `user_id → auth.users.id`. Referenced at app level by `reviews.customer_id` (mobile `services/catalog.ts` joins on `profiles.user_id`).

## 2. `user_roles`

Role membership. A user can hold multiple roles; `UNIQUE(user_id, role)` prevents duplicates. Drives all authorization.

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | NOT NULL, `→ auth.users.id` CASCADE |
| `role` | `app_role` ENUM | `customer` \| `vendor` \| `admin`, default `customer` |
| `created_at` | TIMESTAMPTZ | default `now()` |

Relations: `user_id → auth.users.id`. Checked via RPCs `has_role()`, `is_admin()`, `is_vendor()`, `is_customer()`.

## 3. `caterers` (central)

Vendor business profile. Created on vendor registration (`is_pending:true`), then approved/suspended by admins. Owns catalog, bookings, reviews, availability, and payments.

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `vendor_id` | UUID | NOT NULL, `→ auth.users.id` CASCADE (owner) |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | NULL (short) |
| `long_description` | TEXT | NULL |
| `location` | TEXT | NULL |
| `rating` | NUMERIC(2,1) | default `0`, maintained by review-aggregate trigger (`ROUND(AVG,1)`) |
| `review_count` | INT | default `0`, maintained by trigger |
| `price_range` | TEXT | CHECK `$`, `$$`, `$$$`, `$$$$` |
| `min_guests` / `max_guests` | INT | defaults `1` / `100` |
| `cover_image` | TEXT | NULL (Cloudinary URL) |
| `logo_url` | TEXT | NULL (Cloudinary URL, `catering_app/logos`) |
| `is_premium` | BOOL | default `false` (paid tier; home page lists premium first, A–Z) |
| `latitude` / `longitude` | DOUBLE PRECISION | NULL (WGS 84; drives mobile “Near you” distance sort) |
| `images` | TEXT[] | default `'{}'` (gallery URLs) |
| `cuisines` | TEXT[] | default `'{}'` |
| `event_types` | TEXT[] | default `'{}'` |
| `specialties` | TEXT[] | default `'{}'` |
| `service_areas` | TEXT[] | default `'{}'` |
| `years_in_business` | INT | default `0` |
| `contact_phone` / `contact_email` / `website` | TEXT | NULL |
| `is_approved` | BOOL | default `false` (legacy flag) |
| `is_pending` | BOOL | default `true` (legacy flag) |
| `account_status` | TEXT | `PENDING` \| `APPROVED` \| `REJECTED` \| `SUSPENDED`, default `PENDING` |
| `subscription_status` | TEXT | `ACTIVE` \| `PAYMENT_DUE` \| `EXPIRED`, default `ACTIVE` |
| `subscription_expires_at` | TIMESTAMPTZ | NULL, maintained by payment trigger |
| `admin_notes` | TEXT | NULL (internal) |
| `approved_by` | UUID | NULL, `→ auth.users.id` (admin) |
| `approved_at` | TIMESTAMPTZ | NULL |
| `created_at` / `updated_at` | TIMESTAMPTZ | defaults `now()` |

Variant: vendor/mobile types also carry `instagram_url`, `tiktok_url`, `telegram_url` (NULLABLE TEXT); admin types omit them.

Relations: **parent** of `menu_items`, `packages`, `bookings`, `reviews`, `vendor_unavailability`, `vendor_payments`.

## 4. `cuisine_categories`

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | UNIQUE, NOT NULL |
| `created_at` | TIMESTAMPTZ | default `now()` |

Relations: none (lookup; caterers store cuisine names in `caterers.cuisines TEXT[]`).

## 5. `event_types`

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | UNIQUE, NOT NULL |
| `created_at` | TIMESTAMPTZ | default `now()` |

Relations: none (lookup; bookings store `event_type TEXT`).

## 6. `menu_items`

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `caterer_id` | UUID | NOT NULL, `→ caterers.id` CASCADE |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `price` | NUMERIC(10,2) | NOT NULL |
| `category` | TEXT | NULL |
| `image` | TEXT | NULL (Cloudinary URL) |
| `is_popular` | BOOL | default `false` |
| `dietary_info` | TEXT[] | default `'{}'` |
| `created_at` / `updated_at` | TIMESTAMPTZ | defaults `now()` |

Relations: `menu_items.caterer_id → caterers.id` (`menu_items_caterer_id_fkey`).

## 7. `packages`

Bundled offers (e.g. per-guest packages). Only `is_active` rows are shown publicly.

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `caterer_id` | UUID | NOT NULL, `→ caterers.id` CASCADE |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `price` | NUMERIC(10,2) | default `0` |
| `min_guests` / `max_guests` | INT | defaults `1` / `100` |
| `includes` | TEXT[] | default `'{}'` (line items) |
| `images` | TEXT[] | default `'{}'` |
| `is_active` | BOOL | default `true` |
| `created_at` / `updated_at` | TIMESTAMPTZ | defaults `now()` |

Relations: `packages.caterer_id → caterers.id`; logically referenced by `bookings.package_ids UUID[]` (array of IDs, no DB FK).

## 8. `bookings`

Booking requests from customer to caterer. Dual status columns: legacy `status` (vendor accept/decline) + pipeline `request_status` (admin/mobile workflow).

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `customer_id` | UUID | NOT NULL, `→ auth.users.id` CASCADE |
| `caterer_id` | UUID | NOT NULL, `→ caterers.id` CASCADE |
| `event_date` | DATE | NOT NULL |
| `event_time` | TIME | NULL |
| `event_type` | TEXT | NOT NULL |
| `guest_count` | INT | NOT NULL |
| `status` | TEXT | default `pending`; `pending` \| `accepted` \| `declined` \| `completed` \| `cancelled` |
| `request_status` | TEXT | default `NEW`; `NEW` \| `CONTACTED` \| `NEGOTIATING` \| `CONFIRMED` \| `CANCELLED` \| `COMPLETED` |
| `special_requests` | TEXT | NULL |
| `total_amount` | NUMERIC(10,2) | NULL (Birr) |
| `menu_selections` | TEXT[] | default `'{}'` |
| `package_ids` | UUID[] | default `'{}'` (references `packages.id`, app-level) |
| `venue` | TEXT | NULL |
| `contact_phone` / `contact_name` | TEXT | NULL |
| `created_at` / `updated_at` | TIMESTAMPTZ | defaults `now()` |

Relations: `bookings.caterer_id → caterers.id` (`bookings_caterer_id_fkey`); **parent** of `reviews.booking_id`. Mobile joins `bookings + caterers(id, name, cover_image, location)` for `BookingWithCaterer`.

## 9. `reviews`

Customer ratings, optionally tied to a booking; vendors reply via `response`.

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `customer_id` | UUID | NOT NULL, `→ auth.users.id` CASCADE |
| `caterer_id` | UUID | NOT NULL, `→ caterers.id` CASCADE |
| `booking_id` | UUID | NULL, `→ bookings.id` SET NULL |
| `rating` | INT | NOT NULL, CHECK `1–5` |
| `comment` | TEXT | NULL |
| `response` | TEXT | NULL (vendor reply) |
| `created_at` / `updated_at` | TIMESTAMPTZ | defaults `now()` |

Relations: `reviews.caterer_id → caterers.id`; `reviews.booking_id → bookings.id`. Trigger `update_caterer_rating()` keeps `caterers.rating` / `review_count` in sync.

## 10. `vendor_unavailability`

Blocked calendar dates per caterer; checked by the mobile booking flow before submit.

| Column | Type | Constraints / notes |
|---|---|---|
| `caterer_id` | UUID | `→ caterers.id` CASCADE, part of composite PK |
| `blocked_date` | DATE | NOT NULL, part of composite PK |
| `reason` | TEXT | NULL |
| `created_at` | TIMESTAMPTZ | default `now()` |

Relations: `PK(caterer_id, blocked_date)`; `vendor_unavailability.caterer_id → caterers.id`.

## 11. `subscription_plans`

Admin-managed billing plans (e.g. Monthly / Quarterly / Yearly). Only present in admin types.

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | UNIQUE, NOT NULL |
| `price` | NUMERIC(10,2) | default `0`, CHECK `>= 0` (ETB) |
| `currency` | TEXT | default `ETB` |
| `duration_months` | INT | default `1`, CHECK `> 0` |
| `grace_days` | INT | default `7`, CHECK `>= 0` |
| `is_active` | BOOL | default `true` |
| `created_at` / `updated_at` | TIMESTAMPTZ | defaults `now()` |

Relations: parent of `vendor_payments.plan_id`.

## 12. `vendor_payments`

Subscription payment receipts recorded by admins. A trigger refreshes the caterer's subscription state.

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | PK |
| `caterer_id` | UUID | NOT NULL, `→ caterers.id` CASCADE |
| `vendor_id` | UUID | NOT NULL, `→ auth.users.id` CASCADE |
| `plan_id` | UUID | NULL, `→ subscription_plans.id` SET NULL |
| `amount` | NUMERIC(10,2) | NOT NULL, CHECK `>= 0` |
| `currency` | TEXT | default `ETB` |
| `payment_method` | TEXT | default `BANK_TRANSFER`; `CASH` \| `BANK_TRANSFER` \| `TELEBIRR` \| `CHAPA` \| `CARD` \| `OTHER` |
| `reference_no` | TEXT | NULL |
| `receipt_url` | TEXT | NULL (Cloudinary URL) |
| `period_start` / `period_end` | DATE | NOT NULL, CHECK `period_end > period_start` |
| `paid_at` | TIMESTAMPTZ | default `now()` |
| `recorded_by` | UUID | NULL, `→ auth.users.id` SET NULL (admin) |
| `status` | TEXT | default `VERIFIED`; `VERIFIED` \| `VOID` \| `REFUNDED` |
| `notes` | TEXT | NULL |
| `created_at` / `updated_at` | TIMESTAMPTZ | defaults `now()` |

Relations: `vendor_payments.caterer_id → caterers.id`; `vendor_payments.plan_id → subscription_plans.id`. Trigger `trg_vendor_payments_refresh` → `refresh_caterer_subscription()` updates `caterers.subscription_expires_at` / `subscription_status`.

---

## Enums, Functions & Automation

- **Enum `app_role`**: `customer` | `vendor` | `admin` (used by `user_roles.role`).
- **RPCs** (typed in `database.ts`, enforced via RLS): `has_role(_user_id, _role)`, `is_admin()`, `is_vendor()`, `is_customer()`, `is_caterer_owner(_caterer_id)`.
- **Triggers** (from migrations): `handle_new_user()` (assign `customer` role on signup), `update_caterer_rating()` (recompute `rating`/`review_count`), `refresh_caterer_subscription()` (recompute subscription from payments).

## Table Usage by App

| Table | Vendor web | Mobile | Admin |
|---|---|---|---|
| `profiles` | Read own + customer names | Read/update own, join onto reviews | List customers/admins |
| `user_roles` | Register/resolve `vendor` | Auto `customer` on signup | Gate `admin`, manage admins |
| `caterers` | Full CRUD (own row) | Read approved only | Approve / suspend / reject |
| `menu_items` | Full CRUD | Read | — (types only) |
| `packages` | Full CRUD | Read active | — (types only) |
| `bookings` | Accept/decline own | Create own, read own | Read-only oversight |
| `reviews` | Reply to own | Create/update own | — (types only) |
| `vendor_unavailability` | Manage (via hooks) | Blocked-date check | — |
| `cuisine_categories`, `event_types` | Filters | Filters | Manage categories |
| `subscription_plans`, `vendor_payments` | Read own status | — | Full CRUD |
