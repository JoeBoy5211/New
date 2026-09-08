import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
  Pressable,
} from 'react-native';
import { LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  icon,
  rightIcon,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(false);

  const bg = isDark ? DARK.inputBg : LIGHT.inputBg;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const border = isDark ? DARK.border : LIGHT.border;
  const tint = isDark ? DARK.tint : LIGHT.tint;
  const errorColor = isDark ? DARK.error : LIGHT.error;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = error
    ? errorColor
    : isFocused
    ? tint
    : border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: isFocused ? tint : subtle }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: bg,
            borderColor,
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          placeholderTextColor={isDark ? DARK.textMuted : LIGHT.textMuted}
          style={[styles.input, { color: text }]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={tint}
          {...props}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hintText, { color: subtle }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs + 2,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: TYPOGRAPHY.base,
    ...Platform.select({
      ios: { paddingVertical: 12 },
      android: { paddingVertical: 8 },
    }),
  },
  iconContainer: {
    marginRight: 10,
    opacity: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 10,
    opacity: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  hintText: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
});
