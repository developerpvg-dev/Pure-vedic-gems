-- Week 36: shrink pooja catalog to Skip + With Video + With picture (both ₹2100).
-- Safe to re-run. Apply in Supabase SQL editor (or via seed-energization-options.ts --write).

UPDATE energization_options AS target
SET
  name = source.name,
  description = source.description,
  price = source.price,
  duration = source.duration,
  includes = source.includes::jsonb,
  includes_video = source.includes_video,
  sort_order = source.sort_order,
  is_active = true
FROM (VALUES
  ('prana-pratishta-with-video', 'Prana Pratishta Pooja (With Video)', 'Prana pratishta ceremony with recorded video documentation.', 2100::numeric, '2 hours', '["Prana pratishta ritual","Recorded video","Vedic mantra chanting"]', true, 1),
  ('prana-pratishta-with-picture', 'Prana Pratishta Pooja (With picture)', 'Prana pratishta ceremony with photographic documentation.', 1500::numeric, '2 hours', '["Prana pratishta ritual","Photo documentation","Vedic mantra chanting"]', false, 2)
) AS source(legacy_slug, name, description, price, duration, includes, includes_video, sort_order)
WHERE target.legacy_slug = source.legacy_slug;

INSERT INTO energization_options (
  name, description, price, duration, includes, includes_video, sort_order, is_active, legacy_slug
)
SELECT source.name, source.description, source.price, source.duration, source.includes::jsonb, source.includes_video, source.sort_order, true, source.legacy_slug
FROM (VALUES
  ('prana-pratishta-with-video', 'Prana Pratishta Pooja (With Video)', 'Prana pratishta ceremony with recorded video documentation.', 2100::numeric, '2 hours', '["Prana pratishta ritual","Recorded video","Vedic mantra chanting"]', true, 1),
  ('prana-pratishta-with-picture', 'Prana Pratishta Pooja (With picture)', 'Prana pratishta ceremony with photographic documentation.', 1500::numeric, '2 hours', '["Prana pratishta ritual","Photo documentation","Vedic mantra chanting"]', false, 2)
) AS source(legacy_slug, name, description, price, duration, includes, includes_video, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM energization_options existing WHERE existing.legacy_slug = source.legacy_slug
);

UPDATE energization_options
SET is_active = false
WHERE legacy_slug IS NULL
   OR legacy_slug NOT IN (
     'prana-pratishta-with-video',
     'prana-pratishta-with-picture'
   );

UPDATE product_option_rules
SET
  allowed_energization_option_ids = (
    SELECT COALESCE(array_agg(id ORDER BY sort_order), ARRAY[]::uuid[])
    FROM energization_options
    WHERE is_active = true
  ),
  updated_at = NOW()
WHERE energization_enabled = true;
