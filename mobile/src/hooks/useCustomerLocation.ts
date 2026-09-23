import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { STORAGE_KEYS } from '@/constants/storage';
import type { Coords } from '@/lib/geo';

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

interface CachedFix extends Coords {
  at: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function readCache(): Promise<Coords | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.customerLocation);
    if (!raw) return null;
    const fix = JSON.parse(raw) as CachedFix;
    if (
      typeof fix.latitude !== 'number' ||
      typeof fix.longitude !== 'number' ||
      Date.now() - fix.at > CACHE_TTL_MS
    ) {
      return null;
    }
    return { latitude: fix.latitude, longitude: fix.longitude };
  } catch {
    return null;
  }
}

/**
 * Customer GPS position (foreground only) for "Near you" sorting.
 * Cached for 30 min so the home page doesn't refix on every visit.
 * `request()` re-prompts — wire it to the "Enable location" button.
 */
export function useCustomerLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');

  const resolve = useCallback(async (ask: boolean) => {
    try {
      const cached = await readCache();
      if (cached) {
        setCoords(cached);
        setStatus('granted');
        return;
      }
      const current = ask
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (current.status !== 'granted') {
        // Still try a last-known fix — free and needs no prompt.
        const last = await Location.getLastKnownPositionAsync({}).catch(() => null);
        if (last) {
          setCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
          setStatus('granted');
          return;
        }
        setStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const fix = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(fix);
      setStatus('granted');
      await AsyncStorage.setItem(
        STORAGE_KEYS.customerLocation,
        JSON.stringify({ ...fix, at: Date.now() }),
      ).catch(() => {});
    } catch {
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    // Ask on first home visit — the nearby section depends on it.
    resolve(true);
  }, [resolve]);

  const request = useCallback(() => {
    setStatus('loading');
    resolve(true);
  }, [resolve]);

  return { coords, status, request };
}
