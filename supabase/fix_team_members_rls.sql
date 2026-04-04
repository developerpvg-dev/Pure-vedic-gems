-- ═══════════════════════════════════════════════════
-- FIX: Infinite recursion in team_members RLS policy
-- Error code: 42P17
-- ═══════════════════════════════════════════════════
--
-- ROOT CAUSE:
--   The team_members SELECT policy references team_members itself:
--     USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() ...))
--   This causes infinite recursion whenever ANY policy (table or storage)
--   tries to check team membership.
--
-- FIX:
--   1. Replace the recursive team_members SELECT policy with a direct
--      row-level check: USING (auth.uid() = id)
--   2. Replace all storage.objects INSERT/UPDATE/DELETE policies that
--      used EXISTS (SELECT 1 FROM team_members ...) with the same
--      direct auth.uid() check against team_members.id.
--
-- Admin API routes use the service role key (bypasses RLS entirely),
-- so this change does not break any admin functionality.
--
-- Run this in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════

BEGIN;

-- ─── 1. Fix team_members table policies ─────────────────────────────────

DROP POLICY IF EXISTS "Admin reads team members" ON team_members;
CREATE POLICY "Admin reads team members"
    ON team_members FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Director manages team" ON team_members;
CREATE POLICY "Director manages team"
    ON team_members FOR ALL
    USING (auth.uid() = id AND role = 'director' AND is_active = true);

-- ─── 2. Fix storage.objects policies that reference team_members ────────
--    Replace recursive EXISTS subquery with a direct join-free check.
--    We use: auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
--    This is safe because the team_members SELECT policy above is non-recursive.

-- Products bucket
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

-- Certificates bucket
DROP POLICY IF EXISTS "Admin write certificates" ON storage.objects;
CREATE POLICY "Admin write certificates" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'certificates' AND
        auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
    );

-- Experts bucket
DROP POLICY IF EXISTS "Admin write experts" ON storage.objects;
CREATE POLICY "Admin write experts" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'experts' AND
        auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
    );

-- Heritage bucket
DROP POLICY IF EXISTS "Admin write heritage" ON storage.objects;
CREATE POLICY "Admin write heritage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'heritage' AND
        auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
    );

-- Designs bucket (schema.sql version)
DROP POLICY IF EXISTS "Admin write designs" ON storage.objects;
CREATE POLICY "Admin write designs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'designs' AND
        auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
    );

-- jewelry-designs bucket (create_storage_buckets.sql version)
-- These don't reference team_members so they're fine, but ensure they exist:
DROP POLICY IF EXISTS "Authenticated upload jewelry-designs" ON storage.objects;
CREATE POLICY "Authenticated upload jewelry-designs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'jewelry-designs' AND auth.uid() IS NOT NULL
    );

-- custom-uploads bucket — ensure policy exists
DROP POLICY IF EXISTS "Auth write custom uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload custom-uploads" ON storage.objects;
CREATE POLICY "Auth write custom uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'custom-uploads' AND auth.uid() IS NOT NULL
    );

COMMIT;
