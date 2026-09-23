import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ViewDayBucket {
  key: string;
  label: string;
  views: number;
  signedIn: number;
  guests: number;
}

interface RawView {
  viewed_at: string;
  viewer_id: string | null;
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Per-caterer detail analytics for the admin Vendors sheet.
 * Reads the raw `caterer_profile_views` log (admin SELECT policy from
 * mobile/scripts/migration/supabase-caterer-profile-views.sql) and buckets client-side.
 * Totals (lifetime) come from the cached `caterers` row — no COUNT(*) scans.
 */
export function useCatererViewTrend(catererId: string | null | undefined, days = 14) {
  const since = useMemo(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - (days - 1));
    return d.toISOString();
  }, [days]);

  const query = useQuery({
    queryKey: ['caterer-views', catererId, days],
    queryFn: async (): Promise<RawView[]> => {
      if (!catererId) return [];
      const { data, error } = await supabase
        .from('caterer_profile_views')
        .select('viewed_at, viewer_id')
        .eq('caterer_id', catererId)
        .gte('viewed_at', since)
        .order('viewed_at', { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as RawView[];
    },
    enabled: !!catererId,
    staleTime: 60_000,
  });

  const buckets = useMemo<ViewDayBucket[]>(() => {
    const out: ViewDayBucket[] = [];
    const byKey = new Map<string, ViewDayBucket>();
    const today = startOfDay(new Date());
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const b: ViewDayBucket = {
        key,
        label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        views: 0,
        signedIn: 0,
        guests: 0,
      };
      out.push(b);
      byKey.set(key, b);
    }
    for (const row of query.data ?? []) {
      const key = dayKey(new Date(row.viewed_at));
      const b = byKey.get(key);
      if (!b) continue;
      b.views += 1;
      if (row.viewer_id) b.signedIn += 1;
      else b.guests += 1;
    }
    return out;
  }, [query.data, days]);

  const period = useMemo(() => {
    const views = buckets.reduce((s, b) => s + b.views, 0);
    const signedIn = buckets.reduce((s, b) => s + b.signedIn, 0);
    return { views, signedIn, guests: views - signedIn };
  }, [buckets]);

  return { ...query, buckets, period };
}

export interface PlatformViewEvent {
  caterer_id: string;
  viewed_at: string;
  viewer_id: string | null;
  device_id: string | null;
}

export interface VendorViewStat {
  catererId: string;
  views: number;
  signedIn: number;
  guests: number;
  unique: number;
}

/** Monday-first weekday labels for the heatmap. */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function visitorKey(e: Pick<PlatformViewEvent, 'viewer_id' | 'device_id'>): string {
  if (e.viewer_id) return `u:${e.viewer_id}`;
  if (e.device_id) return `d:${e.device_id}`;
  return 'd:unknown';
}

/**
 * Platform-wide view events for the Analytics page.
 * One bounded query (limit 10k, `staleTime` 60s) powers the trend chart,
 * the day×hour heatmap and the per-vendor leaderboard — all bucketed
 * client-side so no extra DB load per widget.
 * Pass `catererId` to scope everything to a single vendor.
 */
export function usePlatformViewEvents(days: number, catererId?: string | null) {
  const since = useMemo(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - (days - 1));
    return d.toISOString();
  }, [days]);

  const query = useQuery({
    queryKey: ['platform-views', days, catererId ?? 'all'],
    queryFn: async (): Promise<PlatformViewEvent[]> => {
      let q = supabase
        .from('caterer_profile_views')
        .select('caterer_id, viewed_at, viewer_id, device_id')
        .gte('viewed_at', since)
        .order('viewed_at', { ascending: true })
        .limit(10000);
      if (catererId) q = q.eq('caterer_id', catererId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PlatformViewEvent[];
    },
    staleTime: 60_000,
  });

  const buckets = useMemo<ViewDayBucket[]>(() => {
    const out: ViewDayBucket[] = [];
    const byKey = new Map<string, ViewDayBucket>();
    const today = startOfDay(new Date());
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const b: ViewDayBucket = {
        key,
        label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        views: 0,
        signedIn: 0,
        guests: 0,
      };
      out.push(b);
      byKey.set(key, b);
    }
    for (const row of query.data ?? []) {
      const b = byKey.get(dayKey(new Date(row.viewed_at)));
      if (!b) continue;
      b.views += 1;
      if (row.viewer_id) b.signedIn += 1;
      else b.guests += 1;
    }
    return out;
  }, [query.data, days]);

  /** 7 (Mon-first) × 24 hour matrix of view counts. */
  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const row of query.data ?? []) {
      const d = new Date(row.viewed_at);
      if (isNaN(+d)) continue;
      const weekday = (d.getDay() + 6) % 7;
      grid[weekday][d.getHours()] += 1;
    }
    return grid;
  }, [query.data]);

  const perVendor = useMemo<VendorViewStat[]>(() => {
    const map = new Map<string, VendorViewStat & { keys: Set<string> }>();
    for (const row of query.data ?? []) {
      let s = map.get(row.caterer_id);
      if (!s) {
        s = { catererId: row.caterer_id, views: 0, signedIn: 0, guests: 0, unique: 0, keys: new Set() };
        map.set(row.caterer_id, s);
      }
      s.views += 1;
      if (row.viewer_id) s.signedIn += 1;
      else s.guests += 1;
      s.keys.add(visitorKey(row));
    }
    return [...map.values()]
      .map(({ keys, ...s }) => ({ ...s, unique: keys.size }))
      .sort((a, b) => b.views - a.views);
  }, [query.data]);

  const summary = useMemo(() => {
    const views = buckets.reduce((s, b) => s + b.views, 0);
    const signedIn = buckets.reduce((s, b) => s + b.signedIn, 0);
    const keys = new Set((query.data ?? []).map(visitorKey));
    return {
      views,
      signedIn,
      guests: views - signedIn,
      unique: keys.size,
      avgPerDay: days > 0 ? views / days : 0,
      signedInShare: views > 0 ? (signedIn / views) * 100 : 0,
    };
  }, [buckets, query.data, days]);

  return { ...query, events: query.data ?? [], buckets, heatmap, perVendor, summary };
}
