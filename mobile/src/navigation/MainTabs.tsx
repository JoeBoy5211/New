import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsBar } from '@/components/mobile/BottomNav';
import { useLanguage } from '@/i18n/LanguageContext';
import type { MainTabParamList } from '@/navigation/types';
import ExploreScreen from '@/screens/ExploreScreen';
import SearchScreen from '@/screens/SearchScreen';
import MyBookingsScreen from '@/screens/MyBookingsScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Real tab navigator — tab switches are instant jumps (no stack push
 * animation), each tab keeps its own state/scroll, and the stack never
 * grows when tapping the bottom menu.
 */
export default function MainTabs() {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      initialRouteName="Explore"
      tabBar={(props) => <MainTabsBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Keep tab screens mounted so switching back is instant (no refetch flash).
        freezeOnBlur: true,
        // Avoid the native-stack slide animation entirely for tabs.
        animation: 'shift',
        lazy: true,
      }}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t('tabs.search') }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: t('tabs.bookings') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.account') }} />
    </Tab.Navigator>
  );
}
