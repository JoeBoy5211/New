# Caternet — Mobile Client (React Native / Expo)

The customer-facing mobile app. Clients sign up / log in with their **phone
number + SMS OTP** or with **Google**, then browse approved catering companies
and view their details, menus, and reviews.

## Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/go) on your phone (or an Android/iOS simulator)
- The Supabase project must have **Phone auth enabled** and an **SMS provider
  (Twilio) configured** in `Authentication → Sign In / Up → Phone` — otherwise
  OTPs cannot be sent.

## Setup

```sh
cd mobile
npm install
cp .env.example .env   # then fill in your Supabase project credentials
```

`.env` already contains the shared Caternet Supabase credentials.

## Run

```sh
npm start          # start Metro, then scan the QR code with Expo Go
npm run android    # launch on Android emulator
npm run ios        # launch on iOS simulator (macOS only)
```

## Auth flow

1. **PhoneAuth** — user enters their phone number (with country code), or taps
   **Continue with Google**.
   - Phone: `supabase.auth.signInWithOtp({ phone })` sends a 6-digit SMS code.
     For a brand-new number, `shouldCreateUser` auto-creates the account — the
     existing DB trigger assigns the `customer` role and a starter profile.
   - Google: `supabase.auth.signInWithOAuth({ provider: 'google', ... })`
     opens a system browser (`expo-web-browser`) and returns to the app via
     deep link (`caternet://auth/callback`, see `src/lib/googleAuth.ts`). Works
     in Expo Go and dev builds — no native Google SDK / SHA-1 setup needed.
2. **OtpVerify** — (phone only) user enters the code;
   `verifyOtp({ phone, token, type: 'sms' })` completes the sign-in and
   persists the session in AsyncStorage.
3. **ProfileSetup** — first-time users (phone placeholder name, or Google
   users with no usable name) are asked for their name.

## Google sign-in setup (one-time, Supabase dashboard)

Phone OTP keeps working as before. For the Google button to work:

1. **Google Cloud console** ([console.cloud.google.com/auth/clients](https://console.cloud.google.com/auth/clients)):
   create an OAuth client ID of type **Web application** and add your
   Supabase project's callback URL under **Authorized redirect URIs**
   (find it on the Supabase Dashboard → Authentication → Providers → Google).
   Enable the `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
   scopes.
2. **Supabase Dashboard → Authentication → Providers → Google**: enable the
   provider and paste the Client ID + Client Secret.
3. **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:
   add the app's redirect URIs:
   - `caternet://auth/callback` (dev / production builds — matches `scheme` in `app.json`)
   - `exp://**` (only needed while testing in Expo Go)
4. No extra `.env` variables are needed — the redirect URI is derived from
   the app scheme via `expo-auth-session`'s `makeRedirectUri()`.

## Screens

| Screen          | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| `PhoneAuth`     | Phone number entry → request OTP                            |
| `OtpVerify`     | 6-digit code entry → signed in                              |
| `ProfileSetup`  | One-time name capture for new accounts                      |
| `Explore`       | Search + filter approved caterers, list with images/ratings |
| `CatererDetail` | Gallery, about, stats, menu items, reviews                  |
| `Profile`       | View profile, member since, sign out                        |

## Key libraries

`@supabase/supabase-js` · `@react-native-async-storage/async-storage` (session
persistence) · `react-native-url-polyfill` (required by supabase-js) ·
`expo-auth-session` + `expo-crypto` + `expo-web-browser` + `expo-linking`
(Supabase Google OAuth + deep-link redirect) ·
`@react-navigation/native` + native-stack · `@tanstack/react-query` ·
`expo-status-bar` · `react-native-safe-area-context`.
