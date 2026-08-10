-- India Post (domestic) + EMS India Post (international) value tiers up to ₹25,000.

INSERT INTO shipping_methods (
  id, label, description, cost, free_above,
  min_order_amount, max_order_amount,
  estimated_days_min, estimated_days_max,
  zones, country_code, is_active, sort_order
) VALUES
  (
    'do_upto_25000',
    'Shipping Via India Post Speed Post Service',
    'Domestic Shipping for orders up to ₹25,000',
    200, NULL, NULL, 25000, 6, 7,
    ARRAY['IN']::TEXT[], 'IN', TRUE, 9
  ),
  (
    'xx_ems_upto_25000',
    'Shipping Via EMS India Post Speed Post Service',
    'Tracked international shipping for orders up to ₹25,000',
    2500, NULL, NULL, 25000, 12, 15,
    ARRAY['XX']::TEXT[], 'XX', TRUE, 11
  )
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  cost = EXCLUDED.cost,
  free_above = NULL,
  min_order_amount = EXCLUDED.min_order_amount,
  max_order_amount = EXCLUDED.max_order_amount,
  estimated_days_min = EXCLUDED.estimated_days_min,
  estimated_days_max = EXCLUDED.estimated_days_max,
  zones = EXCLUDED.zones,
  country_code = EXCLUDED.country_code,
  is_active = TRUE,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
