-- ============================================================================
-- PureVedicGems Storage Foundation
-- Run in Supabase SQL Editor after schema.sql and fix_team_members_rls.sql.
-- Idempotent: safe to rerun when adding buckets to a fresh or repaired project.
-- ============================================================================

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('certificates', 'certificates', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('experts', 'experts', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('heritage', 'heritage', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('designs', 'designs', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('reviews', 'reviews', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('invoices', 'invoices', false, 10485760, ARRAY['application/pdf']),
  ('custom-uploads', 'custom-uploads', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Backward-compatible bucket used by early configurator/admin code.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('jewelry-designs', 'jewelry-designs', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read products" ON storage.objects;
CREATE POLICY "Public read products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admin write products" ON storage.objects;
CREATE POLICY "Admin write products" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Admin update products" ON storage.objects;
CREATE POLICY "Admin update products" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Admin delete products" ON storage.objects;
CREATE POLICY "Admin delete products" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Public read certificates" ON storage.objects;
CREATE POLICY "Public read certificates" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Admin write certificates" ON storage.objects;
CREATE POLICY "Admin write certificates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'certificates' AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Public read experts" ON storage.objects;
CREATE POLICY "Public read experts" ON storage.objects
  FOR SELECT USING (bucket_id = 'experts');

DROP POLICY IF EXISTS "Admin write experts" ON storage.objects;
CREATE POLICY "Admin write experts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'experts' AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Public read heritage" ON storage.objects;
CREATE POLICY "Public read heritage" ON storage.objects
  FOR SELECT USING (bucket_id = 'heritage');

DROP POLICY IF EXISTS "Admin write heritage" ON storage.objects;
CREATE POLICY "Admin write heritage" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'heritage' AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Public read designs" ON storage.objects;
CREATE POLICY "Public read designs" ON storage.objects
  FOR SELECT USING (bucket_id IN ('designs', 'jewelry-designs'));

DROP POLICY IF EXISTS "Admin write designs" ON storage.objects;
CREATE POLICY "Admin write designs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('designs', 'jewelry-designs') AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Admin update designs" ON storage.objects;
CREATE POLICY "Admin update designs" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('designs', 'jewelry-designs') AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Admin delete designs" ON storage.objects;
CREATE POLICY "Admin delete designs" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('designs', 'jewelry-designs') AND
    auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Public read reviews" ON storage.objects;
CREATE POLICY "Public read reviews" ON storage.objects
  FOR SELECT USING (bucket_id = 'reviews');

DROP POLICY IF EXISTS "Authenticated write reviews" ON storage.objects;
CREATE POLICY "Authenticated write reviews" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reviews' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read own invoices" ON storage.objects;
CREATE POLICY "Auth read own invoices" ON storage.objects
  FOR SELECT USING (bucket_id = 'invoices' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth write custom uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload custom-uploads" ON storage.objects;
CREATE POLICY "Auth write custom uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'custom-uploads' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public read custom-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth read own custom uploads" ON storage.objects;
CREATE POLICY "Auth read own custom uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-uploads' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public read jewelry-designs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload jewelry-designs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete jewelry-designs" ON storage.objects;

COMMIT;
