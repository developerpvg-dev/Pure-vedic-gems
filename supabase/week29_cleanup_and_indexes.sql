-- ============================================================================
-- Week 29: Legacy cleanup + hot-path indexes
-- Run AFTER week28 steps 1a–4 succeed.
--
-- IMPORTANT — Supabase SQL Editor runs scripts inside a transaction.
-- CREATE INDEX CONCURRENTLY is NOT allowed in a transaction, so Section 3
-- uses regular CREATE INDEX (safe for your DB size; completes in seconds).
-- Run sections separately: 1 → optional 2 → 3 → 4
-- ============================================================================

-- ── Section 1: Verify legacy data is no longer needed ──────────────────────
SELECT table_schema, table_name, pg_size_pretty(pg_total_relation_size(format('%I.%I', table_schema, table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'legacy_import'
ORDER BY pg_total_relation_size(format('%I.%I', table_schema, table_name)) DESC;

-- ── Section 2: Drop legacy import staging (frees ~110 MB) ──────────────────
-- ONLY run after Section 1 confirms you no longer need WordPress staging data.
-- DROP SCHEMA legacy_import CASCADE;

-- ── Section 3: Hot-path indexes (run this block as one script) ─────────────
-- Regular CREATE INDEX works inside Supabase's transaction wrapper.
-- IF NOT EXISTS makes re-runs safe.
CREATE INDEX IF NOT EXISTS idx_products_active_category
  ON public.products (category, sub_category)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON public.products (created_at DESC)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_price
  ON public.products (price)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_directors_pick
  ON public.products (display_order)
  WHERE is_active = true AND is_directors_pick = true;

CREATE INDEX IF NOT EXISTS idx_products_active_slug
  ON public.products (slug)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_shop_category_pages_active_slug
  ON public.shop_category_pages (slug)
  WHERE is_active = true;

-- ── Section 4: Refresh planner statistics ───────────────────────────────────
ANALYZE public.products;
ANALYZE public.shop_category_pages;
