/** App-wide constants — avoids magic strings scattered in screens/components. */

export const APP_SCHEME = "caternet";
export const AUTH_CALLBACK_PATH = "auth/callback";

export const CUISINES = [
  "All",
  "Ethiopian",
  "Italian",
  "Indian",
  "Chinese",
  "Mexican",
] as const;

export type Cuisine = (typeof CUISINES)[number];

export const DEFAULT_LOCATION = "Addis Ababa";
export const FALLBACK_RATING = 4.8;
export const FALLBACK_REVIEW_COUNT = 324;
export const FALLBACK_STARTING_PRICE = 320;

/** How "new" a user must be to skip straight to ProfileSetup (ms). */
export const NEW_USER_WINDOW_MS = 5 * 60 * 1000;
