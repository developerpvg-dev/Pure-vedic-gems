-- Correct legacy misclassification: priced navaratna/upratna gems marked on_demand
-- when Woo stored per-carat rates or total price separately.
-- True quote-only SKUs (exclusive-gems with no price) remain on_demand.

-- 1) Derive missing totals and fix price_mode for priced gemstones
UPDATE public.products
SET
  price = CASE
    WHEN (price IS NULL OR price <= 0)
      AND price_per_carat IS NOT NULL
      AND price_per_carat > 0
      AND carat_weight IS NOT NULL
      AND carat_weight > 0
      THEN ROUND(price_per_carat * carat_weight)
    ELSE COALESCE(price, 0)
  END,
  price_mode = CASE
    WHEN price_mode IN ('on_demand', 'quote_required')
      AND (
        (price IS NOT NULL AND price > 0)
        OR (
          price_per_carat IS NOT NULL
          AND price_per_carat > 0
          AND carat_weight IS NOT NULL
          AND carat_weight > 0
        )
      )
      THEN CASE
        WHEN price_per_carat IS NOT NULL
          AND price_per_carat > 0
          AND carat_weight IS NOT NULL
          AND carat_weight > 0
          THEN 'per_carat'
        ELSE 'fixed'
      END
    WHEN price_per_carat IS NOT NULL
      AND price_per_carat > 0
      AND carat_weight IS NOT NULL
      AND carat_weight > 0
      THEN 'per_carat'
    WHEN price > 0
      THEN 'fixed'
    ELSE price_mode
  END,
  updated_at = NOW()
WHERE is_active = true
  AND product_type = 'gemstone'
  AND (
    price_mode IN ('on_demand', 'quote_required')
    OR (price IS NULL OR price <= 0)
  )
  AND (
    (price_per_carat IS NOT NULL AND price_per_carat > 0 AND carat_weight IS NOT NULL AND carat_weight > 0)
    OR (price IS NOT NULL AND price > 0)
  );

-- 2) Restore stock-based availability for priced products wrongly marked on_demand
UPDATE public.products
SET
  availability_status = CASE
    WHEN in_stock = true AND COALESCE(stock_status, 'in_stock') = 'in_stock'
      THEN 'in_stock'
    ELSE 'out_of_stock'
  END,
  updated_at = NOW()
WHERE is_active = true
  AND availability_status = 'on_demand'
  AND price_mode NOT IN ('on_demand', 'quote_required')
  AND (
    price > 0
    OR (
      price_per_carat IS NOT NULL
      AND price_per_carat > 0
      AND carat_weight IS NOT NULL
      AND carat_weight > 0
    )
  );

-- 3) Ensure quote-only rows stay non-purchasable in stock flags
UPDATE public.products
SET
  in_stock = false,
  stock_quantity = 0,
  stock_status = 'out_of_stock',
  availability_status = 'on_demand',
  updated_at = NOW()
WHERE is_active = true
  AND price_mode IN ('on_demand', 'quote_required')
  AND NOT (
    price > 0
    OR (
      price_per_carat IS NOT NULL
      AND price_per_carat > 0
      AND carat_weight IS NOT NULL
      AND carat_weight > 0
    )
  );

-- 4) Move quote-only exclusive gems out of ruby/emerald grids (old site: Exclusive Gems nav only)
UPDATE public.products
SET
  sub_category = 'exclusive-gems',
  quality_label = COALESCE(NULLIF(TRIM(quality_label), ''), 'Exclusive'),
  updated_at = NOW()
WHERE is_active = true
  AND category = 'navaratna'
  AND price_mode IN ('on_demand', 'quote_required')
  AND sub_category IS DISTINCT FROM 'exclusive-gems'
  AND sub_category IN (
    'ruby', 'pearl', 'red-coral', 'emerald', 'yellow-sapphire',
    'blue-sapphire', 'hessonite', 'cats-eye', 'white-sapphire', 'diamond'
  );

-- 5) Ruby listing order from legacy purevedicgems.in category page (235 positions)
-- Regenerate JSON: npx tsx scripts/legacy-import/_parse-ruby-scrape-order.ts
-- Apply via: npx tsx scripts/db/seed-legacy-display-order.ts --write
