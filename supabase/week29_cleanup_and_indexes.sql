-- ============================================================================
-- Week 29: Legacy cleanup + hot-path indexes
-- Run AFTER the site is confirmed working and the WordPress migration is done.
-- Run each section separately in the SQL Editor. All statements are cheap
-- except the index builds, which use CONCURRENTLY to avoid locking traffic.
-- ============================================================================

-- ── Section 1: Verify legacy data is no longer needed ──────────────────────
-- Look at these tables first. If you don't recognise or need the data, they
-- are just import staging leftovers wasting ~110 MB of disk and cache.
SELECT table_schema, table_name, pg_size_pretty(pg_total_relation_size(format('%I.%I', table_schema, table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'legacy_import'
ORDER BY pg_total_relation_size(format('%I.%I', table_schema, table_name)) DESC;

-- ── Section 2: Drop legacy import staging (frees ~110 MB) ──────────────────
-- ONLY run after confirming Section 1 shows data you no longer need.
-- DROP SCHEMA legacy_import CASCADE;

-- ── Section 3: Hot-path indexes for storefront queries ──────────────────────
-- These cover the most frequent shop filters: active + category/sub_category,
-- plus sorted listings. IF NOT EXISTS makes re-runs safe.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_category
  ON public.products (category, sub_category)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created
  ON public.products (created_at DESC)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_price
  ON public.products (price)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_directors_pick
  ON public.products (display_order)
  WHERE is_active = true AND is_directors_pick = true;

-- Slug lookups for product detail pages.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_slug
  ON public.products (slug)
  WHERE is_active = true;

-- Category hub page lookups.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shop_category_pages_active_slug
  ON public.shop_category_pages (slug)
  WHERE is_active = true;

-- ── Section 4: Refresh planner statistics ───────────────────────────────────
ANALYZE public.products;
ANALYZE public.shop_category_pages;
