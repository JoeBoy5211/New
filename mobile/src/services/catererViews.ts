/** Data-access for caterer profile views — pure Supabase calls, no React. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { STORAGE_KEYS } from '@/constants/storage';
import { logger } from '@/lib/logger';

export interface CatererViewResult {
  view_count: number;
  unique_view_count: number;
  is_new_unique: boolean;
}

function fallbackId(): string {
  return `dev-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Stable per-install anonymous id for unique counting of signed-out users.
 * Uses Expo SDK 57 `Crypto.randomUUID()` (sync, Android/iOS/Web).
 */
export async function getDeviceId(): Promise<string> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
    if (cached && cached.trim()) return cached;
    let next: string;
    try {
      next = Crypto.randomUUID();
    } catch {
      next = fallbackId();
    }
    await AsyncStorage.setItem(STORAGE_KEYS.deviceId, next);
    return next;
  } catch {
    return fallbackId();
  }
}

export async function trackCatererView(
  catererId: string | undefined,
  deviceId?: string | null,
): Promise<CatererViewResult | null> {
  if (!catererId) return null;
  const { data, error } = await supabase.rpc('track_caterer_view', {
    p_caterer_id: catererId,
    p_device_id: deviceId ?? null,
  });
  if (error) {
    logger.debug('[views] track failed', catererId, error.message);
    return null;
  }
  const row = data as unknown as CatererViewResult | null;
  if (!row || typeof row.view_count === 'undefined') return null;
  return {
    view_count: Number(row.view_count) || 0,
    unique_view_count: Number(row.unique_view_count) || 0,
    is_new_unique: !!row.is_new_unique,
  };
}
