-- Rudraksha pendant labor % — 14K & 18K @ rate + 25% + GST 3% | 22K @ rate + 20% + GST 3%

INSERT INTO commerce_settings (id, values)
VALUES ('commerce', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

UPDATE commerce_settings
SET values = jsonb_set(
  COALESCE(values, '{}'::jsonb),
  '{jewelry_setting_metal_profiles}',
  COALESCE(values->'jewelry_setting_metal_profiles', '{}'::jsonb) || jsonb_build_object(
    'rudraksha',
    COALESCE(values->'jewelry_setting_metal_profiles'->'rudraksha', '{}'::jsonb) || jsonb_build_object(
      'pendant',
      jsonb_build_object(
        'default_gst_percent',
        COALESCE(
          (values->'jewelry_setting_metal_profiles'->'rudraksha'->'pendant'->>'default_gst_percent')::numeric,
          3
        ),
        'labor_rates',
        jsonb_build_object(
          'gold_14k', 25,
          'gold_18k', 25,
          'gold_22k', 20
        ),
        'gst_rates',
        COALESCE(
          values->'jewelry_setting_metal_profiles'->'rudraksha'->'pendant'->'gst_rates',
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
  'gold_14k', 25,
  'gold_18k', 25,
  'gold_22k', 20
)
WHERE setting_type = 'pendant'
  AND product_scope = 'rudraksha'
  AND (labor_rates IS NULL OR labor_rates = '{}'::jsonb);
