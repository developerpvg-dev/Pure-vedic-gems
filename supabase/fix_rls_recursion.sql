-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Infinite recursion in team_members RLS policies
--
-- Root cause: every policy that checks "is this user an admin?" does:
--   EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
-- When that subquery runs, Postgres evaluates the team_members RLS policies,
-- which ALSO query team_members → infinite recursion (pg error 42P17).
--
-- Fix: Replace the inline subquery with a SECURITY DEFINER function.
-- SECURITY DEFINER means the function runs as its owner (service role),
-- which bypasses RLS → no recursion.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create helper — runs with definer rights, bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE id = auth.uid() AND is_active = true
  );
$$;

-- Restrict execution to authenticated/anon roles only (no privilege escalation)
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2. Drop and recreate team_members policies (the self-referential ones)
DROP POLICY IF EXISTS "Admin reads team members" ON team_members;
DROP POLICY IF EXISTS "Director manages team" ON team_members;

CREATE POLICY "Admin reads team members"
    ON team_members FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Director manages team"
    ON team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.id = auth.uid() AND tm.role = 'director' AND tm.is_active = true
        )
    );

-- 3. Drop and recreate all other policies that reference team_members inline
--    so they use is_admin() instead (prevents future recursion if team_members
--    policy changes again).

-- Products
DROP POLICY IF EXISTS "Admin full access to products" ON products;
CREATE POLICY "Admin full access to products"
    ON products FOR ALL
    USING (public.is_admin());

-- Experts
DROP POLICY IF EXISTS "Admin full access to experts" ON experts;
CREATE POLICY "Admin full access to experts"
    ON experts FOR ALL
    USING (public.is_admin());

-- Orders
DROP POLICY IF EXISTS "Admin full access to orders" ON orders;
CREATE POLICY "Admin full access to orders"
    ON orders FOR ALL
    USING (public.is_admin());

-- Jewelry designs
DROP POLICY IF EXISTS "Admin full access to designs" ON jewelry_designs;
CREATE POLICY "Admin full access to designs"
    ON jewelry_designs FOR ALL
    USING (public.is_admin());

-- Energization options
DROP POLICY IF EXISTS "Admin full access to energization" ON energization_options;
CREATE POLICY "Admin full access to energization"
    ON energization_options FOR ALL
    USING (public.is_admin());

-- Certification labs
DROP POLICY IF EXISTS "Admin full access to labs" ON certification_labs;
CREATE POLICY "Admin full access to labs"
    ON certification_labs FOR ALL
    USING (public.is_admin());

-- Admin activity log
DROP POLICY IF EXISTS "Admin reads activity log" ON admin_activity_log;
DROP POLICY IF EXISTS "Admin inserts activity log" ON admin_activity_log;
CREATE POLICY "Admin reads activity log"
    ON admin_activity_log FOR SELECT
    USING (public.is_admin());
CREATE POLICY "Admin inserts activity log"
    ON admin_activity_log FOR INSERT
    WITH CHECK (public.is_admin());

-- Gold rate cache
DROP POLICY IF EXISTS "Admin manages gold rate" ON gold_rate_cache;
CREATE POLICY "Admin manages gold rate"
    ON gold_rate_cache FOR ALL
    USING (public.is_admin());

-- Notification log
DROP POLICY IF EXISTS "Admin reads notifications" ON notification_log;
CREATE POLICY "Admin reads notifications"
    ON notification_log FOR SELECT
    USING (public.is_admin());
