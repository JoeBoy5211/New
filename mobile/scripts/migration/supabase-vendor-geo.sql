-- Vendor coordinates for "near you" sorting — run once in the Supabase SQL editor.
-- The mobile app reads the customer's GPS position (expo-location, foreground
-- only) and sorts vendors by haversine distance client-side. Coordinates are
-- entered by admins per vendor (vendor sheet → Location section).

-- ---------------------------------------------------------------------------
-- 1. Coordinate columns on caterers (NULL = unknown, sorts last)
-- ---------------------------------------------------------------------------
ALTER TABLE public.caterers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.caterers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

COMMENT ON COLUMN public.caterers.latitude IS
  'Vendor latitude in degrees (WGS 84). NULL when unknown.';
COMMENT ON COLUMN public.caterers.longitude IS
  'Vendor longitude in degrees (WGS 84). NULL when unknown.';

-- ---------------------------------------------------------------------------
-- 2. Sanity guard — valid ranges only (silently allows NULLs)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'caterers_lat_lng_range'
  ) THEN
    ALTER TABLE public.caterers ADD CONSTRAINT caterers_lat_lng_range CHECK (
      (latitude IS NULL OR (latitude >= -90 AND latitude <= 90))
      AND (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
    );
  END IF;
END $$;
