import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Home, Play, User } from 'lucide-react-native';

import Colors, { BRAND, LIGHT, DARK } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];

  const tabBar = isDark ? DARK.tabBar : LIGHT.tabBar;
  const tabBorder = isDark ? DARK.border : LIGHT.border;
  const activeTint = isDark ? DARK.tint : LIGHT.tint;
  const inactiveTint = isDark ? DARK.textMuted : LIGHT.textMuted;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBar,
          borderTopColor: tabBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          // Premium shadow instead of hard border
          shadowColor: BRAND.charcoal,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 16,
          elevation: 12,
          height: Platform.OS === 'ios' ? 88 : 66,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.tabIconWrap,
              focused && { backgroundColor: isDark ? DARK.tintLight : LIGHT.tintXLight }
            ]}>
              <Home
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 1.8}
                fill={focused ? (isDark ? DARK.tint + '30' : LIGHT.tint + '15') : 'transparent'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Promotions',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.tabIconWrap,
              focused && { backgroundColor: isDark ? DARK.tintLight : LIGHT.tintXLight }
            ]}>
              <Play
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 1.8}
                fill={focused ? (isDark ? DARK.tint + '30' : LIGHT.tint + '15') : 'transparent'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.tabIconWrap,
              focused && { backgroundColor: isDark ? DARK.tintLight : LIGHT.tintXLight }
            ]}>
              <User
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 1.8}
                fill={focused ? (isDark ? DARK.tint + '30' : LIGHT.tint + '15') : 'transparent'}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
