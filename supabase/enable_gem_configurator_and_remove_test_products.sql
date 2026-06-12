-- Enable jewellery configurator for all Navaratna and Uparatna gemstones.
UPDATE products
SET configurator_enabled = TRUE
WHERE category IN ('navaratna', 'upratna', 'uparatna');

-- Remove test products (inactive placeholders).
DELETE FROM product_configurations
WHERE product_id IN (
  SELECT id FROM products
  WHERE slug IN ('test', 'test-prod-2', 'test-ruby')
     OR sku IN ('KBS-002', 'KBS-0004', 'KBS-003')
);

DELETE FROM product_option_rules
WHERE product_id IN (
  SELECT id FROM products
  WHERE slug IN ('test', 'test-prod-2', 'test-ruby')
     OR sku IN ('KBS-002', 'KBS-0004', 'KBS-003')
);

DELETE FROM products
WHERE slug IN ('test', 'test-prod-2', 'test-ruby')
   OR sku IN ('KBS-002', 'KBS-0004', 'KBS-003');
