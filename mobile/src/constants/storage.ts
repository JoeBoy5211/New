/** AsyncStorage keys — single source of truth (was hardcoded in 2+ places). */

export const STORAGE_KEYS = {
  favorites: "@Caternet_favorites_v1",
  // Bumped to v3 for the redesigned onboarding — previous testers see it once more.
  hasSeenOnboarding: "@Caternet_has_seen_onboarding_v5",
  deviceId: "@Caternet_device_id_v1",
  customerLocation: "@Caternet_customer_location_v1",
  language: "@Caternet_language_v1",
} as const;
