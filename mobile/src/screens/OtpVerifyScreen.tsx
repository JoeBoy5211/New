import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button, Screen } from "@/components/ui";
import { colors, font, radius } from "@/theme/colors";
import type { RootScreenProps } from "@/navigation/types";

const RESEND_COOLDOWN = 30;

export default function OtpVerifyScreen({
  route,
}: RootScreenProps<"OtpVerify">) {
  const { phone } = route.params;
  const { verifyOtp, sendOtp } = useAuth();
  const { t } = useLanguage();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timerRef.current) clearInterval(timerRef.current);
        return c <= 0 ? 0 : c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const digits = token.replace(/\D/g, "");
  const valid = digits.length === 6;

  const handleVerify = async () => {
    if (!valid) {
      setError(t("otp.errLength"));
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      const result = await verifyOtp(phone, digits);
      setBusy(false);
      if (result.success) {
        // No manual navigate — RootNavigator switches to MainTabs once session exists.
      } else {
        setError(result.message);
      }
    } catch {
      setBusy(false);
      setError(t("otp.errVerify"));
    }
  };

  const handleResend = async () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timerRef.current) clearInterval(timerRef.current);
        return c <= 0 ? 0 : c - 1;
      });
    }, 1000);
    setError(undefined);
    setToken("");
    await sendOtp(phone);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.brand}>Caternet</Text>
            <Text style={styles.title}>{t("otp.title")}</Text>
            <Text style={styles.subtitle}>
              {t("otp.sub", { phone })}
            </Text>

            <View style={styles.formBox}>
              <Text style={styles.otpLabel}>{t("otp.label")}</Text>
              <TextInput
                value={token}
                onChangeText={(t) => {
                  setToken(t);
                  setError(undefined);
                }}
                placeholder="______"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={[styles.otpInput, error ? styles.otpInputError : null]}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                title={t("otp.verify")}
                onPress={handleVerify}
                loading={busy}
                disabled={!valid && !busy}
                style={styles.cta}
              />

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>
                  {t("otp.noCode")}{" "}
                  {cooldown > 0 ? (
                    <Text style={styles.resendMuted}>
                      {t("otp.resendIn", { s: cooldown })}
                    </Text>
                  ) : (
                    <Text style={styles.resendLink} onPress={handleResend}>
                      {t("otp.resend")}
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    flexGrow: 1,
  },
  brand: {
    fontSize: font.caption,
    fontWeight: "800",
    letterSpacing: 3,
    color: colors.primaryDark,
  },
  title: { fontSize: 34, fontWeight: "800", color: colors.text, marginTop: 8 },
  subtitle: {
    fontSize: font.body,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 22,
  },
  formBox: {
    marginTop: 32,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  otpLabel: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  otpInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 10,
    textAlign: "center",
    color: colors.text,
  },
  otpInputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: font.caption, marginTop: 8 },
  cta: { marginTop: 18 },
  resendRow: { marginTop: 18, alignItems: "center" },
  resendText: { fontSize: font.small, color: colors.textMuted },
  resendLink: { color: colors.primary, fontWeight: "700" },
  resendMuted: { color: colors.textMuted },
});
