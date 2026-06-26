-- Pendant & bracelet labor % (gemstone scope).
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
      'pendant',
      jsonb_build_object(
        'default_gst_percent', 3,
        'labor_rates',
        jsonb_build_object(
          'gold_22k', 20,
          'gold_18k', 25,
          'gold_14k', 25,
          'platinum', 20
        ),
        'gst_rates', '{}'::jsonb
      ),
      'bracelet',
      jsonb_build_object(
        'default_gst_percent', 3,
        'labor_rates',
        jsonb_build_object(
          'gold_22k', 20,
          'gold_18k', 25,
          'gold_14k', 25,
          'platinum', 20
        ),
        'gst_rates', '{}'::jsonb
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
WHERE setting_type IN ('pendant', 'bracelet')
  AND product_scope = 'gemstone'
  AND (labor_rates IS NULL OR labor_rates = '{}'::jsonb);
