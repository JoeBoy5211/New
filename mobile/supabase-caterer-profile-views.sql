-- Caterer profile views — total hits + unique visitors.
-- Run once in Supabase SQL editor (or via `supabase db push`).
-- Pattern follows supabase-review-rating-aggregate.sql (idempotent, SECURITY DEFINER).
--
-- Design:
--   caterers.view_count         cached total hits (fast reads, no COUNT(*) per page)
--   caterers.unique_view_count  cached distinct visitors (auth users + anon devices)
--   caterer_profile_views       raw event log (every hit, for time-series / analytics)
--   caterer_unique_viewers      one row per (caterer, visitor) for O(1) unique dedup
-- Clients must call track_caterer_view() RPC — direct INSERTs are blocked by RLS.

-- ---------------------------------------------------------------------------
-- 1. Cached counters on caterers
-- ---------------------------------------------------------------------------
ALTER TABLE public.caterers ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.caterers ADD COLUMN IF NOT EXISTS unique_view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_caterers_view_count ON public.caterers(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_caterers_unique_view_count ON public.caterers(unique_view_count DESC);

-- ---------------------------------------------------------------------------
-- 2. Raw event log (every detail-page open)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caterer_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caterer_id UUID NOT NULL REFERENCES public.caterers(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_id TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caterer_profile_views ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_caterer_views_caterer_time
  ON public.caterer_profile_views(caterer_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_caterer_views_viewer
  ON public.caterer_profile_views(viewer_id) WHERE viewer_id IS NOT NULL;

-- No INSERT policy on purpose: clients must use track_caterer_view() (SECURITY DEFINER).
-- Vendors/admins can read their own analytics:
DROP POLICY IF EXISTS "Vendors can view views for their caterers" ON public.caterer_profile_views;
CREATE POLICY "Vendors can view views for their caterers" ON public.caterer_profile_views
  FOR SELECT USING (public.is_caterer_owner(caterer_id));

DROP POLICY IF EXISTS "Admins can view all profile views" ON public.caterer_profile_views;
CREATE POLICY "Admins can view all profile views" ON public.caterer_profile_views
  FOR SELECT USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Unique-visitor ledger: one row per (caterer, visitor)
-- viewer_key = 'u:<auth.uid>' for signed-in users, 'd:<device_id>' for guests.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caterer_unique_viewers (
  caterer_id UUID NOT NULL REFERENCES public.caterers(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (caterer_id, viewer_key)
);

ALTER TABLE public.caterer_unique_viewers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view unique viewers for their caterers" ON public.caterer_unique_viewers;
CREATE POLICY "Vendors can view unique viewers for their caterers" ON public.caterer_unique_viewers
  FOR SELECT USING (public.is_caterer_owner(caterer_id));

DROP POLICY IF EXISTS "Admins can view all unique viewers" ON public.caterer_unique_viewers;
CREATE POLICY "Admins can view all unique viewers" ON public.caterer_unique_viewers
  FOR SELECT USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Atomic tracker — call from mobile on detail-page open
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.track_caterer_view(
  p_caterer_id UUID,
  p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_vendor_id UUID;
  v_key TEXT;
  v_new_unique BOOLEAN := false;
  v_total INTEGER := 0;
  v_unique INTEGER := 0;
  v_rows INTEGER := 0;
BEGIN
  IF p_caterer_id IS NULL THEN
    RAISE EXCEPTION 'Missing caterer id.';
  END IF;

  SELECT vendor_id INTO v_vendor_id FROM public.caterers WHERE id = p_caterer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caterer not found.';
  END IF;

  -- Owner self-views don't inflate public metrics (still return current counts).
  IF v_uid IS NOT NULL AND v_vendor_id IS NOT DISTINCT FROM v_uid THEN
    SELECT COALESCE(view_count, 0), COALESCE(unique_view_count, 0)
      INTO v_total, v_unique
      FROM public.caterers WHERE id = p_caterer_id;
    RETURN jsonb_build_object(
      'view_count', v_total,
      'unique_view_count', v_unique,
      'is_new_unique', false,
      'skipped', 'owner'
    );
  END IF;

  IF v_uid IS NOT NULL THEN
    v_key := 'u:' || v_uid::text;
  ELSIF p_device_id IS NOT NULL AND length(trim(p_device_id)) > 0 THEN
    v_key := 'd:' || left(trim(p_device_id), 128);
  ELSE
    v_key := 'd:unknown';
  END IF;

  -- Raw event (never fails the page on error — caller swallows RPC errors).
  INSERT INTO public.caterer_profile_views (caterer_id, viewer_id, device_id)
  VALUES (p_caterer_id, v_uid, p_device_id);

  -- Unique ledger: INSERT … ON CONFLICT DO NOTHING tells us if this is new.
  INSERT INTO public.caterer_unique_viewers (caterer_id, viewer_key)
  VALUES (p_caterer_id, v_key)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_new_unique := (v_rows = 1);

  UPDATE public.caterers
  SET
    view_count = COALESCE(view_count, 0) + 1,
    unique_view_count = COALESCE(unique_view_count, 0) + CASE WHEN v_new_unique THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = p_caterer_id
  RETURNING view_count, unique_view_count INTO v_total, v_unique;

  RETURN jsonb_build_object(
    'view_count', v_total,
    'unique_view_count', v_unique,
    'is_new_unique', v_new_unique
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_caterer_view(UUID, TEXT) TO anon, authenticated;

-- Backfill nulls from older installs (columns default 0 for new rows).
UPDATE public.caterers SET view_count = 0 WHERE view_count IS NULL;
UPDATE public.caterers SET unique_view_count = 0 WHERE unique_view_count IS NULL;
