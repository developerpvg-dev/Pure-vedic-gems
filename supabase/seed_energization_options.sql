-- Seed default energization options
-- Run this in Supabase SQL editor

INSERT INTO energization_options (name, description, price, duration, includes, includes_video, sort_order, is_active)
VALUES
  (
    'Basic Purification',
    'Complimentary basic purification ritual performed with Vedic mantras to cleanse and activate the gemstone energy.',
    0,
    '30 minutes',
    '["Vedic mantra chanting", "Basic purification ritual", "Energization blessing"]',
    false,
    1,
    true
  ),
  (
    'Special Energisation with Pictures',
    'Detailed energization ceremony with complete photographic documentation sent to you.',
    1500,
    '2 hours',
    '["Full Vedic pooja ceremony", "Navagraha mantra chanting", "Gemstone abhisheka", "Complete photo documentation", "Energization certificate"]',
    false,
    2,
    true
  ),
  (
    'Special Energisation with Video',
    'Premium energization ceremony with full HD video recording of the complete pooja process.',
    2100,
    '2 hours',
    '["Full Vedic pooja ceremony", "Navagraha mantra chanting", "Gemstone abhisheka", "Complete photo documentation", "Full HD video recording", "Energization certificate"]',
    true,
    3,
    true
  )
ON CONFLICT DO NOTHING;
