import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { AUTH_CALLBACK_PATH, APP_SCHEME } from "@/constants/app";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// Deep-link URI the OAuth provider redirects back to after sign-in.
// makeRedirectUri handles Expo Go vs standalone automatically:
// - Expo Go (LAN):   exp://192.168.x.x:8081/--/auth/callback
// - Expo Go (tunnel): exp://... or https://auth.expo.io/@user/slug
// - Dev/prod build:  caternet://auth/callback  (matches `scheme` in app.json)
// Scheme MUST be lowercase per Expo SDK v57 app config validation
// (`^[a-z][a-z0-9+.-]*$`). Uppercase (e.g. `Caternet://`) never matches the
// Android intent-filter and yields WebBrowser {"type":"dismiss"}.
// ALL of these MUST be allow-listed under Supabase Dashboard →
// Authentication → URL Configuration → Additional Redirect URLs.
export function getGoogleRedirectUri(): string {
  // preferLocalhost:false ensures LAN IP, not localhost, when in Expo Go LAN mode
  // (localhost would fail on physical device -> ERR_CONNECTION_REFUSED you saw)
  return makeRedirectUri({
    scheme: APP_SCHEME,
    path: AUTH_CALLBACK_PATH,
    preferLocalhost: false,
  });
}

// Handles the redirect URL Supabase sends the user back to.
// Supabase may put params in query (?code=) or fragment (#access_token).
// QueryParams.getQueryParams only parses query, so we parse hash manually as fallback.
export async function createSessionFromUrl(url: string) {
  logger.debug("[GoogleAuth] createSessionFromUrl input", url);
  // Try expo-auth-session parser (query)
  const parsed = QueryParams.getQueryParams(url);
  let params: Record<string, string> = (parsed.params ?? {}) as Record<
    string,
    string
  >;
  const errorCode = parsed.errorCode;

  if (errorCode) throw new Error(String(errorCode));

  // Fallback: also parse hash fragment (#access_token=..., #code=...)
  // e.g. exp://...#access_token=xxx&refresh_token=yyy
  const hashIndex = url.indexOf("#");
  if (hashIndex !== -1) {
    const hash = url.slice(hashIndex + 1);
    const hashParams = Object.fromEntries(new URLSearchParams(hash));
    params = { ...hashParams, ...params };
  }
  // Also merge query after ? if getQueryParams missed something
  const qIndex = url.indexOf("?");
  if (qIndex !== -1) {
    const end = hashIndex !== -1 ? hashIndex : url.length;
    const query = url.slice(qIndex + 1, end);
    const queryParams = Object.fromEntries(new URLSearchParams(query));
    params = { ...queryParams, ...params };
  }

  logger.debug("[GoogleAuth] parsed params keys", Object.keys(params));

  if (typeof params.code === "string" && params.code.length > 0) {
    logger.debug("[GoogleAuth] exchanging code...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      params.code,
    );
    if (error) {
      logger.error("[GoogleAuth] exchangeCodeForSession error", error);
      throw error;
    }
    return data.session;
  }

  const access_token =
    typeof params.access_token === "string" ? params.access_token : undefined;
  const refresh_token =
    typeof params.refresh_token === "string" ? params.refresh_token : undefined;

  if (!access_token) {
    logger.debug(
      "[GoogleAuth] no code or access_token in URL, params:",
      params,
    );
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? "",
  });
  if (error) {
    logger.error("[GoogleAuth] setSession error", error);
    throw error;
  }
  return data.session;
}

// Full Supabase Google OAuth flow for Expo (works in Expo Go and dev builds):
// 1. Ask Supabase for the provider URL (skipBrowserRedirect so WE open it).
// 2. Open it in a system auth session that can redirect back into the app.
// 3. Exchange the redirect params for a Supabase session (persisted via AsyncStorage).
export async function performGoogleOAuth(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const redirectTo = getGoogleRedirectUri();
    logger.debug("[GoogleAuth] redirectTo =", redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      logger.warn("[GoogleAuth] signInWithOAuth error", error);
      return { success: false, message: error.message };
    }
    if (!data?.url)
      return { success: false, message: "Could not start Google sign-in." };
    logger.debug("[GoogleAuth] authUrl =", data.url.slice(0, 120) + "...");

    // 30s timeout: if WebBrowser never returns (wrong redirect URL allow-list),
    // show actionable error instead of infinite spinner.
    const authPromise = WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Google sign-in timed out after 30s. Check Supabase → Auth → URL Configuration → Additional Redirect URLs must contain: caternet://auth/callback, exp://** and that your phone/laptop are on same Wi-Fi (or use `npx expo start --tunnel`). Current redirectTo: " +
                redirectTo,
            ),
          ),
        30000,
      ),
    );

    let result: WebBrowser.WebBrowserAuthSessionResult;
    try {
      result = (await Promise.race([
        authPromise,
        timeoutPromise,
      ])) as WebBrowser.WebBrowserAuthSessionResult;
    } catch (timeoutErr) {
      logger.warn("[GoogleAuth] timeout", timeoutErr);
      return {
        success: false,
        message:
          timeoutErr instanceof Error
            ? timeoutErr.message
            : "Timed out waiting for redirect.",
      };
    }

    logger.debug("[GoogleAuth] WebBrowser result", result);
    if (result.type === "cancel" || result.type === "dismiss") {
      return { success: false, message: "Google sign-in was cancelled." };
    }
    if (result.type !== "success") {
      return {
        success: false,
        message: "Google sign-in did not complete. Please try again.",
      };
    }

    logger.debug("[GoogleAuth] result.url", result.url);
    const session = await createSessionFromUrl(result.url);
    logger.debug("[GoogleAuth] session", !!session);
    if (!session)
      return {
        success: false,
        message:
          "Could not complete Google sign-in. Check Supabase logs → Auth.",
      };

    return { success: true, message: "You are signed in with Google." };
  } catch (e) {
    logger.error("[GoogleAuth] catch", e);
    return {
      success: false,
      message:
        e instanceof Error
          ? e.message
          : "Google sign-in failed. Please try again.",
    };
  }
}
