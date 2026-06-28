-- Move Pitambari from Upratna to Navaratna (legacy: /product-category/navratan/pitambari/)
-- Priced Pitambari stones stay in pitambari; quote-only SKUs move to exclusive-gems like the old site.

UPDATE public.gem_categories
SET
  type = 'navaratna',
  planet = 'Jupiter & Saturn',
  description = 'Buy 100% natural Pitambari sapphire online — Sri-Lankan Pitambari Neelam for Jupiter (Guru) and Saturn (Shani).',
  sort_order = 10,
  featured_on_homepage = true,
  display_locations = 'Sri Lankan / Burma',
  updated_at = NOW()
WHERE slug = 'pitambari';

UPDATE public.products
SET
  category = 'navaratna',
  planet = COALESCE(NULLIF(TRIM(planet), ''), 'Jupiter & Saturn'),
  updated_at = NOW()
WHERE sub_category = 'pitambari'
  AND category IS DISTINCT FROM 'navaratna';

UPDATE public.products
SET
  sub_category = 'exclusive-gems',
  quality_label = COALESCE(NULLIF(TRIM(quality_label), ''), 'Exclusive'),
  updated_at = NOW()
WHERE sub_category = 'pitambari'
  AND category = 'navaratna'
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

UPDATE public.category_reviews
SET category = 'navaratna'
WHERE sub_category = 'pitambari'
  AND category = 'upratna';
