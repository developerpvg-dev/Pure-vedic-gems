-- ============================================================================
-- Create Storage Buckets for PureVedicGems
-- Run this in Supabase SQL Editor → Dashboard → SQL Editor → New Query
-- ============================================================================

-- 1. Create 'custom-uploads' bucket for customer design uploads (Configurator Step 4)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-uploads',
  'custom-uploads',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'jewelry-designs' bucket for admin jewelry design uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'jewelry-designs',
  'jewelry-designs',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow public read access to both buckets
CREATE POLICY "Public read custom-uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-uploads');

CREATE POLICY "Authenticated upload custom-uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'custom-uploads');

CREATE POLICY "Public read jewelry-designs" ON storage.objects
  FOR SELECT USING (bucket_id = 'jewelry-designs');

CREATE POLICY "Authenticated upload jewelry-designs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'jewelry-designs');

CREATE POLICY "Authenticated delete jewelry-designs" ON storage.objects
  FOR DELETE USING (bucket_id = 'jewelry-designs');
