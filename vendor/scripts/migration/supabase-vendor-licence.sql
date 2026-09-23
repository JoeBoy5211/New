-- Vendor business licence (PDF) — storage + caterer column.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- The vendor app uploads to the private `vendor-licences` bucket at
-- `{vendor_id}/business-licence.pdf` and stores that path on
-- `caterers.licence_path`. Admins read via signed URLs.

-- ---------------------------------------------------------------------------
-- 1. Reference column on caterers
-- ---------------------------------------------------------------------------
ALTER TABLE public.caterers ADD COLUMN IF NOT EXISTS licence_path TEXT;

-- ---------------------------------------------------------------------------
-- 2. Private storage bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-licences', 'vendor-licences', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Storage RLS: owners manage their own folder, admins can read all
-- Path convention: {auth.uid()}/business-licence.pdf
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Vendors can upload their own licence" ON storage.objects;
CREATE POLICY "Vendors can upload their own licence" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'vendor-licences'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Vendors can update their own licence" ON storage.objects;
CREATE POLICY "Vendors can update their own licence" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'vendor-licences'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Vendors can delete their own licence" ON storage.objects;
CREATE POLICY "Vendors can delete their own licence" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'vendor-licences'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Vendors can view their own licence" ON storage.objects;
CREATE POLICY "Vendors can view their own licence" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'vendor-licences'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can view all licences" ON storage.objects;
CREATE POLICY "Admins can view all licences" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'vendor-licences'
    AND public.is_admin()
  );
