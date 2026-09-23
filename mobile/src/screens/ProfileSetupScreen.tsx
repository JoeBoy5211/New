import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button, Screen, TextField } from "@/components/ui";
import { colors, font, radius } from "@/theme/colors";

export default function ProfileSetupScreen() {
  const { profile, user, updateName } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const identifier = profile?.phone ?? user?.email ?? user?.phone ?? "";
  const signedInWith = profile?.phone ? "phone" : "Google";

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(t("setup.errName"));
      return;
    }
    setError(undefined);
    setBusy(true);
    const result = await updateName(trimmed);
    setBusy(false);
    if (result.success) {
      // No manual navigate — RootNavigator hides ProfileSetup once onboarding completes.
    } else {
      setError(result.message);
    }
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
            <Text style={styles.title}>{t("setup.title")}</Text>
            <Text style={styles.subtitle}>
              {signedInWith === "phone"
                ? t("setup.subPhone", { id: identifier })
                : t("setup.subGoogle", { id: identifier ? ` (${identifier})` : "" })}
            </Text>

            <View style={styles.formBox}>
              <TextField
                label={t("setup.nameLabel")}
                placeholder={t("setup.namePh")}
                autoFocus
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError(undefined);
                }}
                error={error}
                containerStyle={{ marginBottom: 0 }}
              />
              <Button
                title={t("setup.continue")}
                onPress={handleSave}
                loading={busy}
                disabled={!name.trim() && !busy}
                style={styles.cta}
              />
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
  cta: { marginTop: 16 },
});
