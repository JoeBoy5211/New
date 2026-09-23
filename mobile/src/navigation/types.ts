import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type MainTabParamList = {
  Explore: undefined;
  Search: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  PhoneAuth: undefined;
  OtpVerify: { phone: string };
  ProfileSetup: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CatererDetail: { id: string };
  CatererPackages: { catererId: string };
  BookingRequest: { catererId: string };
  BookingDetails: { bookingId: string };
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;