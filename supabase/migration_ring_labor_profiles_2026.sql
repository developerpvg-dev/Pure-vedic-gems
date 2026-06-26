-- Ring labor % (gemstone scope) from PVG Ring Designs 2026 sheet.
-- 22K Gold & Platinum: 20% | 18K & 14K Gold: 25%

INSERT INTO commerce_settings (id, values)
VALUES ('commerce', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

UPDATE commerce_settings
SET values = jsonb_set(
  COALESCE(values, '{}'::jsonb),
  '{jewelry_setting_metal_profiles}',
  COALESCE(values->'jewelry_setting_metal_profiles', '{}'::jsonb) || jsonb_build_object(
    'gemstone',
    COALESCE(values->'jewelry_setting_metal_profiles'->'gemstone', '{}'::jsonb) || jsonb_build_object(
      'ring',
      jsonb_build_object(
        'default_gst_percent',
        COALESCE(
          (values->'jewelry_setting_metal_profiles'->'gemstone'->'ring'->>'default_gst_percent')::numeric,
          (values->'jewelry_setting_metal_profiles'->'ring'->>'default_gst_percent')::numeric,
          (values->>'jewelry_gst_rate_percent')::numeric,
          3
        ),
        'labor_rates',
        jsonb_build_object(
          'gold_22k', 20,
          'gold_18k', 25,
          'gold_14k', 25,
          'platinum', 20
        ),
        'gst_rates',
        COALESCE(
          values->'jewelry_setting_metal_profiles'->'gemstone'->'ring'->'gst_rates',
          values->'jewelry_setting_metal_profiles'->'ring'->'gst_rates',
          '{}'::jsonb
        )
      )
    )
  ),
  true
),
updated_at = NOW()
WHERE id = 'commerce';

UPDATE jewelry_designs
SET labor_rates = jsonb_build_object(
  'gold_22k', 20,
  'gold_18k', 25,
  'gold_14k', 25,
  'platinum', 20
)
WHERE setting_type = 'ring'
  AND product_scope = 'gemstone'
  AND (labor_rates IS NULL OR labor_rates = '{}'::jsonb);
