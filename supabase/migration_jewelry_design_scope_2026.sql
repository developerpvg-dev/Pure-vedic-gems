-- Scope jewelry designs to gemstone vs rudraksha configurator flows
ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS product_scope VARCHAR(20) NOT NULL DEFAULT 'gemstone';

ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS rudraksha_category VARCHAR(50);

COMMENT ON COLUMN jewelry_designs.product_scope IS
  'gemstone = gem ring/pendant/bracelet designs; rudraksha = rudraksha mounting designs only';

COMMENT ON COLUMN jewelry_designs.rudraksha_category IS
  'one_mukhi | standard_mukhi | multiple_beads — which rudraksha bead types this mounting applies to';

UPDATE jewelry_designs
SET product_scope = 'rudraksha'
WHERE name LIKE 'Rudraksha - %'
  AND product_scope = 'gemstone';

UPDATE jewelry_designs
SET rudraksha_category = 'one_mukhi'
WHERE name = 'Rudraksha - One Mukhi';

UPDATE jewelry_designs
SET rudraksha_category = 'standard_mukhi'
WHERE name LIKE 'Rudraksha - 2 to 17%';

UPDATE jewelry_designs
SET rudraksha_category = 'multiple_beads'
WHERE name LIKE 'Rudraksha - Multiple%';

UPDATE jewelry_designs
SET product_scope = 'gemstone', rudraksha_category = NULL
WHERE name NOT LIKE 'Rudraksha - %'
  AND product_scope = 'rudraksha';

-- Required for admin design editor (on_request / unavailable per metal)
ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS metal_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN jewelry_designs.metal_flags IS
  'Per-metal overrides, e.g. {"platinum":"on_request"}. Absent metals infer from making_charges / estimated_metal_weight.';
