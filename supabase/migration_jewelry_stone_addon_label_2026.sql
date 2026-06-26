-- Optional label for design-wide stone/gem add-on (e.g. Diamond, Ruby, Emerald).
ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS stone_addon_label TEXT;

COMMENT ON COLUMN jewelry_designs.stone_addon_label IS
  'Display name for design-wide extra stone charge in diamond_charges JSONB. Defaults to Diamond when charges exist.';

UPDATE jewelry_designs
SET stone_addon_label = 'Diamond'
WHERE stone_addon_label IS NULL
  AND diamond_charges IS NOT NULL
  AND diamond_charges::text <> '{}'
  AND diamond_charges::text <> 'null';
