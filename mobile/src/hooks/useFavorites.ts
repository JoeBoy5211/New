import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';

const KEY = STORAGE_KEYS.favorites;

/**
 * Local-only favorites (no backend favorites table exists).
 * Preserves existing API — purely UI state persisted on-device.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          try {
            const arr = JSON.parse(raw) as string[];
            setFavorites(new Set(arr));
          } catch {
            /* ignore corrupt cache */
          }
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setFavorites(new Set(next));
    void AsyncStorage.setItem(KEY, JSON.stringify([...next])).catch(() => undefined);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(favorites);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
    },
    [favorites, persist],
  );

  return { favorites, isFavorite, toggle, loaded };
}
