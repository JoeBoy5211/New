# Supabase Infrastructure Overview

Everything in this document describes the **live** Supabase project backing all three frontends (vendor web, customer mobile, admin web).

- **Project ref:** `trgfpdhfiyxezmeobrgs`
- **REST URL:** `https://trgfpdhfiyxezmeobrgs.supabase.co`
- **Auth (GoTrue):** `v2.197.0`
- **Verified:** 2026-09-23, by probing the project with the **anon key** from `vendor/.env` (read-only, no data modified).
- **Credentials:** each app's git-ignored `.env` (see `.env.example` for the variable names). The `service_role` key must never leave the Supabase dashboard.

> ⚠️ **Reading the row counts below:** numbers marked *anon-visible* are what an **unauthenticated** visitor can see. Tables with owner-scoped RLS (`profiles`, `user_roles`, `bookings`, `vendor_payments`, …) always return `0` to anonymous callers even when they contain data — `0` there means *"hidden by RLS"*, not necessarily *"empty"*.

---

## 1. Access model

There is **no custom API server** in the active system. All three apps talk directly to Supabase:

```
 admin/ (Vite:8081)   vendor/ (Vite:8080)   mobile/ (Expo)
        │                    │                   │
        └────────────┬───────┴──────────┬────────┘
                     ▼                  ▼
          Supabase                    Cloudinary
   Auth · Postgres · PostgREST        (primary media storage,
   · Storage · RLS                    URL stored as TEXT in Postgres)
```

- **Data access:** `supabase-js` → PostgREST (`/rest/v1/…`) with typed clients (`admin/src/types/database.ts` is the canonical superset).
- **Authorization:** Postgres **RLS** + helper RPCs (`has_role`, `is_admin`, `is_caterer_owner`, …). The UI hides what it must; the database enforces it.
- **Media:** images upload straight from browser/device to **Cloudinary** (unsigned preset); only HTTPS URLs land in Postgres. Supabase Storage is used for two special cases (§4).
- **Edge Functions:** none — no app references `/functions/v1` or `supabase.functions.invoke`.

---

## 2. Live inventory

| Aspect | Count | Notes |
|---|---|---|
| Tables (schema `public`) | **15** | 12 core + 3 added by later migrations |
| Storage buckets | **2** | `vendor-licences` (private), `home-banners` (public) — see §4 |
| RPCs callable by anon | **5** | see §5.1 |
| Trigger/internal functions | **2–4** | 1 verified working, 1 suspected missing (§12) |
| Edge Functions | **0** | |
| Auth providers enabled | **2** | Email + Google (phone currently **off**, §7) |

### Row counts (as visible to anon)

| Table | Rows | | Table | Rows |
|---|---:|---|---|---:|
| `caterers` | 5 | | `reviews` | 2 |
| `cuisine_categories` | 15 | | `home_banners` | 2 |
| `event_types` | 12 | | `packages` | 1 |
| `subscription_plans` | 3 | | `profiles` * | 0 |
| `menu_items` | 3 | | `user_roles` * | 0 |
| `bookings` * | 0 | | `vendor_payments` * | 0 |
| `vendor_unavailability` | 0 | | `caterer_profile_views` | 0 |
| `caterer_unique_viewers` | 0 | | | |

\* RLS-scoped — anonymous callers always see 0.

---

## 3. Schema

### Entity relationships

```
auth.users (Supabase Auth)
  ├─1:1─ profiles (user_id UNIQUE)
  ├─1:N─ user_roles (user_id, UNIQUE(user_id, role))
  ├─1:N─ caterers (vendor_id)
  ├─1:N─ bookings (customer_id)
  ├─1:N─ reviews (customer_id)
  ├─1:N─ vendor_payments (vendor_id)
  └─1:N─ caterer_profile_views (viewer_id, nullable)

caterers (centre of the model)
  ├─1:N─ menu_items · packages · bookings · reviews
  ├─1:N─ vendor_unavailability · vendor_payments
  ├─1:N─ caterer_profile_views ─┐
  └─1:N─ caterer_unique_viewers ┘  (analytics, cascade delete)

subscription_plans ─1:N─ vendor_payments (plan_id, SET NULL)
reviews ─1:N─ bookings (booking_id, SET NULL)   ← optional link

Lookup tables (joined by name/array in app code, no FKs):
  cuisine_categories · event_types
Admin-managed content:
  home_banners → caterers.link_caterer_id (optional)
```

