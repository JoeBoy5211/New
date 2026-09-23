/** Geo helpers — haversine distance for "Near you" sorting. */
import type { Language } from '@/i18n/LanguageContext';
import { en } from '@/i18n/translations_en';
import { am } from '@/i18n/translations_am';

export interface Coords {
  latitude: number;
  longitude: number;
}

const EARTH_KM = 6371;

/** Great-circle distance in kilometres between two WGS-84 points. */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** "850 m away" / "2.3 km away" (localized) */
export function formatDistance(km: number, lang: Language = 'en'): string {
  if (!Number.isFinite(km) || km < 0) return '';
  const dict = lang === 'am' ? am : en;
  if (km < 1) {
    const m = Math.max(1, Math.round(km * 1000));
    return dict['dist.m'].replaceAll('{n}', String(m));
  }
  const v = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return dict['dist.km'].replaceAll('{n}', v);
}

export function hasCoords(c: { latitude?: number | null; longitude?: number | null }): c is {
  latitude: number;
  longitude: number;
} & typeof c {
  return (
    typeof c.latitude === 'number' &&
    typeof c.longitude === 'number' &&
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude)
  );
}

/**
 * Distance map (caterer id → km) from the customer position.
 * Vendors without coordinates are absent from the map.
 */
export function distanceMap<T extends { id: string }>(
  list: T[],
  origin: Coords | null,
): Record<string, number> {
  if (!origin) return {};
  const out: Record<string, number> = {};
  for (const item of list) {
    if (hasCoords(item as { latitude?: number | null; longitude?: number | null })) {
      const c = item as unknown as { latitude: number; longitude: number };
      out[item.id] = distanceKm(origin, { latitude: c.latitude, longitude: c.longitude });
    }
  }
  return out;
}

/**
 * Sort vendors by distance ascending. Vendors without coordinates sort last
 * (alphabetical tiebreak), so unknown locations never hide known ones.
 */
export function sortByDistance<T extends { id: string; name: string }>(
  list: T[],
  origin: Coords | null,
): T[] {
  if (!origin) return [...list];
  const dists = distanceMap(list, origin);
  return [...list].sort((a, b) => {
    const da = dists[a.id];
    const db = dists[b.id];
    if (da == null && db == null) return a.name.localeCompare(b.name);
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
}
