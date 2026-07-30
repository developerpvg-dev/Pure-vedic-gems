-- Copper/Pital as fixed-sheet metal for selected ring designs.
-- Price is design making_charges (₹ total), same pattern as silver/panchdhatu.

INSERT INTO metals (name, slug, purity, price_per_gram, labor_rate_percent, pricing_mode, description, sort_order, is_active)
VALUES (
  'Copper/Pital',
  'copper_pital',
  'Alloy',
  0.00,
  NULL,
  'fixed_sheet',
  'Copper or brass (pital) — fixed design price.',
  8,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  purity = EXCLUDED.purity,
  price_per_gram = EXCLUDED.price_per_gram,
  labor_rate_percent = EXCLUDED.labor_rate_percent,
  pricing_mode = EXCLUDED.pricing_mode,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Merge copper_pital into making_charges (does not wipe other metals).
UPDATE jewelry_designs
SET making_charges = COALESCE(making_charges, '{}'::jsonb) || jsonb_build_object('copper_pital', price)
FROM (VALUES
  ('Design-1',  2000),
  ('Design-2',  2000),
  ('Design-3',  2000),
  ('Design-5',  3000),
  ('Design-6',  2500),
  ('Design-8',  3000),
  ('Design-11', 2000),
  ('Design-12', 2500),
  ('Design-37', 2500),
  ('Design-39', 2000),
  ('Design-44', 2500)
) AS t(design_name, price)
WHERE jewelry_designs.name = t.design_name
  AND jewelry_designs.setting_type = 'ring';