### 3.1 Identity

**`profiles`** (8 cols) — one display profile per auth user: `id`, `user_id` → `auth.users`, `name`, `email`, `phone`, `avatar_url` (Cloudinary URL), `created_at`, `updated_at`.

**`user_roles`** (4 cols) — drives all authorization: `id`, `user_id`, `role` (`app_role` enum), `created_at`, `UNIQUE(user_id, role)`.

### 3.2 Vendors & catalog

**`caterers`** (41 cols, central entity) — created on vendor registration (`account_status = PENDING`), approved/suspended by admins.

| Group | Columns |
|---|---|
| Identity | `id`, `vendor_id` → `auth.users`, `name`, `description`, `long_description`, `location` |
| Presentation | `cover_image`, `images[]`, `logo_url`, `cuisines[]`, `event_types[]`, `specialties[]`, `service_areas[]` |
| Metrics | `rating`, `review_count`, `view_count`, `unique_view_count`, `years_in_business`, `price_range`, `min_guests`, `max_guests` |
| Contact | `contact_phone`, `contact_email`, `website`, `instagram_url`, `tiktok_url`, `telegram_url` |
| Approval | `account_status` (`PENDING/APPROVED/REJECTED/SUSPENDED`), `is_approved`, `is_pending`, `approved_by`, `approved_at`, **`admin_notes`** (§8 caveat) |
| Subscription | `subscription_status` (`ACTIVE/PAYMENT_DUE/EXPIRED`), `subscription_expires_at`, `is_premium` |
| Geo / media | `latitude`, `longitude`, `licence_path` (Storage path, not URL) |
| Timestamps | `created_at`, `updated_at` |

**`menu_items`** (11 cols) — `id`, `caterer_id` CASCADE, `name`, `description`, `price`, `category`, `image`, `is_popular`, `dietary_info[]`, timestamps.

**`packages`** (12 cols) — `id`, `caterer_id` CASCADE, `name`, `description`, `price`, `min_guests`, `max_guests`, `includes[]`, `images[]`, `is_active`, timestamps. Logically referenced by `bookings.package_ids UUID[]` (no DB FK).

**`vendor_unavailability`** (4 cols) — `PK(caterer_id, blocked_date)`, `reason`, `created_at`. Checked by the mobile booking flow before submit.

### 3.3 Engagement

**`bookings`** (18 cols) — `id`, `customer_id`, `caterer_id`, `event_date`, `event_time`, `event_type`, `guest_count`, `status` (`pending/accepted/declined/completed/cancelled`), `request_status` (`NEW/CONTACTED/NEGOTIATING/CONFIRMED/CANCELLED/COMPLETED`), `special_requests`, `total_amount` (ETB), `menu_selections[]`, `package_ids[]`, `venue`, `contact_phone`, `contact_name`, timestamps.

**`reviews`** (9 cols) — `id`, `customer_id`, `caterer_id`, `booking_id` (nullable), `rating` (1–5), `comment`, `response` (vendor reply), timestamps. A trigger is supposed to mirror `rating`/`review_count` onto `caterers` — see §12.

### 3.4 Billing

**`subscription_plans`** (9 cols) — `id`, `name` UNIQUE, `price`, `currency` (`ETB`), `duration_months`, `grace_days`, `is_active`, timestamps. Admin-managed.

**`vendor_payments`** (17 cols) — `id`, `caterer_id`, `vendor_id`, `plan_id` (SET NULL), `amount`, `currency`, `payment_method` (`CASH/BANK_TRANSFER/TELEBIRR/CHAPA/CARD/OTHER`), `reference_no`, `receipt_url`, `period_start`, `period_end`, `paid_at`, `recorded_by`, `status` (`VERIFIED/VOID/REFUNDED`), `notes`, timestamps. A trigger refreshes the caterer's subscription state.

### 3.5 Config & content

**`cuisine_categories`** (3 cols) — `id`, `name` UNIQUE, `created_at`. Live: 15 rows (American … Vegetarian).

**`event_types`** (3 cols) — `id`, `name` UNIQUE, `created_at`. Live: 12 rows (Anniversary … Wedding).

