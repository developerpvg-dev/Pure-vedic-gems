-- Seed legacy certification labs for the configurator.

ALTER TABLE certification_labs
  ADD COLUMN IF NOT EXISTS legacy_slug VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS idx_certification_labs_legacy_slug
  ON certification_labs(legacy_slug)
  WHERE legacy_slug IS NOT NULL;

UPDATE certification_labs AS target
SET
  name = source.name,
  full_name = source.full_name,
  extra_charge = source.extra_charge,
  turnaround_days = source.turnaround_days,
  description = source.description,
  is_default = source.is_default,
  sort_order = source.sort_order,
  is_active = true
FROM (VALUES
  ('free-lab-certificate', 'Free Lab', 'Free Lab Certificate', 0::numeric, 3, 'Complimentary lab certificate option from legacy catalog.', false, 1),
  ('gtl-jaipur', 'GTL Jaipur', 'Lab Certificate - GTL Jaipur (+3 Days)', 1200::numeric, 3, 'Government testing lab certificate from Jaipur.', true, 2),
  ('igi', 'IGI', 'Lab Certificate - IGI (+2 Days)', 4000::numeric, 2, 'IGI laboratory certificate.', false, 3),
  ('igi-gtl-delhi', 'IGI-GTL Delhi', 'Certificate From IGI-GTL (DELHI) +20 DAYS+700 RS', 700::numeric, 20, 'IGI-GTL Delhi government certificate.', false, 4),
  ('igi-international', 'IGI Intl', 'Certificate From IGI (International) +25 Days +3500 Rs', 3500::numeric, 25, 'IGI international certificate.', false, 5)
) AS source(legacy_slug, name, full_name, extra_charge, turnaround_days, description, is_default, sort_order)
WHERE target.legacy_slug = source.legacy_slug;

INSERT INTO certification_labs (
  name, full_name, extra_charge, turnaround_days, description, is_default, sort_order, is_active, legacy_slug
)
SELECT source.name, source.full_name, source.extra_charge, source.turnaround_days, source.description, source.is_default, source.sort_order, true, source.legacy_slug
FROM (VALUES
  ('free-lab-certificate', 'Free Lab', 'Free Lab Certificate', 0::numeric, 3, 'Complimentary lab certificate option from legacy catalog.', false, 1),
  ('gtl-jaipur', 'GTL Jaipur', 'Lab Certificate - GTL Jaipur (+3 Days)', 1200::numeric, 3, 'Government testing lab certificate from Jaipur.', true, 2),
  ('igi', 'IGI', 'Lab Certificate - IGI (+2 Days)', 4000::numeric, 2, 'IGI laboratory certificate.', false, 3),
  ('igi-gtl-delhi', 'IGI-GTL Delhi', 'Certificate From IGI-GTL (DELHI) +20 DAYS+700 RS', 700::numeric, 20, 'IGI-GTL Delhi government certificate.', false, 4),
  ('igi-international', 'IGI Intl', 'Certificate From IGI (International) +25 Days +3500 Rs', 3500::numeric, 25, 'IGI international certificate.', false, 5)
) AS source(legacy_slug, name, full_name, extra_charge, turnaround_days, description, is_default, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM certification_labs existing WHERE existing.legacy_slug = source.legacy_slug
);
