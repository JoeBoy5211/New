import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { envMissing, isEnvConfigured } from "@/config/env";
import {
  getHasSeenOnboarding,
  setHasSeenOnboarding,
} from "@/lib/onboardingStorage";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { colors } from "@/theme/colors";
import { APP_SCHEME, AUTH_CALLBACK_PATH } from "@/constants/app";
import type { RootStackParamList } from "@/navigation/types";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { createSessionFromUrl } from "@/lib/googleAuth";
import OnboardingScreen from "@/screens/OnboardingScreen";
import PhoneAuthScreen from "@/screens/PhoneAuthScreen";
import OtpVerifyScreen from "@/screens/OtpVerifyScreen";
import ProfileSetupScreen from "@/screens/ProfileSetupScreen";
import CatererDetailScreen from "@/screens/CatererDetailScreen";
import CatererPackagesScreen from "@/screens/CatererPackagesScreen";
import BookingRequestScreen from "@/screens/BookingRequestScreen";
import BookingDetailsScreen from "@/screens/BookingDetailsScreen";
import MainTabs from "@/navigation/MainTabs";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [Linking.createURL("/"), `${APP_SCHEME}://`, "exp://"],
  config: {
    screens: {
      // NOTE: auth/callback is handled manually via createSessionFromUrl
      // (see AuthRedirectHandler below), not via a navigation screen, so it
      // is intentionally absent here. Adding `AuthCallback: "auth/callback"`
      // without a matching screen makes React Navigation drop the link.
      MainTabs: {
        screens: {
          Explore: "home",
          Search: "search",
          MyBookings: "bookings",
          Profile: "account",
        },
      },
      CatererDetail: "caterer/:id",
      CatererPackages: "caterer-packages/:catererId",
      BookingRequest: "booking/:catererId",
      BookingDetails: "booking-details/:bookingId",
    },
  } as never,
};

// Required for web: closes the auth popup and returns its redirect URL.
// No-op on Android/iOS.
WebBrowser.maybeCompleteAuthSession();

function RootNavigator() {
  const { session, isLoading, needsOnboarding } = useAuth();
  const [hasSeen, setHasSeen] = useState<boolean | null>(null);

  useEffect(() => {
    getHasSeenOnboarding().then(setHasSeen);
  }, []);

  // Once logged in, never show the marketing onboarding again — persist
  // the flag so it stays hidden even after logout / restart.
  useEffect(() => {
    if (session) {
      setHasSeen(true);
      void setHasSeenOnboarding();
    }
  }, [session]);

  if (isLoading || hasSeen === null) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashBrand}>Caternet</Text>
        <ActivityIndicator
          color={colors.primary}
          size="large"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const authenticated = !!session;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {authenticated ? (
        <>
          {needsOnboarding && (
            <Stack.Screen
              name="ProfileSetup"
              component={ProfileSetupScreen}
              options={{ headerShown: false }}
            />
          )}
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CatererDetail"
            component={CatererDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CatererPackages"
            component={CatererPackagesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BookingRequest"
            component={BookingRequestScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BookingDetails"
            component={BookingDetailsScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          {!hasSeen && (
            <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onCompleted={() => setHasSeen(true)}
                />
              )}
            </Stack.Screen>
          )}
          <Stack.Screen
            name="PhoneAuth"
            component={PhoneAuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OtpVerify"
            component={OtpVerifyScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Fallback for OAuth redirects that bypass openAuthSessionAsync's return
// value (e.g. Android delivers the deep link via a cold start while the
// Custom Tab reports {"type":"dismiss"}). Without this, a successful Google
// sign-in can leave the user stuck on the login page.
function AuthRedirectHandler() {
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes(AUTH_CALLBACK_PATH)) return;
      try {
        await createSessionFromUrl(url);
      } catch {
        // AuthContext's onAuthStateChange picks up the session on success;
        // failures surface via the next sign-in attempt. Swallow here to
        // avoid an unhandled rejection on every unrelated deep link.
      }
    };
    void Linking.getInitialURL().then((url) => void handleUrl(url));
    const sub = Linking.addEventListener("url", ({ url }) =>
      void handleUrl(url),
    );
    return () => sub.remove();
  }, []);
  return null;
}

export default function App() {
  // Misconfigured build (EXPO_PUBLIC_* not inlined at EAS build time):
  // show a readable screen instead of instantly closing with no message.
  if (!isEnvConfigured()) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <Text style={styles.splashBrand}>Caternet</Text>
          <Text style={styles.configTitle}>App is missing configuration</Text>
          <Text style={styles.configSub}>
            These values were not included in this build:{"\n"}
            {envMissing.join(", ")}
            {"\n\n"}Set them as EAS project environment variables and rebuild.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
          <AuthProvider>
            <NavigationContainer linking={linking as never}>
              <AuthRedirectHandler />
              <RootNavigator />
              <StatusBar style="dark" />
            </NavigationContainer>
          </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  splashBrand: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 4,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 24,
  },
  configSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