**`home_banners`** (8 cols, added by `admin/scripts/supabase-home-banners.sql`) — `id`, `image_url`, `title`, `link_caterer_id` (optional deep-link to a caterer), `sort_order`, `is_active`, timestamps. Drives the mobile home carousel (fixed 767A-318 ratio).

### 3.6 Analytics (added by `mobile/scripts/migration/supabase-caterer-profile-views.sql`)

**`caterer_profile_views`** (5 cols) — raw event log: `id`, `caterer_id` CASCADE, `viewer_id` → `auth.users` (nullable for guests), `device_id`, `viewed_at`. Indexed on `(caterer_id, viewed_at DESC)` and on `viewer_id WHERE viewer_id IS NOT NULL`.

**`caterer_unique_viewers`** (3 cols) — dedup ledger, `PK(caterer_id, viewer_key)`: `caterer_id` CASCADE, `viewer_key` (`u:<auth.uid>` for signed-in users, `d:<device_id>` for guests), `first_viewed_at`.

Both feed cached counters on `caterers` (`view_count`, `unique_view_count`) so reads never `COUNT(*)` per page. **There is deliberately no INSERT policy** — writes must go through `track_caterer_view()`.

---

## 4. Storage

| Bucket | Visibility | Objects | Purpose |
|---|---|---:|---|
| `vendor-licences` | **private** (`public = false`) | 0 | Business licence PDFs at `{auth.uid()}/business-licence.pdf`; path stored in `caterers.licence_path`; admins read via signed URLs |
| `home-banners` | **public** (`public = true`) | 1 entry (`banners/` prefix) | Home carousel images uploaded from admin Settings |

**Policies** (from migrations):

- `home-banners` — *anyone* can `SELECT`; only `authenticated` users passing `is_admin()` can `INSERT/UPDATE/DELETE`.
- `vendor-licences` — a vendor can `INSERT/UPDATE/DELETE/SELECT` only inside their own folder (`storage.foldername(name)[1] = auth.uid()`); admins can `SELECT` everything via `is_admin()`.

**⚠️ Gap:** the bucket **`caterer-media` does not exist** (verified: returns the same `NoSuchBucket` as a deliberately fake name). `overview.md` and `vendor/src/lib/media.ts` document it as the *fallback* upload target when Cloudinary fails — that fallback would currently fail too. Either create the bucket or drop the fallback.

Media otherwise lives on **Cloudinary** (folder `catering_app/logos` for logos; the unsigned preset handles covers/menus/packages/avatars) — no Supabase bucket involved.

---

## 5. Functions

### 5.1 RPCs verified live (callable by anon)

| Function | Signature | Returns | Used for |
|---|---|---|---|
| `is_admin()` | `()` | `boolean` | Admin gates + storage policies |
| `is_vendor()` | `()` | `boolean` | Vendor gates |
| `is_customer()` | `()` | `boolean` | Customer gates |
| `has_role` | `(_user_id uuid, _role app_role)` | `boolean` | Role lookup for any user |
| `is_caterer_owner` | `(_caterer_id uuid)` | `boolean` | Row ownership (`caterer_profile_views`, `caterer_unique_viewers` read policies) |

All five returned `200 false` for an anonymous call — existence and permissions confirmed.

### 5.2 Internal functions

| Function | Defined in | Status |
|---|---|---|
| `track_caterer_view(p_caterer_id uuid, p_device_id text default null) → jsonb` | `mobile/scripts/migration/supabase-caterer-profile-views.sql` | ✅ **Working** — `SECURITY DEFINER`, `GRANT EXECUTE TO anon, authenticated`; live counters show 3/3/4 views on three caterers |
| `update_caterer_rating() → trigger` | `mobile/scripts/migration/supabase-review-rating-aggregate.sql` | ❌ **Suspected not installed** — see §12 |
| `update_updated_at_column() → trigger` | *not created by any migration in this repo* | ⚠️ Referenced by the `home_banners` trigger; presumed pre-installed — verify in the SQL editor |
| `handle_new_user()` | legacy migrations (not in this repo) | ❓ Unverifiable via anon; assigns `customer` role on signup |
| `refresh_caterer_subscription()` | legacy migrations (not in this repo) | ❓ Unverifiable via anon; recomputes subscription from `vendor_payments` |

