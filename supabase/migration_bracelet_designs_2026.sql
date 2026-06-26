-- Bracelet designs migrated from pandant design pvg2026 (3).xlsx → Bracelete Designs sheet
-- Labor: 22K/Platinum 20%, 18K/14K 25% (applied at pricing time on metal value)

-- Upsert by (name, setting_type) so existing product_configurations.design_id rows stay valid.

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-1.jpeg',
  description = NULL,
  making_charges = '{"silver_925":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 1,
  is_active = true
WHERE name = 'Design-1' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-1', 'bracelet', '/bracelet-designs/design-1.jpeg', NULL, '{"silver_925":10000}'::jsonb, '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb, '{}'::jsonb, 1, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-1' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-2.jpeg',
  description = NULL,
  making_charges = '{"silver_925":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 2,
  is_active = true
WHERE name = 'Design-2' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-2', 'bracelet', '/bracelet-designs/design-2.jpeg', NULL, '{"silver_925":10000}'::jsonb, '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb, '{}'::jsonb, 2, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-2' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-3.jpeg',
  description = NULL,
  making_charges = '{"silver_925":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 3,
  is_active = true
WHERE name = 'Design-3' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-3', 'bracelet', '/bracelet-designs/design-3.jpeg', NULL, '{"silver_925":10000}'::jsonb, '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb, '{}'::jsonb, 3, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-3' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-4.jpeg',
  description = NULL,
  making_charges = '{"silver_925":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 4,
  is_active = true
WHERE name = 'Design-4' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-4', 'bracelet', '/bracelet-designs/design-4.jpeg', NULL, '{"silver_925":10000}'::jsonb, '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb, '{}'::jsonb, 4, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-4' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-5.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 5,
  is_active = true
WHERE name = 'Design-5' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-5', 'bracelet', '/bracelet-designs/design-5.jpeg', NULL, '{}'::jsonb, '{"gold_14k":25,"gold_18k":25,"gold_22k":25,"platinum":20}'::jsonb, '{}'::jsonb, 5, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-5' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-6.jpeg',
  description = NULL,
  making_charges = '{"silver_925":7000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":15,"gold_18k":15,"gold_22k":15,"platinum":12}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 6,
  is_active = true
WHERE name = 'Design-6' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-6', 'bracelet', '/bracelet-designs/design-6.jpeg', NULL, '{"silver_925":7000}'::jsonb, '{"gold_14k":15,"gold_18k":15,"gold_22k":15,"platinum":12}'::jsonb, '{}'::jsonb, 6, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-6' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-7.jpeg',
  description = '18K Gold: +50000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":20,"gold_18k":20,"platinum":15}'::jsonb,
  diamond_charges = '{"gold_18k":50000}'::jsonb,
  sort_order = 7,
  is_active = true
WHERE name = 'Design-7' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-7', 'bracelet', '/bracelet-designs/design-7.jpeg', '18K Gold: +50000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":20,"gold_18k":20,"platinum":15}'::jsonb, '{"gold_18k":50000}'::jsonb, 7, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-7' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-8.jpeg',
  description = '18K Gold: +50000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":35,"gold_18k":35,"platinum":30}'::jsonb,
  diamond_charges = '{"gold_18k":50000}'::jsonb,
  sort_order = 8,
  is_active = true
WHERE name = 'Design-8' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-8', 'bracelet', '/bracelet-designs/design-8.jpeg', '18K Gold: +50000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":35,"gold_18k":35,"platinum":30}'::jsonb, '{"gold_18k":50000}'::jsonb, 8, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-8' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-9.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":20,"gold_18k":20,"gold_22k":22,"platinum":18}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 9,
  is_active = true
WHERE name = 'Design-9' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-9', 'bracelet', '/bracelet-designs/design-9.jpeg', NULL, '{}'::jsonb, '{"gold_14k":20,"gold_18k":20,"gold_22k":22,"platinum":18}'::jsonb, '{}'::jsonb, 9, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-9' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-10.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":20,"gold_18k":20,"gold_22k":20,"platinum":18}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 10,
  is_active = true
WHERE name = 'Design-10' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-10', 'bracelet', '/bracelet-designs/design-10.jpeg', NULL, '{}'::jsonb, '{"gold_14k":20,"gold_18k":20,"gold_22k":20,"platinum":18}'::jsonb, '{}'::jsonb, 10, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-10' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-11.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":20,"gold_18k":20,"gold_22k":20,"platinum":15}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 11,
  is_active = true
WHERE name = 'Design-11' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-11', 'bracelet', '/bracelet-designs/design-11.jpeg', NULL, '{}'::jsonb, '{"gold_14k":20,"gold_18k":20,"gold_22k":20,"platinum":15}'::jsonb, '{}'::jsonb, 11, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-11' AND setting_type = 'bracelet');

UPDATE jewelry_designs SET
  image_url = '/bracelet-designs/design-12.jpeg',
  description = 'Platinum: +25000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":15,"gold_18k":15,"platinum":15}'::jsonb,
  diamond_charges = '{"platinum":25000}'::jsonb,
  sort_order = 12,
  is_active = true
WHERE name = 'Design-12' AND setting_type = 'bracelet';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-12', 'bracelet', '/bracelet-designs/design-12.jpeg', 'Platinum: +25000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":15,"gold_18k":15,"platinum":15}'::jsonb, '{"platinum":25000}'::jsonb, 12, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-12' AND setting_type = 'bracelet');

-- Deactivate migrated designs removed from the source sheet (preserves FK history)
UPDATE jewelry_designs SET is_active = false
WHERE is_active = true
  AND setting_type = 'bracelet'
  AND name ~ '^Design-[0-9]+$'
  AND name NOT IN ('Design-1', 'Design-2', 'Design-3', 'Design-4', 'Design-5', 'Design-6', 'Design-7', 'Design-8', 'Design-9', 'Design-10', 'Design-11', 'Design-12');
