-- ⚠️ DEFERRED — DO NOT RUN while Disk IO budget is exhausted
-- This rewrites the entire products table and WILL timeout under load.
-- Run only after:
--   1. Disk IO warning is gone from Supabase dashboard
--   2. Low-traffic window (e.g. 2–5 AM IST)
--   3. Steps 1–4 already applied
--
-- Optional: improves PostgREST textSearch() on products.search_vector column.

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(sku, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tag_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(vedic_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(origin, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(planet, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(short_desc, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN (search_vector);