> Trigger functions cannot be probed safely over HTTP (calling them would mutate data), so the last three are marked by evidence rather than direct calls.

### 5.3 Edge Functions

**None.** A repo-wide search finds no `functions/v1` endpoint and no `supabase.functions.invoke(...)` in `admin/`, `vendor/`, or `mobile/`.

---

## 6. Triggers

| Trigger | Table | Fires | Function |
|---|---|---|---|
| `reviews_update_caterer_rating` | `reviews` | `AFTER INSERT/UPDATE/DELETE` | `public.update_caterer_rating()` — mirrors avg rating + count onto `caterers` |
| `update_home_banners_updated_at` | `home_banners` | `BEFORE UPDATE` | `public.update_updated_at_column()` |
| *(documented)* `on_auth_user_created` | `auth.users` | `AFTER INSERT` | `handle_new_user()` → creates `profiles` + `user_roles(customer)` — verify in dashboard |
| *(documented)* `trg_vendor_payments_refresh` | `vendor_payments` | `AFTER INSERT/UPDATE/DELETE` | `refresh_caterer_subscription()` → updates `caterers.subscription_*` — verify in dashboard |

---

## 7. Auth configuration (live from `/auth/v1/settings`)

| Setting | Value |
|---|---|
| Email/password sign-in | ✅ enabled |
| `mailer_autoconfirm` | ✅ `true` — no email confirmation step |
| `disable_signup` | `false` — public sign-up allowed |
| Google OAuth | ✅ enabled |
| **Phone / SMS OTP** | ❌ **disabled** (`external.phone: false`) — but `sms_provider: twilio` **is** configured, and `phone_autoconfirm: false` |
| Anonymous sign-ins | ❌ disabled |
| SAML / passkeys | ❌ disabled |
| All other social providers | ❌ disabled |

> ⚠️ **The mobile app's primary login path is phone OTP** (`PhoneAuthScreen` → `signInWithOtp`). With `external.phone: false` that flow cannot work today — Google sign-in is currently the only working mobile login. See §12.

---

## 8. Row-Level Security

**Enabled** (explicit `ENABLE ROW LEVEL SECURITY` in migrations): `home_banners`, `caterer_profile_views`, `caterer_unique_viewers`, plus storage policies on both buckets.

**Behaviour observed live:** `profiles`, `user_roles`, `bookings`, `vendor_payments` return `0` rows to anon ⇒ RLS is active on the core tables too; `caterers`, `menu_items`, `packages`, `reviews`, lookups and `home_banners` are publicly readable by design.

| Table family | anon | authenticated | vendor | admin |
|---|---|---|---|---|
| Lookups, `caterers` (approved), `menu_items`, `packages`, active `home_banners` | ✅ read | ✅ read | ✅ read | ✅ read |
| `caterer_profile_views`, `caterer_unique_viewers` | ❌ | ❌ | ✅ own caterers | ✅ all |
| `profiles`, `user_roles` | ❌ | own rows | own rows | ✅ |
| `bookings` | ❌ | own | own caterers | ✅ |
| `vendor_payments`, `subscription_plans` | ❌ (plans: read) | ❌/read | own | ✅ write |
| Storage `vendor-licences` | ❌ | own folder only | own folder | ✅ read all |
| Storage `home-banners` | ✅ read | read; write only if `is_admin()` | read | ✅ write |

**Known exposure — `caterers.admin_notes`:** this column is intended as private internal notes (payment verification, admin remarks), but anonymous `SELECT *` on `caterers` **includes the column**. It is only safe today because every value is currently `NULL`. Restrict it (column-level `REVOKE`, or move notes to an admin-only table) before anyone types a note.

---

## 9. Roles & enums

- **Enum `app_role`:** `customer` | `vendor` | `admin` (stored in `user_roles.role`; a user may hold several, priority `admin > vendor > customer`).
- **Status vocabularies** are `TEXT` with app-level checks: `caterers.account_status`, `caterers.subscription_status`, `bookings.status`, `bookings.request_status`, `vendor_payments.status`, `vendor_payments.payment_method`.
- **Currency:** everything is `ETB` (Birr).

---

## 10. Current data state (2026-09-23)

