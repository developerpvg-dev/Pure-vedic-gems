-- Seed legacy energization options from the old WooCommerce catalog.

ALTER TABLE energization_options
  ADD COLUMN IF NOT EXISTS legacy_slug VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS idx_energization_options_legacy_slug
  ON energization_options(legacy_slug)
  WHERE legacy_slug IS NOT NULL;

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
  ('prana-pratishta-pooja', 'Prana Pratishta Pooja', 'Traditional Vedic prana pratishta ceremony to activate the gemstone.', 2100::numeric, '2 hours', '["Prana pratishta ritual","Vedic mantra chanting","Gemstone energization"]', false, 1),
  ('prana-pratishta-live-streaming', 'Prana Pratishta Pooja (Live Streaming)', 'Prana pratishta ceremony with live streaming so you can attend remotely.', 3500::numeric, '2 hours', '["Prana pratishta ritual","Live streaming access","Vedic mantra chanting"]', false, 2),
  ('prana-pratishta-with-video', 'Prana Pratishta Pooja (With Video)', 'Prana pratishta ceremony with recorded video documentation.', 3100::numeric, '2 hours', '["Prana pratishta ritual","Recorded video","Vedic mantra chanting"]', true, 3),
  ('vedic-pooja', 'Vedic Pooja', 'Classical Vedic pooja for gemstone purification and blessing.', 1100::numeric, '1 hour', '["Vedic pooja ceremony","Mantra chanting","Energization blessing"]', false, 4),
  ('vedic-pooja-with-video', 'Vedic Pooja (With Video)', 'Vedic pooja with recorded video of the complete ceremony.', 2100::numeric, '1 hour', '["Vedic pooja ceremony","Recorded video","Mantra chanting"]', true, 5)
) AS source(legacy_slug, name, description, price, duration, includes, includes_video, sort_order)
WHERE target.legacy_slug = source.legacy_slug;

INSERT INTO energization_options (
  name, description, price, duration, includes, includes_video, sort_order, is_active, legacy_slug
)
SELECT source.name, source.description, source.price, source.duration, source.includes::jsonb, source.includes_video, source.sort_order, true, source.legacy_slug
FROM (VALUES
  ('prana-pratishta-pooja', 'Prana Pratishta Pooja', 'Traditional Vedic prana pratishta ceremony to activate the gemstone.', 2100::numeric, '2 hours', '["Prana pratishta ritual","Vedic mantra chanting","Gemstone energization"]', false, 1),
  ('prana-pratishta-live-streaming', 'Prana Pratishta Pooja (Live Streaming)', 'Prana pratishta ceremony with live streaming so you can attend remotely.', 3500::numeric, '2 hours', '["Prana pratishta ritual","Live streaming access","Vedic mantra chanting"]', false, 2),
  ('prana-pratishta-with-video', 'Prana Pratishta Pooja (With Video)', 'Prana pratishta ceremony with recorded video documentation.', 3100::numeric, '2 hours', '["Prana pratishta ritual","Recorded video","Vedic mantra chanting"]', true, 3),
  ('vedic-pooja', 'Vedic Pooja', 'Classical Vedic pooja for gemstone purification and blessing.', 1100::numeric, '1 hour', '["Vedic pooja ceremony","Mantra chanting","Energization blessing"]', false, 4),
  ('vedic-pooja-with-video', 'Vedic Pooja (With Video)', 'Vedic pooja with recorded video of the complete ceremony.', 2100::numeric, '1 hour', '["Vedic pooja ceremony","Recorded video","Mantra chanting"]', true, 5)
) AS source(legacy_slug, name, description, price, duration, includes, includes_video, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM energization_options existing WHERE existing.legacy_slug = source.legacy_slug
);

-- Deactivate non-legacy placeholder options that do not match the old catalog.
UPDATE energization_options
SET is_active = false
WHERE legacy_slug IS NULL
   OR legacy_slug NOT IN (
     'prana-pratishta-pooja',
     'prana-pratishta-live-streaming',
     'prana-pratishta-with-video',
     'vedic-pooja',
     'vedic-pooja-with-video'
   );
