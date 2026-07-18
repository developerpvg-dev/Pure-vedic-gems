-- Week 34: Value-based India / International shipping tiers.
-- Replaces speed-tier plans with order-value bands (editable in admin).

INSERT INTO shipping_countries (code, name, requires_indian_pincode, sort_order)
VALUES ('XX', 'International (all non-India)', FALSE, 900)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  requires_indian_pincode = EXCLUDED.requires_indian_pincode,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();

-- Retire every previously seeded / legacy plan.
UPDATE shipping_methods
SET is_active = FALSE, updated_at = NOW()
WHERE is_active = TRUE;

INSERT INTO shipping_methods (
  id, label, description, cost, free_above,
  min_order_amount, max_order_amount,
  estimated_days_min, estimated_days_max,
  zones, country_code, is_active, sort_order
) VALUES
  (
    'in_upto_25000',
    'India shipping (orders up to ₹25,000)',
    'Insured domestic shipping for orders up to ₹25,000.',
    500, NULL, NULL, 25000, 5, 8,
    ARRAY['IN']::TEXT[], 'IN', TRUE, 10
  ),
  (
    'in_above_25000',
    'India shipping (orders above ₹25,000)',
    'Insured domestic shipping for orders above ₹25,000.',
    1500, NULL, 25001, NULL, 5, 8,
    ARRAY['IN']::TEXT[], 'IN', TRUE, 20
  ),
  (
    'xx_upto_25000',
    'International shipping (orders up to ₹25,000)',
    'Tracked international shipping for orders up to ₹25,000.',
    3000, NULL, NULL, 25000, 10, 16,
    ARRAY['XX']::TEXT[], 'XX', TRUE, 10
  ),
  (
    'xx_above_25000',
    'International shipping (orders above ₹25,000)',
    'Tracked international shipping for orders above ₹25,000.',
    10000, NULL, 25001, NULL, 10, 16,
    ARRAY['XX']::TEXT[], 'XX', TRUE, 20
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
