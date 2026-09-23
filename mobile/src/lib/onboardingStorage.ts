import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';

const KEY = STORAGE_KEYS.hasSeenOnboarding;

export async function getHasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function setHasSeenOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Storage failure shouldn't block navigation — onboarding will just
    // show again next cold start, while logged-in users still skip it
    // via the authenticated check in RootNavigator.
  }
}

export async function clearHasSeenOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Ignore — worst case the onboarding stays hidden.
  }
}
