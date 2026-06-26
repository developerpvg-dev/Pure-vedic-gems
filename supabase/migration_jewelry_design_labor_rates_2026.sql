-- Labor % is per jewelry design (ring / pendant / bracelet), not global on metals.
ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS labor_rates JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN jewelry_designs.labor_rates IS
  'Per-metal labor % for this design, e.g. {"gold_18k": 25, "gold_22k": 20}. Weight-based metals only.';
