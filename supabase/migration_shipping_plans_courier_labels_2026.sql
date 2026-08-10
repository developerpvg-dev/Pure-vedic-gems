-- Update up-to-₹25,000 shipping plans with courier labels / rates.
-- IN: DTDC/Blue Dart ₹500 (5–6 days). XX: UPS ₹5500 (6–7 days).

INSERT INTO shipping_methods (
  id, label, description, cost, free_above,
  min_order_amount, max_order_amount,
  estimated_days_min, estimated_days_max,
  zones, country_code, is_active, sort_order
) VALUES
  (
    'in_upto_25000',
    'Shipping Via DTDC/Blue Dart',
    'Domestic Shipping for orders up to ₹25,000',
    500, NULL, NULL, 25000, 5, 6,
    ARRAY['IN']::TEXT[], 'IN', TRUE, 10
  ),
  (
    'xx_upto_25000',
    'Shipping Via UPS',
    'Tracked international shipping for orders up to ₹25,000',
    5500, NULL, NULL, 25000, 6, 7,
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
