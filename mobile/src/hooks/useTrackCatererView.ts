import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { getDeviceId, trackCatererView } from '@/services/catererViews';
import type { Caterer } from '@/types/domain';

/** Session guard — one total-hit per caterer per app launch. */
const trackedThisSession = new Set<string>();

/**
 * Fire-and-forget profile-view tracking for `CatererDetailScreen`.
 * - Total hits (`view_count`): counted once per app session per caterer.
 *   Prevents re-render / back-and-forth inflation while still counting
 *   repeat visits across launches.
 * - Unique visitors (`unique_view_count`): deduped server-side via
 *   `caterer_unique_viewers`, so repeat calls are safe.
 * Never blocks rendering; on success the cached caterer row is patched
 * so the displayed counts update without a refetch.
 */
export function useTrackCatererView(catererId: string | undefined) {
  const queryClient = useQueryClient();
  const started = useRef<string | null>(null);

  useEffect(() => {
    if (!catererId || started.current === catererId) return;
    if (trackedThisSession.has(catererId)) return;
    started.current = catererId;
    trackedThisSession.add(catererId);

    let cancelled = false;
    (async () => {
      const deviceId = await getDeviceId();
      if (cancelled) return;
      const result = await trackCatererView(catererId, deviceId);
      if (cancelled || !result) return;

      queryClient.setQueryData<Caterer | null>(
        queryKeys.caterer(catererId),
        (prev) =>
          prev
            ? {
                ...prev,
                view_count: result.view_count,
                unique_view_count: result.unique_view_count,
              }
            : prev,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [catererId, queryClient]);
}
