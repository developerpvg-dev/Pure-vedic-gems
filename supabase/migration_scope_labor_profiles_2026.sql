-- Restructure labor profiles: scope (gemstone/rudraksha) → setting (ring/pendant/bracelet).
-- Legacy flat { ring, pendant, bracelet } becomes gemstone.{ring,pendant,bracelet}.

INSERT INTO commerce_settings (id, values)
VALUES ('commerce', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

UPDATE commerce_settings
SET values = CASE
  WHEN values->'jewelry_setting_metal_profiles' ? 'gemstone'
    OR values->'jewelry_setting_metal_profiles' ? 'rudraksha'
  THEN values
  WHEN values->'jewelry_setting_metal_profiles' ? 'ring'
    OR values->'jewelry_setting_metal_profiles' ? 'pendant'
    OR values->'jewelry_setting_metal_profiles' ? 'bracelet'
  THEN jsonb_set(
    COALESCE(values, '{}'::jsonb),
    '{jewelry_setting_metal_profiles}',
    jsonb_build_object(
      'gemstone', values->'jewelry_setting_metal_profiles',
      'rudraksha', '{}'::jsonb
    ),
    true
  )
  ELSE values
END,
updated_at = NOW()
WHERE id = 'commerce';
