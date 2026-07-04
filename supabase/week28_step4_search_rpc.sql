-- STEP 4 of 4 — fast product search via existing GIN index (no table rewrite)
-- Uses idx_products_search expression index if present; safe to run under load.

CREATE OR REPLACE FUNCTION search_products(p_query text, p_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  category text,
  price numeric,
  thumbnail_url text,
  origin text,
  planet text,
  tag_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (
    SELECT nullif(trim(p_query), '') AS raw
  ),
  ts AS (
    SELECT websearch_to_tsquery('english', q.raw) AS query
    FROM q
    WHERE q.raw IS NOT NULL
  )
  SELECT
    p.id,
    p.slug,
    p.name,
    p.category,
    p.price,
    p.thumbnail_url,
    p.origin,
    p.planet,
    p.tag_number
  FROM products p, ts
  WHERE p.is_active = true
    AND (
      to_tsvector(
        'english',
        coalesce(p.name, '') || ' ' ||
        coalesce(p.vedic_name, '') || ' ' ||
        coalesce(p.origin, '') || ' ' ||
        coalesce(p.planet, '') || ' ' ||
        coalesce(p.short_desc, '') || ' ' ||
        coalesce(p.sku, '') || ' ' ||
        coalesce(p.tag_number, '')
      ) @@ ts.query
      OR p.sku ILIKE '%' || (SELECT raw FROM q) || '%'
      OR p.tag_number ILIKE '%' || (SELECT raw FROM q) || '%'
    )
  ORDER BY p.featured DESC NULLS LAST, p.price ASC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 10), 25));
$$;

GRANT EXECUTE ON FUNCTION search_products(text, int) TO anon, authenticated, service_role;
