-- Align Padparadscha Sapphire with other Navaratna category cards (planet, origin line, sort).

UPDATE public.gem_categories
SET
  type = 'navaratna',
  sanskrit_name = COALESCE(NULLIF(TRIM(sanskrit_name), ''), 'Padmaraga'),
  planet = COALESCE(NULLIF(TRIM(planet), ''), 'Venus'),
  description = COALESCE(
    NULLIF(TRIM(description), ''),
    'Natural padparadscha sapphire (Padmaraga) for Shukra — lotus pink-orange corundum with lab colour and heat disclosure.'
  ),
  display_locations = COALESCE(NULLIF(TRIM(display_locations), ''), 'Sri Lanka · Madagascar'),
  color = COALESCE(NULLIF(TRIM(color), ''), '#E88B6A'),
  sort_order = 11,
  featured_on_homepage = true,
  updated_at = NOW()
WHERE slug = 'padparadscha-sapphire';

UPDATE public.products
SET
  category = 'navaratna',
  planet = COALESCE(NULLIF(TRIM(planet), ''), 'Venus'),
  updated_at = NOW()
WHERE sub_category = 'padparadscha-sapphire'
  AND category IS DISTINCT FROM 'navaratna';
