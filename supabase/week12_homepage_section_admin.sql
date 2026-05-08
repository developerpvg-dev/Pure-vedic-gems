-- PureVedicGems Week 12 Homepage Section Admin
-- Adds section-specific metadata for admin-managed homepage categories and product showcases.

BEGIN;

ALTER TABLE gem_categories
  ADD COLUMN IF NOT EXISTS hover_image_url TEXT;

ALTER TABLE gem_categories
  ADD COLUMN IF NOT EXISTS display_locations TEXT;

ALTER TABLE gem_categories
  ADD COLUMN IF NOT EXISTS is_rare BOOLEAN DEFAULT FALSE;

ALTER TABLE gem_categories
  ADD COLUMN IF NOT EXISTS featured_on_homepage BOOLEAN DEFAULT TRUE;

ALTER TABLE gem_categories
  DROP CONSTRAINT IF EXISTS gem_categories_type_check;

ALTER TABLE gem_categories
  ADD CONSTRAINT gem_categories_type_check
  CHECK (type IN ('navaratna', 'upratna', 'rudraksha'));

UPDATE gem_categories
SET is_rare = TRUE
WHERE type = 'rudraksha'
  AND LOWER(COALESCE(display_locations, '')) LIKE '%rare%';

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS hover_image_url TEXT;

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS homepage_subtitle TEXT;

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS homepage_badge VARCHAR(80);

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT FALSE;

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS homepage_slot VARCHAR(80);

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS cta_label VARCHAR(80);

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS accent_color VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_gem_categories_homepage
  ON gem_categories(type, featured_on_homepage, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_product_categories_homepage
  ON product_categories(homepage_slot, show_on_homepage, is_active, sort_order);

UPDATE product_categories
SET
  show_on_homepage = TRUE,
  homepage_slot = 'explore_idol',
  homepage_subtitle = COALESCE(homepage_subtitle, array_to_string(legacy_names[1:2], ' · ')),
  cta_label = COALESCE(cta_label, 'View Category')
WHERE family = 'idol'
  AND parent_id IS NOT NULL;

UPDATE product_categories
SET
  show_on_homepage = TRUE,
  homepage_slot = 'explore_jewelry',
  homepage_subtitle = COALESCE(homepage_subtitle, array_to_string(legacy_names[1:2], ' · ')),
  cta_label = COALESCE(cta_label, 'View Category')
WHERE family IN ('jewelry', 'mala')
  AND parent_id IS NOT NULL;

WITH rudraksha_parent AS (
  SELECT id FROM product_categories WHERE slug = 'rudraksha' LIMIT 1
)
INSERT INTO product_categories (
  slug,
  name,
  family,
  parent_id,
  legacy_names,
  canonical_path,
  image_url,
  homepage_subtitle,
  homepage_badge,
  show_on_homepage,
  homepage_slot,
  cta_label,
  sort_order
)
SELECT seed.slug, seed.name, seed.family, rudraksha_parent.id, seed.legacy_names, seed.canonical_path,
       seed.image_url, seed.homepage_subtitle, seed.homepage_badge, TRUE, 'rudraksha_feature', seed.cta_label, seed.sort_order
FROM rudraksha_parent
CROSS JOIN (VALUES
  (
    'rudraksha-mukhi-collection',
    '1-15 Finest Quality Rudrakshas',
    'rudraksha',
    ARRAY['1-15 Finest Quality Rudrakshas', 'Rudraksha Beads'],
    '/shop/rudraksha',
    '/home/rudrakhshas%20images/1-15%20FINEST%20QUALITY%20RUDRAKSHAS.webp',
    'Complete Mukhi range',
    'Featured',
    'Shop All',
    1
  ),
  (
    'exclusive-rudraksha-malas',
    'Exclusive Rudraksha Malas',
    'rudraksha',
    ARRAY['Exclusive Rudraksha Malas', 'Rudraksha Mala'],
    '/shop/exclusive-rudraksha-malas',
    '/home/rudrakhshas%20images/EXCLUSIVE%20RUDRAKSHA%20MALAS.webp',
    'Energized malas',
    'Featured',
    'Shop Malas',
    2
  ),
  (
    'rudraksha-jewelry',
    'Customised Rudraksha Jewelleries',
    'jewelry',
    ARRAY['Customised Rudraksha Jewelleries', 'Ready Rudraksha Jewelry'],
    '/shop/rudraksha-jewelry',
    '/home/rudrakhshas%20images/CUSTOMISED%20RUDRAKSHA%20JEWELLERIES.webp',
    'Custom settings',
    'Featured',
    'Shop Jewellery',
    3
  )
) AS seed(slug, name, family, legacy_names, canonical_path, image_url, homepage_subtitle, homepage_badge, cta_label, sort_order)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  image_url = COALESCE(product_categories.image_url, EXCLUDED.image_url),
  homepage_subtitle = COALESCE(product_categories.homepage_subtitle, EXCLUDED.homepage_subtitle),
  homepage_badge = COALESCE(product_categories.homepage_badge, EXCLUDED.homepage_badge),
  show_on_homepage = TRUE,
  homepage_slot = 'rudraksha_feature',
  cta_label = COALESCE(product_categories.cta_label, EXCLUDED.cta_label),
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

COMMIT;
