-- Pendant designs migrated from pandant design pvg2026 (3).xlsx
-- Labor: 22K/Platinum 20%, 18K/14K 25% (applied at pricing time on metal value)
-- Run migration_ring_design_metals_2026.sql first if gold_14k / panchdhatu_with_gold are missing.
-- Run migration_jewelry_diamond_charges_2026.sql before this seed if the column is missing.

-- Upsert by (name, setting_type) so existing product_configurations.design_id rows stay valid.

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-1.jpeg',
  description = NULL,
  making_charges = '{"silver_925":2000,"panchdhatu":1500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3,"gold_18k":3,"gold_22k":3.5,"platinum":2.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 1,
  is_active = true
WHERE name = 'Design-1' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-1', 'pendant', '/pendant-designs/design-1.jpeg', NULL, '{"silver_925":2000,"panchdhatu":1500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":3,"gold_18k":3,"gold_22k":3.5,"platinum":2.5}'::jsonb, '{}'::jsonb, 1, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-1' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-2.jpeg',
  description = NULL,
  making_charges = '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":4}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 2,
  is_active = true
WHERE name = 'Design-2' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-2', 'pendant', '/pendant-designs/design-2.jpeg', NULL, '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":4}'::jsonb, '{}'::jsonb, 2, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-2' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-3.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3,"gold_18k":3,"platinum":2.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 3,
  is_active = true
WHERE name = 'Design-3' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-3', 'pendant', '/pendant-designs/design-3.jpeg', NULL, '{}'::jsonb, '{"gold_14k":3,"gold_18k":3,"platinum":2.5}'::jsonb, '{}'::jsonb, 3, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-3' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-4.jpeg',
  description = NULL,
  making_charges = '{"silver_925":3500,"panchdhatu":3000,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":4}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 4,
  is_active = true
WHERE name = 'Design-4' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-4', 'pendant', '/pendant-designs/design-4.jpeg', NULL, '{"silver_925":3500,"panchdhatu":3000,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":4}'::jsonb, '{}'::jsonb, 4, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-4' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-5.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3.5,"gold_18k":3.5,"platinum":3}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 5,
  is_active = true
WHERE name = 'Design-5' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-5', 'pendant', '/pendant-designs/design-5.jpeg', NULL, '{}'::jsonb, '{"gold_14k":3.5,"gold_18k":3.5,"platinum":3}'::jsonb, '{}'::jsonb, 5, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-5' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-6.jpeg',
  description = '18K Gold: +2000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3,"gold_18k":3,"platinum":2.5}'::jsonb,
  diamond_charges = '{"gold_18k":2000}'::jsonb,
  sort_order = 6,
  is_active = true
WHERE name = 'Design-6' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-6', 'pendant', '/pendant-designs/design-6.jpeg', '18K Gold: +2000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":3,"gold_18k":3,"platinum":2.5}'::jsonb, '{"gold_18k":2000}'::jsonb, 6, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-6' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-7.jpeg',
  description = '18K Gold: +3000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb,
  diamond_charges = '{"gold_18k":3000}'::jsonb,
  sort_order = 7,
  is_active = true
WHERE name = 'Design-7' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-7', 'pendant', '/pendant-designs/design-7.jpeg', '18K Gold: +3000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb, '{"gold_18k":3000}'::jsonb, 7, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-7' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-8.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 8,
  is_active = true
WHERE name = 'Design-8' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-8', 'pendant', '/pendant-designs/design-8.jpeg', NULL, '{}'::jsonb, '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb, '{}'::jsonb, 8, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-8' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-9.jpeg',
  description = NULL,
  making_charges = '{"silver_925":350,"panchdhatu":3000,"panchdhatu_with_gold":11000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"gold_22k":4,"platinum":3.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 9,
  is_active = true
WHERE name = 'Design-9' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-9', 'pendant', '/pendant-designs/design-9.jpeg', NULL, '{"silver_925":350,"panchdhatu":3000,"panchdhatu_with_gold":11000}'::jsonb, '{"gold_14k":4,"gold_18k":4,"gold_22k":4,"platinum":3.5}'::jsonb, '{}'::jsonb, 9, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-9' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-10.jpeg',
  description = NULL,
  making_charges = '{"silver_925":7000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":6,"platinum":4}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 10,
  is_active = true
WHERE name = 'Design-10' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-10', 'pendant', '/pendant-designs/design-10.jpeg', NULL, '{"silver_925":7000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":6,"platinum":4}'::jsonb, '{}'::jsonb, 10, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-10' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-11.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3,"gold_18k":3,"platinum":2.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 11,
  is_active = true
WHERE name = 'Design-11' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-11', 'pendant', '/pendant-designs/design-11.jpeg', NULL, '{}'::jsonb, '{"gold_14k":3,"gold_18k":3,"platinum":2.5}'::jsonb, '{}'::jsonb, 11, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-11' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-12.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":4}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 12,
  is_active = true
WHERE name = 'Design-12' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-12', 'pendant', '/pendant-designs/design-12.jpeg', NULL, '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":4}'::jsonb, '{}'::jsonb, 12, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-12' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-13.jpeg',
  description = NULL,
  making_charges = '{"silver_925":7500}'::jsonb,
  estimated_metal_weight = '{"gold_14k":7.5,"gold_18k":7.5,"gold_22k":8,"platinum":6.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 13,
  is_active = true
WHERE name = 'Design-13' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-13', 'pendant', '/pendant-designs/design-13.jpeg', NULL, '{"silver_925":7500}'::jsonb, '{"gold_14k":7.5,"gold_18k":7.5,"gold_22k":8,"platinum":6.5}'::jsonb, '{}'::jsonb, 13, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-13' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-14.jpeg',
  description = NULL,
  making_charges = '{"silver_925":7500}'::jsonb,
  estimated_metal_weight = '{"gold_14k":7.5,"gold_18k":7.5,"gold_22k":8,"platinum":6.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 14,
  is_active = true
WHERE name = 'Design-14' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-14', 'pendant', '/pendant-designs/design-14.jpeg', NULL, '{"silver_925":7500}'::jsonb, '{"gold_14k":7.5,"gold_18k":7.5,"gold_22k":8,"platinum":6.5}'::jsonb, '{}'::jsonb, 14, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-14' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-15.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":6,"platinum":4}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 15,
  is_active = true
WHERE name = 'Design-15' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-15', 'pendant', '/pendant-designs/design-15.jpeg', NULL, '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":6,"platinum":4}'::jsonb, '{}'::jsonb, 15, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-15' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-16.jpeg',
  description = '18K Gold: +20000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb,
  diamond_charges = '{"gold_18k":20000}'::jsonb,
  sort_order = 16,
  is_active = true
WHERE name = 'Design-16' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-16', 'pendant', '/pendant-designs/design-16.jpeg', '18K Gold: +20000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb, '{"gold_18k":20000}'::jsonb, 16, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-16' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-17.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":6,"platinum":4.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 17,
  is_active = true
WHERE name = 'Design-17' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-17', 'pendant', '/pendant-designs/design-17.jpeg', NULL, '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":6,"platinum":4.5}'::jsonb, '{}'::jsonb, 17, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-17' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-18.jpeg',
  description = '18K Gold: +8000 Diamods Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":8,"gold_18k":8,"platinum":7.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 18,
  is_active = true
WHERE name = 'Design-18' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-18', 'pendant', '/pendant-designs/design-18.jpeg', '18K Gold: +8000 Diamods Cost', '{}'::jsonb, '{"gold_14k":8,"gold_18k":8,"platinum":7.5}'::jsonb, '{}'::jsonb, 18, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-18' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-19.jpeg',
  description = NULL,
  making_charges = '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3,"gold_18k":3,"platinum":2.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 19,
  is_active = true
WHERE name = 'Design-19' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-19', 'pendant', '/pendant-designs/design-19.jpeg', NULL, '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":3,"gold_18k":3,"platinum":2.5}'::jsonb, '{}'::jsonb, 19, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-19' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-20.jpeg',
  description = '18K Gold: +6000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb,
  diamond_charges = '{"gold_18k":6000}'::jsonb,
  sort_order = 20,
  is_active = true
WHERE name = 'Design-20' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-20', 'pendant', '/pendant-designs/design-20.jpeg', '18K Gold: +6000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb, '{"gold_18k":6000}'::jsonb, 20, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-20' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-21.jpeg',
  description = NULL,
  making_charges = '{"silver_925":5000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 21,
  is_active = true
WHERE name = 'Design-21' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-21', 'pendant', '/pendant-designs/design-21.jpeg', NULL, '{"silver_925":5000}'::jsonb, '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb, '{}'::jsonb, 21, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-21' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-22.jpeg',
  description = '18K Gold: +8000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":4.5}'::jsonb,
  diamond_charges = '{"gold_18k":8000}'::jsonb,
  sort_order = 22,
  is_active = true
WHERE name = 'Design-22' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-22', 'pendant', '/pendant-designs/design-22.jpeg', '18K Gold: +8000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":4.5}'::jsonb, '{"gold_18k":8000}'::jsonb, 22, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-22' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-23.jpeg',
  description = '18K Gold: +30000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":7,"gold_18k":7,"platinum":6}'::jsonb,
  diamond_charges = '{"gold_18k":30000}'::jsonb,
  sort_order = 23,
  is_active = true
WHERE name = 'Design-23' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-23', 'pendant', '/pendant-designs/design-23.jpeg', '18K Gold: +30000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":7,"gold_18k":7,"platinum":6}'::jsonb, '{"gold_18k":30000}'::jsonb, 23, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-23' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-24.jpeg',
  description = NULL,
  making_charges = '{"silver_925":2000,"panchdhatu":1800,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":2.5,"gold_18k":2.5,"gold_22k":3,"platinum":2}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 24,
  is_active = true
WHERE name = 'Design-24' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-24', 'pendant', '/pendant-designs/design-24.jpeg', NULL, '{"silver_925":2000,"panchdhatu":1800,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":2.5,"gold_18k":2.5,"gold_22k":3,"platinum":2}'::jsonb, '{}'::jsonb, 24, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-24' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-25.jpeg',
  description = '18K Gold: +15000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":9,"platinum":3.5}'::jsonb,
  diamond_charges = '{"gold_18k":15000}'::jsonb,
  sort_order = 25,
  is_active = true
WHERE name = 'Design-25' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-25', 'pendant', '/pendant-designs/design-25.jpeg', '18K Gold: +15000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":4,"gold_18k":9,"platinum":3.5}'::jsonb, '{"gold_18k":15000}'::jsonb, 25, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-25' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-26.jpeg',
  description = '18K Gold: +10000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3.5,"gold_18k":3.5,"platinum":3}'::jsonb,
  diamond_charges = '{"gold_18k":10000}'::jsonb,
  sort_order = 26,
  is_active = true
WHERE name = 'Design-26' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-26', 'pendant', '/pendant-designs/design-26.jpeg', '18K Gold: +10000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":3.5,"gold_18k":3.5,"platinum":3}'::jsonb, '{"gold_18k":10000}'::jsonb, 26, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-26' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-27.jpeg',
  description = '18K Gold: +15000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb,
  diamond_charges = '{"gold_18k":15000}'::jsonb,
  sort_order = 27,
  is_active = true
WHERE name = 'Design-27' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-27', 'pendant', '/pendant-designs/design-27.jpeg', '18K Gold: +15000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":4,"gold_18k":4,"platinum":3.5}'::jsonb, '{"gold_18k":15000}'::jsonb, 27, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-27' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-28.jpeg',
  description = NULL,
  making_charges = '{"silver_925":5000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3.5,"gold_18k":3.5,"platinum":3}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 28,
  is_active = true
WHERE name = 'Design-28' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-28', 'pendant', '/pendant-designs/design-28.jpeg', NULL, '{"silver_925":5000}'::jsonb, '{"gold_14k":3.5,"gold_18k":3.5,"platinum":3}'::jsonb, '{}'::jsonb, 28, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-28' AND setting_type = 'pendant');

UPDATE jewelry_designs SET
  image_url = '/pendant-designs/design-29.jpeg',
  description = '18K Gold: +5000 Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":3.5,"gold_18k":3.5,"platinum":3}'::jsonb,
  diamond_charges = '{"gold_18k":5000}'::jsonb,
  sort_order = 29,
  is_active = true
WHERE name = 'Design-29' AND setting_type = 'pendant';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-29', 'pendant', '/pendant-designs/design-29.jpeg', '18K Gold: +5000 Diamonds Cost', '{}'::jsonb, '{"gold_14k":3.5,"gold_18k":3.5,"platinum":3}'::jsonb, '{"gold_18k":5000}'::jsonb, 29, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-29' AND setting_type = 'pendant');

-- Deactivate migrated designs removed from the source sheet (preserves FK history)
UPDATE jewelry_designs SET is_active = false
WHERE is_active = true
  AND setting_type = 'pendant'
  AND name ~ '^Design-[0-9]+$'
  AND name NOT IN ('Design-1', 'Design-2', 'Design-3', 'Design-4', 'Design-5', 'Design-6', 'Design-7', 'Design-8', 'Design-9', 'Design-10', 'Design-11', 'Design-12', 'Design-13', 'Design-14', 'Design-15', 'Design-16', 'Design-17', 'Design-18', 'Design-19', 'Design-20', 'Design-21', 'Design-22', 'Design-23', 'Design-24', 'Design-25', 'Design-26', 'Design-27', 'Design-28', 'Design-29');
