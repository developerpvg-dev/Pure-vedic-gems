-- Per-metal diamond setting add-ons (from Excel column D notes like "+17500 diamonds cost")
ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS diamond_charges jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN jewelry_designs.diamond_charges IS
  'Fixed rupee diamond add-on per metal slug when that metal is selected (e.g. {"gold_18k":17500})';
