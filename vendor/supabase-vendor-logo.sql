-- Vendor logo (Cloudinary URL) — run once in the Supabase SQL editor.
-- Logos are uploaded directly to Cloudinary from the browser (folder
-- `catering_app/logos`, same unsigned preset as covers/menu/packages)
-- and only the resulting HTTPS URL is stored on `caterers.logo_url`.

-- ---------------------------------------------------------------------------
-- 1. Reference column on caterers
-- ---------------------------------------------------------------------------
ALTER TABLE public.caterers ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.caterers.logo_url IS
  'Cloudinary secure_url for the vendor logo (uploaded to catering_app/logos). NULL when not set.';
