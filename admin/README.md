# Caternet Admin Console

Vite + React + TypeScript admin dashboard for the Caternet directory platform.
Shares the same Supabase backend as the vendor web app and mobile client.

Logic: vendors sign up, admin reviews them (manual payment is handled off-system
and recorded in `admin_notes`), then approves. Approved vendors go live in the
mobile app where users browse company info/images/contacts and connect directly.
No bookings or payments are processed in-system.

## Commands

```sh
npm install        # install dependencies
npm run dev        # start dev server (http://localhost:8081)
npm run build      # type-check + production build -> dist/
npm run preview    # preview the production build
```

## Configuration

`.env` already contains the shared Supabase project credentials. Copy
`.env.example` and fill in your values if you point this at a different project.

```env
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-public-key>"
```

Apply DB migrations from `../vendors/supabase/migrations/`, including
`20260203090000_vendor_contacts.sql` (adds `contact_phone, contact_email,
website, admin_notes` to `caterers`).

## Login

Only users holding the `admin` role in `public.user_roles` can sign in.

**Quickest way:** open `../vendors/supabase/create_admin.sql`, set your
email + password, and run it in the Supabase SQL editor.

## Pages

| Route       | Purpose                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `/`         | Directory overview (totals, pending approvals, recent vendors)                                                    |
| `/vendors`  | Review vendor signups; confirm manual payment; approve/suspend; view contacts/images (`/caterers` redirects here) |
| `/users`    | Vendor signup accounts + app users; manage `customer` / `vendor` / `admin` roles                                  |
| `/settings` | Manage `cuisine_categories` and `event_types` vocabularies                                                        |

## Notes

- No bookings, reviews, or menu management here by design — directory only.
- Vendor contact fields (`contact_phone, contact_email, website`) are public on
  approved listings so mobile users can connect directly.
- `admin_notes` is private and used to record manual payment verification.
- Icons: `lucide-react` · Styling: Tailwind + shadcn/ui.