- **5 caterers**, all `APPROVED` + `ACTIVE` — TG Catering (Bahir Dar, premium), Galaxy Catering (Addis Ababa), Test (Addis Ababa), Ethio Catering (Jimma, premium), Addis Catering (Adama). Created 17–23 Sep 2026.
- Lookups fully seeded (15 cuisines, 12 event types), **3 subscription plans**: Monthly 500 / Quarterly 7500 / Yearly 10000 ETB (grace 7/7/14 days).
- Thin catalog: **3 menu items, 1 package, 2 reviews (3★, 4★), 2 home banners**.
- **No bookings, no payments, no blocked dates, no uploaded licences.**
- View analytics working: `view_count` 3/3/4 on the three older caterers, `0` on the two newest.

---

## 11. Migrations index

Run these once per project in the **SQL editor** (or `supabase db push`). All are idempotent.

| File | Adds |
|---|---|
| `admin/scripts/supabase-home-banners.sql` | `home_banners` table + RLS + storage policies + trigger |
| `admin/scripts/supabase-vendor-premium.sql` | `caterers.is_premium` |
| `mobile/scripts/migration/supabase-caterer-profile-views.sql` | `caterer_profile_views`, `caterer_unique_viewers`, `track_caterer_view()`, `caterers.view_count/unique_view_count` |
| `mobile/scripts/migration/supabase-review-rating-aggregate.sql` | `update_caterer_rating()` + `reviews_update_caterer_rating` trigger |
| `mobile/scripts/migration/supabase-vendor-geo.sql` | `caterers.latitude/longitude` |
| `vendor/scripts/migration/supabase-vendor-licence.sql` | `vendor-licences` bucket, `caterers.licence_path`, storage RLS |
| `vendor/scripts/migration/supabase-vendor-logo.sql` | `caterers.logo_url` (Cloudinary-backed) |

---

## 12. Known issues / follow-ups

1. **Rating trigger appears missing** — `reviews` holds a 3★ and a 4★ row, yet all 5 caterers report `rating 0.0` / `review_count 0`. Run `mobile/scripts/migration/supabase-review-rating-aggregate.sql`, then backfill the two existing reviews.
2. **Phone auth disabled while mobile requires it** — `/auth/v1/settings` reports `external.phone: false` even though Twilio is configured. Enable *Authentication → Sign In / Up → Phone*, or the OTP flow in `mobile/` cannot work.
3. **`caterer-media` bucket missing** — the vendor app's Cloudinary fallback target doesn't exist (§4).
4. **`caterers.admin_notes` readable by anon** — currently harmless (all `NULL`), restrict before use (§8).
5. **Pricing sanity** — Quarterly (7500) is 15× Monthly (500); Yearly (10000) is 20× Monthly. Likely a typo; confirm intended values.
6. **True user counts unknown** — anon can't see `profiles`/`user_roles`. For real counts use the dashboard or a one-off `service_role` query (`select count(*) from profiles;` etc.).
7. **Unverified trigger functions** — confirm `handle_new_user()` and `refresh_caterer_subscription()` exist (Dashboard → Database → Functions).

---

## 13. Table usage by app

| Table | Vendor web (`vendor/`) | Mobile (`mobile/`) | Admin (`admin/`) |
|---|---|---|---|
| `profiles` | read own | read/update own, join onto reviews | list customers/admins |
| `user_roles` | register/resolve `vendor` | auto `customer` on signup | gate `admin`, manage admins |
| `caterers` | full CRUD on own row | read approved only | approve / suspend / reject, premium, geo |
| `menu_items`, `packages` | full CRUD | read (active) | — (types only) |
| `bookings` | accept/decline own | create own, read own | read-only oversight |
| `reviews` | reply to own | create/update own | — |
| `vendor_unavailability` | manage | blocked-date check | — |
| `cuisine_categories`, `event_types` | filters | filters | manage vocabularies |
| `subscription_plans`, `vendor_payments` | read own status | — | full CRUD |
| `home_banners` | — | read active | CRUD (Settings) |
| `caterer_profile_views`, `caterer_unique_viewers` | — | write via `track_caterer_view()` | read analytics |
| Storage `vendor-licences` | upload own PDF | — | read all (signed URLs) |
| Storage `home-banners` | — | — | upload/manage |

---

**Related docs:** [`overview.md`](./overview.md) — per-app features, routes, and auth/state model · root [`README.md`](../README.md) — setup and testing guide.
