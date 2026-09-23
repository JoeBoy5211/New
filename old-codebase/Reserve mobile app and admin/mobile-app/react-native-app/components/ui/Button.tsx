import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
  Animated,
  View,
} from 'react-native';
import { BRAND, LIGHT, DARK, RADIUS } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconRight,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const tint = isDark ? DARK.tint : LIGHT.tint;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: tint,
          shadowColor: BRAND.burgundy,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? DARK.tintLight : LIGHT.tintLight,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: tint,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return {
          backgroundColor: isDark ? DARK.error : LIGHT.error,
          shadowColor: '#DC2626',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 6,
        };
      default:
        return { backgroundColor: tint };
    }
  };

  const getTextColor = (): string => {
    if (disabled || isLoading) return variant === 'outline' || variant === 'ghost' ? tint : 'rgba(255,255,255,0.6)';
    switch (variant) {
      case 'secondary': return isDark ? DARK.text : LIGHT.text;
      case 'outline':
      case 'ghost': return tint;
      default: return '#FFFFFF';
    }
  };

  const sizeMap = {
    sm: { height: 40, paddingHorizontal: 16, fontSize: 14, radius: RADIUS.sm },
    md: { height: 52, paddingHorizontal: 24, fontSize: 16, radius: RADIUS.md },
    lg: { height: 58, paddingHorizontal: 32, fontSize: 17, radius: RADIUS.lg },
  };
  const sz = sizeMap[size];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        style={[
          styles.base,
          {
            height: sz.height,
            paddingHorizontal: sz.paddingHorizontal,
            borderRadius: sz.radius,
            opacity: disabled ? 0.45 : 1,
          },
          getContainerStyle(),
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <>
            {icon && <View style={styles.iconLeft}>{icon}</View>}
            <Text
              style={[
                styles.text,
                { fontSize: sz.fontSize, color: getTextColor() },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
