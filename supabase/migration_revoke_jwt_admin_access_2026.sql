-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY: Revoke JWT / PostgREST admin table access
--
-- App RBAC lives in /api/admin (service role after requireAdminAccess).
-- Policies that treated any active team_members row as full admin let a
-- low-privilege staff JWT mutate orders/products via Supabase REST and
-- bypass ROLE_PERMISSIONS.
--
-- This migration:
--   1. Makes public.is_admin() always false (service_role bypasses RLS)
--   2. Drops public-schema policies that key off team_members / is_admin
--   3. Restores team_members self-SELECT only (auth.uid() = id)
--   4. Does NOT touch storage.objects (browser design uploads still need it)
--
-- Run in Supabase → SQL Editor (or via migration pipeline).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- ponytail: always false; admin data only via service_role after app RBAC
  SELECT false;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT pol.polname AS policyname,
           c.relname AS tablename
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
        COALESCE(pg_get_expr(pol.polqual, pol.polrelid), '') ILIKE '%team_members%'
        OR COALESCE(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ILIKE '%team_members%'
        OR COALESCE(pg_get_expr(pol.polqual, pol.polrelid), '') ILIKE '%is_admin%'
        OR COALESCE(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ILIKE '%is_admin%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Team members can read own row" ON public.team_members;
CREATE POLICY "Team members can read own row"
  ON public.team_members
  FOR SELECT
  USING (auth.uid() = id);

COMMIT;
