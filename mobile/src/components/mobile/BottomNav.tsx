import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/colors';
import { AppIcon, type IconName } from './AppIcons';
import type { MainTabParamList } from '@/navigation/types';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TxKey } from '@/i18n/translations_en';

export type BottomTab = 'Home' | 'Search' | 'Bookings' | 'Account';

export type TabRoute = keyof MainTabParamList;

const TABS: { key: BottomTab; tx: TxKey; icon: IconName; route: TabRoute }[] = [
  { key: 'Home', tx: 'tabs.home', icon: 'home', route: 'Explore' },
  { key: 'Search', tx: 'tabs.search', icon: 'search', route: 'Search' },
  { key: 'Bookings', tx: 'tabs.bookings', icon: 'calendar', route: 'MyBookings' },
  { key: 'Account', tx: 'tabs.account', icon: 'user', route: 'Profile' },
];

const BAR_BG = colors.background; // cream — matches the app background
const BAR_BORDER = 'rgba(22, 163, 74, 0.35)'; // theme-green border
const BAR_GLOW = '#16A34A'; // theme-green shadow in all directions
const ACTIVE_PILL = colors.primary; // #16A34A — matches Book Now button
const ACTIVE_ICON = '#FFFFFF';
const INACTIVE_ICON = '#8E9590';

/**
 * Floating black pill navigation — matches design screenshot.
 * 4 icon-only tabs, evenly spaced. Active tab: solid green circle
 * with a filled white icon. Inactive: muted gray outline icon.
 */
function TabButton({
  label,
  icon,
  focused,
  onPress,
  onLongPress,
  testID,
  accessibilityLabel,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={10}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: true, radius: 24 }}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.65 }]}
    >
      {focused ? (
        <View style={styles.activePill}>
          <AppIcon
            name={icon}
            size={23}
            color={ACTIVE_ICON}
            // Solid filled look for the selected state (home/user fill,
            // search/calendar stay crisp outlines at a heavier weight).
            filled={icon === 'home' || icon === 'user'}
            strokeWidth={icon === 'home' || icon === 'user' ? 2.2 : 2.4}
          />
        </View>
      ) : (
        <View style={styles.inactiveHit}>
          <AppIcon name={icon} size={24} color={INACTIVE_ICON} filled={false} strokeWidth={1.9} />
        </View>
      )}
    </Pressable>
  );
}

export function BottomNav({
  active,
  onNavigate,
}: {
  active: BottomTab;
  onNavigate: (route: TabRoute) => void;
}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) + 14 }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            label={t(tab.tx)}
            icon={tab.icon}
            focused={tab.key === active}
            onPress={() => onNavigate(tab.route)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 28,
    right: 28,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BAR_BG,
    borderWidth: 1.5,
    borderColor: BAR_BORDER,
    borderRadius: 32,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 420,
    shadowColor: BAR_GLOW,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  activePill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACTIVE_PILL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACTIVE_PILL,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  inactiveHit: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Tab-bar managed by the BottomTabNavigator (single instance).
 * Uses tabPress emit + jump (no stack push) so switching tabs is instant,
 * preserves each tab's state, and never grows the navigation stack.
 */
export function MainTabsBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) + 14 }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.route === route.name);
          if (!tab) return null;
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };
          return (
            <TabButton
              key={route.key}
              label={t(tab.tx)}
              icon={tab.icon}
              focused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              testID={options.tabBarButtonTestID}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? t(tab.tx)}
            />
          );
        })}
      </View>
    </View>
  );
}
