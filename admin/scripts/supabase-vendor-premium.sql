-- Premium vendors — run once in the Supabase SQL editor.
-- Vendors marked premium (paid tier, toggled manually by admins) are
-- listed first on the mobile home page, sorted alphabetically.

-- ---------------------------------------------------------------------------
-- 1. Premium flag on caterers
-- ---------------------------------------------------------------------------
ALTER TABLE public.caterers ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.caterers.is_premium IS
  'Paid premium tier. Premium vendors appear first on the mobile home page (alphabetical). Toggled by admins.';

-- ---------------------------------------------------------------------------
-- 2. Helpful index for the home-page query (approved + premium first)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_caterers_premium
  ON public.caterers (is_approved, is_premium);
