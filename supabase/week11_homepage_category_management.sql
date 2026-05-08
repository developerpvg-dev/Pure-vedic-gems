-- PureVedicGems Week 11 Homepage Category Management
-- Extends admin-managed categories for homepage Navaratna, Rudraksha, and Uparatna sections.

BEGIN;

ALTER TABLE gem_categories
  ADD COLUMN IF NOT EXISTS hover_image_url TEXT;

ALTER TABLE gem_categories
  ADD COLUMN IF NOT EXISTS display_locations TEXT;

ALTER TABLE gem_categories
  DROP CONSTRAINT IF EXISTS gem_categories_type_check;

ALTER TABLE gem_categories
  ADD CONSTRAINT gem_categories_type_check
  CHECK (type IN ('navaratna', 'upratna', 'rudraksha'));

INSERT INTO gem_categories (name, slug, type, sanskrit_name, planet, color, image_url, display_locations, description, sort_order)
VALUES
  ('15 Mukhi', '15-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/15mukhirudraksha.webp', 'Rare', 'Rare 15 Mukhi Rudraksha bead category.', 1),
  ('16 Mukhi', '16-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/16Mukhi%20rudraksha.webp', 'Rare', 'Rare 16 Mukhi Rudraksha bead category.', 2),
  ('17 Mukhi', '17-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/17Mukhi%20rudraksha.webp', 'Rare', 'Rare 17 Mukhi Rudraksha bead category.', 3),
  ('18 Mukhi', '18-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/18Mukhi%20rudraksha.webp', 'Rare', 'Rare 18 Mukhi Rudraksha bead category.', 4),
  ('19 Mukhi', '19-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/19Mukhi%20rudraksha.webp', 'Rare', 'Rare 19 Mukhi Rudraksha bead category.', 5),
  ('21 Mukhi', '21-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/21Mukhi%20Rudraksha.webp', 'Rare', 'Rare 21 Mukhi Rudraksha bead category.', 6),
  ('1 Mukhi', '1-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/1Mukhi-150x150.jpg', 'Classic', 'Classic 1 Mukhi Rudraksha bead category.', 7),
  ('2 Mukhi', '2-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/2Mukhi-150x150.jpg', 'Classic', 'Classic 2 Mukhi Rudraksha bead category.', 8),
  ('3 Mukhi', '3-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/3Mukhi-150x150.jpg', 'Classic', 'Classic 3 Mukhi Rudraksha bead category.', 9),
  ('4 Mukhi', '4-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/4Mukhi-150x150.jpg', 'Classic', 'Classic 4 Mukhi Rudraksha bead category.', 10),
  ('5 Mukhi', '5-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/5Mukhi-150x150.jpg', 'Classic', 'Classic 5 Mukhi Rudraksha bead category.', 11),
  ('6 Mukhi', '6-mukhi', 'rudraksha', NULL, NULL, NULL, '/home/rudrakhshas%20images/6Mukhi-150x150.jpg', 'Classic', 'Classic 6 Mukhi Rudraksha bead category.', 12)
ON CONFLICT (slug) DO UPDATE SET
  type = EXCLUDED.type,
  image_url = COALESCE(gem_categories.image_url, EXCLUDED.image_url),
  display_locations = COALESCE(gem_categories.display_locations, EXCLUDED.display_locations),
  description = COALESCE(gem_categories.description, EXCLUDED.description),
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

COMMIT;