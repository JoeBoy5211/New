import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, font, radius } from '@/theme/colors';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  loading = false,
  disabled,
  variant = 'primary',
  style,
  titleStyle,
}: {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}) {
  const isDisabled = disabled || loading;
  const bg: TextStyle | ViewStyle =
    variant === 'primary'
      ? styles.btnPrimary
      : variant === 'outline'
        ? styles.btnOutline
        : variant === 'danger'
          ? styles.btnDanger
          : styles.btnGhost;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        bg,
        isDisabled && styles.btnDisabled,
        (pressed || isDisabled) && styles.btnPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'outline' || variant === 'ghost' ? styles.btnTextDark : styles.btnTextLight,
            titleStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  containerStyle,
  ...props
}: TextInputProps & { label?: string; error?: string; containerStyle?: ViewStyle }) {
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.btnPressed]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loadingBox}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: font.small, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: font.body,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: font.caption, marginTop: 4 },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  btnGhost: { backgroundColor: colors.primarySoft },
  btnDanger: { backgroundColor: colors.danger },
  btnDisabled: { opacity: 0.55 },
  btnPressed: { opacity: 0.8 },
  btnText: { fontSize: font.body, fontWeight: '700' },
  btnTextLight: { color: colors.white },
  btnTextDark: { color: colors.primaryDark },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.small, color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: '700' },
  sectionHeader: { marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  sectionHint: { fontSize: font.caption, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: font.subtitle, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: font.small, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingLabel: { marginTop: 10, color: colors.textMuted, fontSize: font.small },
});