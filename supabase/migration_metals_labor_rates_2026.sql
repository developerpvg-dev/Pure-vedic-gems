-- Labor % for weight-based metals (gold, platinum). Silver/panchdhatu use fixed sheet prices per design.
ALTER TABLE metals
  ADD COLUMN IF NOT EXISTS labor_rate_percent DECIMAL(5, 2);

ALTER TABLE metals
  ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(20) NOT NULL DEFAULT 'weight';

COMMENT ON COLUMN metals.labor_rate_percent IS
  'Labor/making charge as % of metal value for weight-based pricing (gold, platinum). NULL for fixed-sheet metals.';

COMMENT ON COLUMN metals.pricing_mode IS
  'weight = grams × live rate + labor%; fixed_sheet = design making_charges fixed ₹ (silver, panchdhatu)';

UPDATE metals SET pricing_mode = 'weight', labor_rate_percent = 20
WHERE slug IN ('gold_22k', 'platinum');

UPDATE metals SET pricing_mode = 'weight', labor_rate_percent = 25
WHERE slug IN ('gold_18k', 'gold_14k');

UPDATE metals SET pricing_mode = 'fixed_sheet', labor_rate_percent = NULL
WHERE slug IN ('silver_925', 'panchdhatu', 'panchdhatu_with_gold');
