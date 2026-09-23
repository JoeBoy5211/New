import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorViewDayBucket {
  key: string;
  label: string;
  views: number;
  signedIn: number;
  guests: number;
}

/** Monday-first weekday labels for the heatmap. */
export const VIEW_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface RawView {
  viewed_at: string;
  viewer_id: string | null;
  device_id: string | null;
}

/**
 * Vendor-scoped profile-view analytics for the vendor portal Analytics tab.
 * Reads this vendor's own rows from `caterer_profile_views` (allowed by the
 * "Vendors can view views for their caterers" RLS policy in
 * mobile/scripts/migration/supabase-caterer-profile-views.sql) and buckets client-side.
 * Lifetime totals come from the cached `caterers` row — no COUNT(*) scans.
 */
export function useMyCatererViewTrend(catererId: string | null | undefined, days: number) {
  const since = useMemo(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - (days - 1));
    return d.toISOString();
  }, [days]);

  const query = useQuery({
    queryKey: ['vendor-views', catererId, days],
    queryFn: async (): Promise<RawView[]> => {
      if (!catererId) return [];
      const { data, error } = await supabase
        .from('caterer_profile_views')
        .select('viewed_at, viewer_id, device_id')
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

  const buckets = useMemo<VendorViewDayBucket[]>(() => {
    const out: VendorViewDayBucket[] = [];
    const byKey = new Map<string, VendorViewDayBucket>();
    const today = startOfDay(new Date());
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const b: VendorViewDayBucket = {
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
      grid[(d.getDay() + 6) % 7][d.getHours()] += 1;
    }
    return grid;
  }, [query.data]);

  const summary = useMemo(() => {
    const views = buckets.reduce((s, b) => s + b.views, 0);
    const signedIn = buckets.reduce((s, b) => s + b.signedIn, 0);
    const keys = new Set(
      (query.data ?? []).map((r) => (r.viewer_id ? `u:${r.viewer_id}` : `d:${r.device_id ?? 'unknown'}`)),
    );
    return {
      views,
      signedIn,
      guests: views - signedIn,
      unique: keys.size,
      avgPerDay: days > 0 ? views / days : 0,
      signedInShare: views > 0 ? (signedIn / views) * 100 : 0,
    };
  }, [buckets, query.data, days]);

  const peak = useMemo(() => {
    let best = { day: 0, hour: 0, value: 0 };
    heatmap.forEach((row, d) =>
      row.forEach((v, h) => {
        if (v > best.value) best = { day: d, hour: h, value: v };
      }),
    );
    return best;
  }, [heatmap]);

  return { ...query, buckets, heatmap, summary, peak };
}
