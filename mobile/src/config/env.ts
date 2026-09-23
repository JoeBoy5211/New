/**
 * Validated environment access — single source of truth for EXPO_PUBLIC_* vars.
 *
 * IMPORTANT:
 * 1. Access MUST be static (`process.env.EXPO_PUBLIC_FOO`). Expo inlines
 *    env vars at bundle time via Babel, which only rewrites static member
 *    expressions. Dynamic access (`process.env[name]`) is left as-is and is
 *    ALWAYS undefined in release builds (it only works in dev, where Metro
 *    provides a runtime process.env) — that false "missing" is what showed
 *    the config-error screen on every EAS build.
 * 2. This module must NEVER throw at import time. A throw here runs during
 *    JS bundle evaluation, before any ErrorBoundary mounts, so in a release
 *    APK the app just opens and closes with no message.
 *
 * For EAS builds, EXPO_PUBLIC_* vars are inlined at build time — the build
 * profile needs `"environment": "preview"` in eas.json plus the vars set
 * via `eas env:set preview ...`. Don't rely on a local `.env` upload.
 */

function nonEmpty(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

// Static access — required for bundle-time inlining (see note above).
const supabaseUrl = nonEmpty(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = nonEmpty(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const cloudinaryCloudName = nonEmpty(
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
);
const cloudinaryUploadPreset = nonEmpty(
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
);

/** Names of required vars that are missing in this build. Empty = configured. */
export const envMissing: string[] = [
  supabaseUrl ? null : 'EXPO_PUBLIC_SUPABASE_URL',
  supabaseAnonKey ? null : 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
].filter((v): v is string => v !== null);

export function isEnvConfigured(): boolean {
  return envMissing.length === 0;
}

export const env = {
  // Empty-string fallbacks keep module scope crash-free when unconfigured.
  // `App.tsx` blocks rendering (and all Supabase use) via `isEnvConfigured()`.
  supabaseUrl: supabaseUrl ?? '',
  supabaseAnonKey: supabaseAnonKey ?? '',
  cloudinaryCloudName,
  cloudinaryUploadPreset,
} as const;

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryUploadPreset);
}
