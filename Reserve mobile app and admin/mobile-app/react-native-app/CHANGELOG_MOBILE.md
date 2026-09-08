# Mobile App Development Changelog

### Connected to Backend [2026-03-20]
- **API Synchronization:** Connected Mobile to Backend API on port 3000.
- **Home Screen:** Replaced placeholder caterers with real data from `GET /api/caterers`.
- **Feed Screen:** Connected `GET /api/promotions` to the TikTok-style discovery feed.
- **Profile Screen:** Integrated `useAuth` to display real user data (name, email, avatar).
- **Bug Fixes:** Resolved TypeScript routing errors and package version mismatches (@shopify/flash-list).

## [2026-03-20] - Mobile Architecture & Core Features

### Added
- **API Client & Auth:** Established `src/api/client.ts` using Axios with interceptors for `Expo SecureStore` JWT handling.
- **Navigation:** Implemented `expo-router` with a Tab-based layout (Home, Feed, Profile) and native stack for nested screens.
- **Vertical Feed:** Built a TikTok-style discovery feed using `@shopify/flash-list` for high-performance media rendering.
- **Caterer Profile & Booking:** Created a mobile-native profile view with an integrated `gorhom/bottom-sheet` booking flow.

### Architectural Decisions
- **Secure Storage over LocalStorage:** Switched to `expo-secure-store` for JWT persistence to meet mobile security standards.
- **Bottom Sheets for UX:** Used Bottom Sheets for the booking flow instead of full-page navigation or web-style modals to allow users to maintain context while selecting menu items.
- **FlashList for Performance:** Opted for `FlashList` over `FlatList` for the Promotions Feed to ensure 60FPS scrolling with heavy image/video content.
- **Axios Interceptors:** Centralized auth logic in interceptors to handle 401s and token injection automatically, reducing boilerplate in hooks.
