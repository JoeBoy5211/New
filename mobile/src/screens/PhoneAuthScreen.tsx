import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Phone } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { colors } from "@/theme/colors";
import type { RootScreenProps } from "@/navigation/types";

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </Svg>
  );
}

export default function PhoneAuthScreen({
  navigation,
}: RootScreenProps<"PhoneAuth">) {
  const { sendOtp, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [googleError, setGoogleError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const valid = digits.length >= 10 && digits.length <= 15;

  const handleSend = async () => {
    if (!valid) {
      setError(t("auth.invalidPhone"));
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      const result = await sendOtp(`+${digits}`);
      setBusy(false);
      if (result.success) {
        navigation.navigate("OtpVerify", { phone: `+${digits}` });
      } else {
        setError(result.message);
      }
    } catch {
      setBusy(false);
      setError(t("auth.somethingWrong"));
    }
  };

  const handleGoogle = async () => {
    setGoogleError(undefined);
    setGoogleBusy(true);
    try {
      const result = await signInWithGoogle();
      setGoogleBusy(false);
      // On success the auth-state listener in AuthContext picks up the new
      // session and RootNavigator routes automatically — nothing to do here.
      // A user-cancelled browser flow is silent, not an error.
      if (
        !result.success &&
        result.message !== "Google sign-in was cancelled."
      ) {
        setGoogleError(result.message);
      }
    } catch {
      setGoogleBusy(false);
      setGoogleError(t("auth.googleFail"));
    }
  };

  return (
    <ImageBackground
      source={require("../../ui-designs/4th.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Brand lockup — logo.png + wordmark, like main.png 4th screen */}
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Text style={styles.brand} accessibilityRole="header">
                Caternet
              </Text>
            </View>

            <Text style={styles.title}>{t("auth.welcome")}</Text>
            <Text style={styles.subtitle}>
              {t("auth.signinSub")}
            </Text>

            {/* Google first, matching the 4th-screen order */}
            <Pressable
              onPress={handleGoogle}
              disabled={busy || googleBusy}
              accessibilityRole="button"
              accessibilityLabel={t("auth.googleLabel")}
              style={({ pressed }) => [
                styles.googleBtn,
                (pressed || busy || googleBusy) && styles.pressed,
              ]}
            >
              {googleBusy ? (
                <Text style={styles.googleBtnText}>{t("auth.connecting")}</Text>
              ) : (
                <>
                  <View style={styles.googleIcon}>
                    <GoogleIcon size={20} />
                  </View>
                  <Text style={styles.googleBtnText}>{t("auth.google")}</Text>
                </>
              )}
            </Pressable>
            {googleError ? (
              <Text style={styles.fieldError}>{googleError}</Text>
            ) : null}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("auth.or")}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Phone field styled like the Email/Password fields in the design */}
            <View
              style={[styles.inputWrap, error ? styles.inputWrapError : null]}
            >
              <Phone size={18} color={colors.textMuted} strokeWidth={2} />
              <TextInput
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  setError(undefined);
                }}
                placeholder={t("auth.phonePh")}
                placeholderTextColor={colors.textFaint}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                autoFocus
                returnKeyType="send"
                onSubmitEditing={handleSend}
                style={styles.input}
                accessibilityLabel={t("auth.phoneLabel")}
              />
            </View>
            {error ? <Text style={styles.fieldError}>{error}</Text> : null}

            <Pressable
              onPress={handleSend}
              disabled={(!valid && !busy) || googleBusy}
              accessibilityRole="button"
              accessibilityLabel={t("auth.signinPhone")}
              style={({ pressed }) => [
                styles.cta,
                ((!valid && !busy) || googleBusy) && styles.ctaDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.ctaText}>
                {busy ? t("auth.sending") : t("auth.signin")}
              </Text>
            </Pressable>

            <Text style={styles.hint}>
              {t("auth.smsHint")}
            </Text>

            <Text style={styles.footer}>
              {t("auth.firstTime")}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.white },
  safe: { flex: 1, backgroundColor: "transparent" },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    flexGrow: 1,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 10 },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginTop: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 18,
    marginTop: 24,
  },
  googleIcon: {
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: colors.text },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: colors.textFaint },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputWrapError: { borderColor: colors.danger },
  input: { flex: 1, fontSize: 15, color: colors.text, height: "100%" },
  fieldError: {
    marginTop: 8,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 17,
  },
  cta: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.55 },
  ctaText: { fontSize: 16, fontWeight: "700", color: colors.white },
  pressed: { opacity: 0.8 },
  hint: {
    marginTop: 14,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
});
