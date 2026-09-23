-- Home page banners — images posted from admin Settings, shown in the
-- mobile home banner slot (fixed 767×318 ratio, carousel when multiple).
-- Run once in the Supabase SQL editor (or via `supabase db push`).

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.home_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  link_caterer_id UUID REFERENCES public.caterers(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active home banners" ON public.home_banners;
CREATE POLICY "Anyone can view active home banners" ON public.home_banners
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage home banners" ON public.home_banners;
CREATE POLICY "Admins can manage home banners" ON public.home_banners
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_home_banners_active_order
  ON public.home_banners(is_active, sort_order, created_at);

DROP TRIGGER IF EXISTS update_home_banners_updated_at ON public.home_banners;
CREATE TRIGGER update_home_banners_updated_at BEFORE UPDATE ON public.home_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. Public storage bucket (banner images are display assets, not sensitive)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('home-banners', 'home-banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view home banners" ON storage.objects;
CREATE POLICY "Public can view home banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'home-banners');

DROP POLICY IF EXISTS "Admins can upload home banners" ON storage.objects;
CREATE POLICY "Admins can upload home banners" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'home-banners' AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update home banners" ON storage.objects;
CREATE POLICY "Admins can update home banners" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'home-banners' AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete home banners" ON storage.objects;
CREATE POLICY "Admins can delete home banners" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'home-banners' AND public.is_admin()
  );
