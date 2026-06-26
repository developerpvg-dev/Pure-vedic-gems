-- Rudraksha jewelry designs migrated from pandant design pvg2026 (3).xlsx → Sheet1
-- Labor: 22K 20%, 14K/18K 25% (applied at pricing time on metal value)
-- setting_type pendant: Rudraksha mountings shown in pendant design picker

-- Upsert by (name, setting_type) so existing product_configurations.design_id rows stay valid.

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-1.jpeg',
  description = 'One Mukhi Rudraksha mounting',
  making_charges = '{"silver_925":3500}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4.5,"gold_18k":4.5,"gold_22k":5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'one_mukhi',
  sort_order = 1,
  is_active = true
WHERE name = 'Rudraksha - One Mukhi' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - One Mukhi', 'pendant', '/rudraksha-designs/design-1.jpeg', 'One Mukhi Rudraksha mounting', '{"silver_925":3500}'::jsonb, '{"gold_14k":4.5,"gold_18k":4.5,"gold_22k":5}'::jsonb, '{}'::jsonb, 'rudraksha', 'one_mukhi', 1, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - One Mukhi' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-2.jpeg',
  description = '2 to 17 Mukhi, Ganesh & Gauri Shankar (round & oval shapes)',
  making_charges = '{"silver_925":2000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":1.5,"gold_18k":1.5,"gold_22k":2}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'standard_mukhi',
  sort_order = 2,
  is_active = true
WHERE name = 'Rudraksha - 2 to 17 Mukhi, Ganesh & Gauri Shankar' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - 2 to 17 Mukhi, Ganesh & Gauri Shankar', 'pendant', '/rudraksha-designs/design-2.jpeg', '2 to 17 Mukhi, Ganesh & Gauri Shankar (round & oval shapes)', '{"silver_925":2000}'::jsonb, '{"gold_14k":1.5,"gold_18k":1.5,"gold_22k":2}'::jsonb, '{}'::jsonb, 'rudraksha', 'standard_mukhi', 2, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - 2 to 17 Mukhi, Ganesh & Gauri Shankar' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-3.jpeg',
  description = 'Multiple Rudraksha combinations (3 or more beads)',
  making_charges = '{"silver_925":4000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4.5,"gold_18k":4.5,"gold_22k":5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'multiple_beads',
  sort_order = 3,
  is_active = true
WHERE name = 'Rudraksha - Multiple Beads (3+)' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - Multiple Beads (3+)', 'pendant', '/rudraksha-designs/design-3.jpeg', 'Multiple Rudraksha combinations (3 or more beads)', '{"silver_925":4000}'::jsonb, '{"gold_14k":4.5,"gold_18k":4.5,"gold_22k":5}'::jsonb, '{}'::jsonb, 'rudraksha', 'multiple_beads', 3, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - Multiple Beads (3+)' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-4.jpeg',
  description = 'Multiple Rudraksha combinations (3 or more beads)',
  making_charges = '{"silver_925":4000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'multiple_beads',
  sort_order = 4,
  is_active = true
WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 2' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - Multiple Beads (3+) - Style 2', 'pendant', '/rudraksha-designs/design-4.jpeg', 'Multiple Rudraksha combinations (3 or more beads)', '{"silver_925":4000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5.5}'::jsonb, '{}'::jsonb, 'rudraksha', 'multiple_beads', 4, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 2' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-5.jpeg',
  description = 'Multiple Rudraksha combinations (3 or more beads)',
  making_charges = '{"silver_925":5000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'multiple_beads',
  sort_order = 5,
  is_active = true
WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 3' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - Multiple Beads (3+) - Style 3', 'pendant', '/rudraksha-designs/design-5.jpeg', 'Multiple Rudraksha combinations (3 or more beads)', '{"silver_925":5000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5.5}'::jsonb, '{}'::jsonb, 'rudraksha', 'multiple_beads', 5, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 3' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-6.jpeg',
  description = 'Multiple Rudraksha combinations (3 or more beads)',
  making_charges = '{"silver_925":3500}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3,"gold_18k":3,"gold_22k":3.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'multiple_beads',
  sort_order = 6,
  is_active = true
WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 4' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - Multiple Beads (3+) - Style 4', 'pendant', '/rudraksha-designs/design-6.jpeg', 'Multiple Rudraksha combinations (3 or more beads)', '{"silver_925":3500}'::jsonb, '{"gold_14k":3,"gold_18k":3,"gold_22k":3.5}'::jsonb, '{}'::jsonb, 'rudraksha', 'multiple_beads', 6, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 4' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-7.jpeg',
  description = 'Multiple Rudraksha combinations (3 or more beads)',
  making_charges = '{"silver_925":5500}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"gold_22k":4.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'multiple_beads',
  sort_order = 7,
  is_active = true
WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 5' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - Multiple Beads (3+) - Style 5', 'pendant', '/rudraksha-designs/design-7.jpeg', 'Multiple Rudraksha combinations (3 or more beads)', '{"silver_925":5500}'::jsonb, '{"gold_14k":4,"gold_18k":4,"gold_22k":4.5}'::jsonb, '{}'::jsonb, 'rudraksha', 'multiple_beads', 7, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 5' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-8.jpeg',
  description = 'Multiple Rudraksha combinations (3 or more beads)',
  making_charges = '{"silver_925":4000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3.5,"gold_18k":3.5,"gold_22k":4}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'multiple_beads',
  sort_order = 8,
  is_active = true
WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 6' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - Multiple Beads (3+) - Style 6', 'pendant', '/rudraksha-designs/design-8.jpeg', 'Multiple Rudraksha combinations (3 or more beads)', '{"silver_925":4000}'::jsonb, '{"gold_14k":3.5,"gold_18k":3.5,"gold_22k":4}'::jsonb, '{}'::jsonb, 'rudraksha', 'multiple_beads', 8, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 6' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-9.jpeg',
  description = 'Multiple Rudraksha combinations (3 or more beads)',
  making_charges = '{"silver_925":4000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3.5,"gold_18k":3.5,"gold_22k":4}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'multiple_beads',
  sort_order = 9,
  is_active = true
WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 7' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - Multiple Beads (3+) - Style 7', 'pendant', '/rudraksha-designs/design-9.jpeg', 'Multiple Rudraksha combinations (3 or more beads)', '{"silver_925":4000}'::jsonb, '{"gold_14k":3.5,"gold_18k":3.5,"gold_22k":4}'::jsonb, '{}'::jsonb, 'rudraksha', 'multiple_beads', 9, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 7' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/rudraksha-designs/design-10.jpeg',
  description = 'Multiple Rudraksha combinations (3 or more beads)',
  making_charges = '{"silver_925":6000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5.5,"gold_18k":5.5,"gold_22k":6}'::jsonb,
  diamond_charges = '{}'::jsonb,
  product_scope = 'rudraksha',
  rudraksha_category = 'multiple_beads',
  sort_order = 10,
  is_active = true
WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 8' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, sort_order, is_active)
SELECT 'Rudraksha - Multiple Beads (3+) - Style 8', 'pendant', '/rudraksha-designs/design-10.jpeg', 'Multiple Rudraksha combinations (3 or more beads)', '{"silver_925":6000}'::jsonb, '{"gold_14k":5.5,"gold_18k":5.5,"gold_22k":6}'::jsonb, '{}'::jsonb, 'rudraksha', 'multiple_beads', 10, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Rudraksha - Multiple Beads (3+) - Style 8' AND setting_type = 'pendant');

-- Deactivate migrated designs removed from the source sheet (preserves FK history)
UPDATE jewelry_designs SET is_active = false
WHERE is_active = true
  AND name LIKE 'Rudraksha - %'
  AND name NOT IN ('Rudraksha - One Mukhi', 'Rudraksha - 2 to 17 Mukhi, Ganesh & Gauri Shankar', 'Rudraksha - Multiple Beads (3+)', 'Rudraksha - Multiple Beads (3+) - Style 2', 'Rudraksha - Multiple Beads (3+) - Style 3', 'Rudraksha - Multiple Beads (3+) - Style 4', 'Rudraksha - Multiple Beads (3+) - Style 5', 'Rudraksha - Multiple Beads (3+) - Style 6', 'Rudraksha - Multiple Beads (3+) - Style 7', 'Rudraksha - Multiple Beads (3+) - Style 8');
