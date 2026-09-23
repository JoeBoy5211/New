# Mobile `src` architecture

Flat-by-type with a thin data-access layer. Rules:

- `config/` — validated env only (`env.ts`). Never read `process.env` elsewhere.
- `constants/` — `app.ts`, `queryKeys.ts`, `storage.ts`. No magic strings.
- `services/` — pure Supabase calls, no React (`caterers.ts`, `bookings.ts`, `catalog.ts`, `profiles.ts`).
- `hooks/` — thin React Query wrappers over `services/` + `queryKeys`. Re-export domain types for compat.
- `types/domain.ts` — shared models (`Caterer`, `Booking`, …). Single source of truth.
- `lib/` — cross-cutting singletons: `supabase.ts`, `queryClient.ts`, `logger.ts`, `googleAuth.ts`, `format.ts`, `cloudinary.ts`, `onboardingStorage.ts`.
- `context/` — global UI state only (`AuthContext` delegates DB work to `services/profiles`).
- `components/ui.tsx` — generic primitives; `components/mobile/` — domain cards/nav; `components/ErrorBoundary.tsx` — crash boundary.
- `screens/` — 10 route screens, navigation types in `navigation/types.ts`.
- `theme/` — design tokens.

Imports use `@/*` (see `tsconfig.json`). Barrel `index.ts` files allow `@/hooks`, `@/services`, `@/constants`, `@/components`.
