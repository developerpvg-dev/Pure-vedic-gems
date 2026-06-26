-- Ring designs migrated from PVG Ring Designs with metal 2026 (1).xlsx
-- Labor: 22K/Platinum 20%, 18K/14K 25% (applied at pricing time on metal value)
-- Run migration_jewelry_diamond_charges_2026.sql before this seed if the column is missing.

-- Upsert by (name, setting_type) so existing product_configurations.design_id rows stay valid.

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-1.png',
  description = NULL,
  making_charges = '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 1,
  is_active = true
WHERE name = 'Design-1' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-1', 'ring', '/ring-designs/design-1.png', NULL, '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb, '{}'::jsonb, 1, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-1' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-2.jpeg',
  description = NULL,
  making_charges = '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 2,
  is_active = true
WHERE name = 'Design-2' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-2', 'ring', '/ring-designs/design-2.jpeg', NULL, '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb, '{}'::jsonb, 2, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-2' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-3.png',
  description = NULL,
  making_charges = '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 3,
  is_active = true
WHERE name = 'Design-3' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-3', 'ring', '/ring-designs/design-3.png', NULL, '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb, '{}'::jsonb, 3, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-3' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-4.jpeg',
  description = NULL,
  making_charges = '{"silver_925":5000,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":9,"gold_18k":9,"gold_22k":9,"platinum":9}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 4,
  is_active = true
WHERE name = 'Design-4' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-4', 'ring', '/ring-designs/design-4.jpeg', NULL, '{"silver_925":5000,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb, '{"gold_14k":9,"gold_18k":9,"gold_22k":9,"platinum":9}'::jsonb, '{}'::jsonb, 4, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-4' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-5.png',
  description = NULL,
  making_charges = '{"silver_925":6000,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":11,"gold_18k":11,"gold_22k":11,"platinum":11}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 5,
  is_active = true
WHERE name = 'Design-5' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-5', 'ring', '/ring-designs/design-5.png', NULL, '{"silver_925":6000,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb, '{"gold_14k":11,"gold_18k":11,"gold_22k":11,"platinum":11}'::jsonb, '{}'::jsonb, 5, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-5' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-6.jpeg',
  description = NULL,
  making_charges = '{"silver_925":4500,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":7,"gold_18k":7,"gold_22k":7,"platinum":7}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 6,
  is_active = true
WHERE name = 'Design-6' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-6', 'ring', '/ring-designs/design-6.jpeg', NULL, '{"silver_925":4500,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb, '{"gold_14k":7,"gold_18k":7,"gold_22k":7,"platinum":7}'::jsonb, '{}'::jsonb, 6, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-6' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-7.png',
  description = NULL,
  making_charges = '{"silver_925":5000,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":8,"gold_18k":8,"gold_22k":8,"platinum":8}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 7,
  is_active = true
WHERE name = 'Design-7' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-7', 'ring', '/ring-designs/design-7.png', NULL, '{"silver_925":5000,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb, '{"gold_14k":8,"gold_18k":8,"gold_22k":8,"platinum":8}'::jsonb, '{}'::jsonb, 7, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-7' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-8.png',
  description = NULL,
  making_charges = '{"silver_925":5000,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":8,"gold_18k":8,"gold_22k":8,"platinum":8}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 8,
  is_active = true
WHERE name = 'Design-8' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-8', 'ring', '/ring-designs/design-8.png', NULL, '{"silver_925":5000,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb, '{"gold_14k":8,"gold_18k":8,"gold_22k":8,"platinum":8}'::jsonb, '{}'::jsonb, 8, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-8' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-9.png',
  description = NULL,
  making_charges = '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6,"gold_18k":6,"gold_22k":6,"platinum":6}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 9,
  is_active = true
WHERE name = 'Design-9' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-9', 'ring', '/ring-designs/design-9.png', NULL, '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":6,"gold_18k":6,"gold_22k":6,"platinum":6}'::jsonb, '{}'::jsonb, 9, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-9' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-10.jpeg',
  description = NULL,
  making_charges = '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6,"gold_18k":6,"gold_22k":6,"platinum":6}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 10,
  is_active = true
WHERE name = 'Design-10' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-10', 'ring', '/ring-designs/design-10.jpeg', NULL, '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":6,"gold_18k":6,"gold_22k":6,"platinum":6}'::jsonb, '{}'::jsonb, 10, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-10' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-11.jpeg',
  description = NULL,
  making_charges = '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 11,
  is_active = true
WHERE name = 'Design-11' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-11', 'ring', '/ring-designs/design-11.jpeg', NULL, '{"silver_925":3000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb, '{}'::jsonb, 11, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-11' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-12.jpeg',
  description = NULL,
  making_charges = '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":12000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":7,"gold_18k":7,"gold_22k":7,"platinum":7}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 12,
  is_active = true
WHERE name = 'Design-12' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-12', 'ring', '/ring-designs/design-12.jpeg', NULL, '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":12000}'::jsonb, '{"gold_14k":7,"gold_18k":7,"gold_22k":7,"platinum":7}'::jsonb, '{}'::jsonb, 12, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-12' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-13.jpeg',
  description = NULL,
  making_charges = '{"silver_925":4000,"panchdhatu":3500,"panchdhatu_with_gold":12000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6.5,"gold_18k":6.5,"gold_22k":6.5,"platinum":6.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 13,
  is_active = true
WHERE name = 'Design-13' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-13', 'ring', '/ring-designs/design-13.jpeg', NULL, '{"silver_925":4000,"panchdhatu":3500,"panchdhatu_with_gold":12000}'::jsonb, '{"gold_14k":6.5,"gold_18k":6.5,"gold_22k":6.5,"platinum":6.5}'::jsonb, '{}'::jsonb, 13, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-13' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-14.jpeg',
  description = '18K Gold: +17500 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb,
  diamond_charges = '{"gold_18k":17500}'::jsonb,
  sort_order = 14,
  is_active = true
WHERE name = 'Design-14' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-14', 'ring', '/ring-designs/design-14.jpeg', '18K Gold: +17500 diamonds cost', '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb, '{"gold_18k":17500}'::jsonb, 14, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-14' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-15.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":4,"gold_18k":4,"platinum":4}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 15,
  is_active = true
WHERE name = 'Design-15' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-15', 'ring', '/ring-designs/design-15.jpeg', NULL, '{}'::jsonb, '{"gold_14k":4,"gold_18k":4,"platinum":4}'::jsonb, '{}'::jsonb, 15, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-15' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-16.jpeg',
  description = '18K Gold: +7500 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb,
  diamond_charges = '{"gold_18k":7500}'::jsonb,
  sort_order = 16,
  is_active = true
WHERE name = 'Design-16' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-16', 'ring', '/ring-designs/design-16.jpeg', '18K Gold: +7500 diamonds cost', '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb, '{"gold_18k":7500}'::jsonb, 16, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-16' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-17.jpeg',
  description = '18K Gold: +7500 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6.5,"gold_18k":6.5,"platinum":6.5}'::jsonb,
  diamond_charges = '{"gold_18k":7500}'::jsonb,
  sort_order = 17,
  is_active = true
WHERE name = 'Design-17' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-17', 'ring', '/ring-designs/design-17.jpeg', '18K Gold: +7500 diamonds cost', '{}'::jsonb, '{"gold_14k":6.5,"gold_18k":6.5,"platinum":6.5}'::jsonb, '{"gold_18k":7500}'::jsonb, 17, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-17' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-18.jpeg',
  description = '18K Gold: +7500 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb,
  diamond_charges = '{"gold_18k":7500}'::jsonb,
  sort_order = 18,
  is_active = true
WHERE name = 'Design-18' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-18', 'ring', '/ring-designs/design-18.jpeg', '18K Gold: +7500 diamonds cost', '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb, '{"gold_18k":7500}'::jsonb, 18, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-18' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-19.jpeg',
  description = NULL,
  making_charges = '{"silver_925":9000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":12,"gold_18k":12,"gold_22k":12,"platinum":12}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 19,
  is_active = true
WHERE name = 'Design-19' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-19', 'ring', '/ring-designs/design-19.jpeg', NULL, '{"silver_925":9000}'::jsonb, '{"gold_14k":12,"gold_18k":12,"gold_22k":12,"platinum":12}'::jsonb, '{}'::jsonb, 19, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-19' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-20.jpeg',
  description = '18K Gold: +20000 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb,
  diamond_charges = '{"gold_18k":20000}'::jsonb,
  sort_order = 20,
  is_active = true
WHERE name = 'Design-20' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-20', 'ring', '/ring-designs/design-20.jpeg', '18K Gold: +20000 diamonds cost', '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb, '{"gold_18k":20000}'::jsonb, 20, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-20' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-21.png',
  description = '18K Gold: +12500 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb,
  diamond_charges = '{"gold_18k":12500}'::jsonb,
  sort_order = 21,
  is_active = true
WHERE name = 'Design-21' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-21', 'ring', '/ring-designs/design-21.png', '18K Gold: +12500 diamonds cost', '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb, '{"gold_18k":12500}'::jsonb, 21, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-21' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-22.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 22,
  is_active = true
WHERE name = 'Design-22' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-22', 'ring', '/ring-designs/design-22.jpeg', NULL, '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb, '{}'::jsonb, 22, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-22' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-23.jpeg',
  description = '18K Gold: +5000 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb,
  diamond_charges = '{"gold_18k":5000}'::jsonb,
  sort_order = 23,
  is_active = true
WHERE name = 'Design-23' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-23', 'ring', '/ring-designs/design-23.jpeg', '18K Gold: +5000 diamonds cost', '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb, '{"gold_18k":5000}'::jsonb, 23, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-23' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-24.png',
  description = NULL,
  making_charges = '{"silver_925":7000,"panchdhatu":3500,"panchdhatu_with_gold":12000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":8,"gold_18k":8,"gold_22k":8,"platinum":8}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 24,
  is_active = true
WHERE name = 'Design-24' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-24', 'ring', '/ring-designs/design-24.png', NULL, '{"silver_925":7000,"panchdhatu":3500,"panchdhatu_with_gold":12000}'::jsonb, '{"gold_14k":8,"gold_18k":8,"gold_22k":8,"platinum":8}'::jsonb, '{}'::jsonb, 24, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-24' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-25.png',
  description = NULL,
  making_charges = '{"silver_925":5000,"panchdhatu":3500,"panchdhatu_with_gold":12000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":7,"gold_18k":7,"gold_22k":7,"platinum":7}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 25,
  is_active = true
WHERE name = 'Design-25' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-25', 'ring', '/ring-designs/design-25.png', NULL, '{"silver_925":5000,"panchdhatu":3500,"panchdhatu_with_gold":12000}'::jsonb, '{"gold_14k":7,"gold_18k":7,"gold_22k":7,"platinum":7}'::jsonb, '{}'::jsonb, 25, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-25' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-26.png',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":8,"gold_18k":8,"platinum":8}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 26,
  is_active = true
WHERE name = 'Design-26' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-26', 'ring', '/ring-designs/design-26.png', NULL, '{}'::jsonb, '{"gold_14k":8,"gold_18k":8,"platinum":8}'::jsonb, '{}'::jsonb, 26, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-26' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-27.jpeg',
  description = '18K Gold: +25000 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6.5,"gold_18k":6.5,"platinum":6.5}'::jsonb,
  diamond_charges = '{"gold_18k":25000}'::jsonb,
  sort_order = 27,
  is_active = true
WHERE name = 'Design-27' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-27', 'ring', '/ring-designs/design-27.jpeg', '18K Gold: +25000 diamonds cost', '{}'::jsonb, '{"gold_14k":6.5,"gold_18k":6.5,"platinum":6.5}'::jsonb, '{"gold_18k":25000}'::jsonb, 27, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-27' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-28.jpeg',
  description = '18K Gold: +35000 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb,
  diamond_charges = '{"gold_18k":35000}'::jsonb,
  sort_order = 28,
  is_active = true
WHERE name = 'Design-28' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-28', 'ring', '/ring-designs/design-28.jpeg', '18K Gold: +35000 diamonds cost', '{}'::jsonb, '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb, '{"gold_18k":35000}'::jsonb, 28, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-28' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-29.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 29,
  is_active = true
WHERE name = 'Design-29' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-29', 'ring', '/ring-designs/design-29.jpeg', NULL, '{}'::jsonb, '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb, '{}'::jsonb, 29, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-29' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-30.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":7,"gold_18k":7,"platinum":7}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 30,
  is_active = true
WHERE name = 'Design-30' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-30', 'ring', '/ring-designs/design-30.jpeg', NULL, '{}'::jsonb, '{"gold_14k":7,"gold_18k":7,"platinum":7}'::jsonb, '{}'::jsonb, 30, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-30' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-31.jpeg',
  description = '18K Gold: +15000 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb,
  diamond_charges = '{"gold_18k":15000}'::jsonb,
  sort_order = 31,
  is_active = true
WHERE name = 'Design-31' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-31', 'ring', '/ring-designs/design-31.jpeg', '18K Gold: +15000 diamonds cost', '{}'::jsonb, '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb, '{"gold_18k":15000}'::jsonb, 31, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-31' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-32.jpeg',
  description = '18K Gold: +7500 diamonds cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb,
  diamond_charges = '{"gold_18k":7500}'::jsonb,
  sort_order = 32,
  is_active = true
WHERE name = 'Design-32' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-32', 'ring', '/ring-designs/design-32.jpeg', '18K Gold: +7500 diamonds cost', '{}'::jsonb, '{"gold_14k":5,"gold_18k":5,"platinum":5}'::jsonb, '{"gold_18k":7500}'::jsonb, 32, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-32' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-33.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":10,"gold_18k":10,"platinum":10}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 33,
  is_active = true
WHERE name = 'Design-33' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-33', 'ring', '/ring-designs/design-33.jpeg', NULL, '{}'::jsonb, '{"gold_14k":10,"gold_18k":10,"platinum":10}'::jsonb, '{}'::jsonb, 33, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-33' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-34.jpeg',
  description = 'Silver: Remark the price of the smail stones to be used around the centre big depends on quality.',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":7,"gold_18k":7,"platinum":7}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 34,
  is_active = true
WHERE name = 'Design-34' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-34', 'ring', '/ring-designs/design-34.jpeg', 'Silver: Remark the price of the smail stones to be used around the centre big depends on quality.', '{}'::jsonb, '{"gold_14k":7,"gold_18k":7,"platinum":7}'::jsonb, '{}'::jsonb, 34, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-34' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-35.png',
  description = NULL,
  making_charges = '{"silver_925":7500,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":10,"gold_18k":10,"gold_22k":10,"platinum":10}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 35,
  is_active = true
WHERE name = 'Design-35' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-35', 'ring', '/ring-designs/design-35.png', NULL, '{"silver_925":7500,"panchdhatu":4000,"panchdhatu_with_gold":15000}'::jsonb, '{"gold_14k":10,"gold_18k":10,"gold_22k":10,"platinum":10}'::jsonb, '{}'::jsonb, 35, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-35' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-36.jpeg',
  description = '22K Gold: +1lakh Approx Extra Diamonds Cost',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6,"gold_18k":6,"platinum":6}'::jsonb,
  diamond_charges = '{"gold_22k":100000}'::jsonb,
  sort_order = 36,
  is_active = true
WHERE name = 'Design-36' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-36', 'ring', '/ring-designs/design-36.jpeg', '22K Gold: +1lakh Approx Extra Diamonds Cost', '{}'::jsonb, '{"gold_14k":6,"gold_18k":6,"platinum":6}'::jsonb, '{"gold_22k":100000}'::jsonb, 36, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-36' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-37.jpeg',
  description = NULL,
  making_charges = '{"silver_925":6000,"panchdhatu":3500,"panchdhatu_with_gold":12000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6.5,"gold_18k":6.5,"gold_22k":6.5,"platinum":6.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 37,
  is_active = true
WHERE name = 'Design-37' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-37', 'ring', '/ring-designs/design-37.jpeg', NULL, '{"silver_925":6000,"panchdhatu":3500,"panchdhatu_with_gold":12000}'::jsonb, '{"gold_14k":6.5,"gold_18k":6.5,"gold_22k":6.5,"platinum":6.5}'::jsonb, '{}'::jsonb, 37, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-37' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-38.png',
  description = 'Panchdhatu (Without Gold): available on request — contact for quote. Panchdhatu (With Gold): available on request — contact for quote.',
  making_charges = '{"silver_925":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":10,"gold_18k":10,"gold_22k":10,"platinum":10}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 38,
  is_active = true
WHERE name = 'Design-38' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-38', 'ring', '/ring-designs/design-38.png', 'Panchdhatu (Without Gold): available on request — contact for quote. Panchdhatu (With Gold): available on request — contact for quote.', '{"silver_925":10000}'::jsonb, '{"gold_14k":10,"gold_18k":10,"gold_22k":10,"platinum":10}'::jsonb, '{}'::jsonb, 38, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-38' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-39.png',
  description = NULL,
  making_charges = '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 39,
  is_active = true
WHERE name = 'Design-39' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-39', 'ring', '/ring-designs/design-39.png', NULL, '{"silver_925":4000,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":5,"gold_18k":5,"gold_22k":5,"platinum":5}'::jsonb, '{}'::jsonb, 39, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-39' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-40.png',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":8,"gold_18k":8,"platinum":8}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 40,
  is_active = true
WHERE name = 'Design-40' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-40', 'ring', '/ring-designs/design-40.png', NULL, '{}'::jsonb, '{"gold_14k":8,"gold_18k":8,"platinum":8}'::jsonb, '{}'::jsonb, 40, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-40' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-41.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 41,
  is_active = true
WHERE name = 'Design-41' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-41', 'ring', '/ring-designs/design-41.jpeg', NULL, '{}'::jsonb, '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb, '{}'::jsonb, 41, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-41' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-42.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":9,"gold_18k":9,"platinum":9}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 42,
  is_active = true
WHERE name = 'Design-42' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-42', 'ring', '/ring-designs/design-42.jpeg', NULL, '{}'::jsonb, '{"gold_14k":9,"gold_18k":9,"platinum":9}'::jsonb, '{}'::jsonb, 42, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-42' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-43.jpeg',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":10,"gold_18k":10,"platinum":10}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 43,
  is_active = true
WHERE name = 'Design-43' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-43', 'ring', '/ring-designs/design-43.jpeg', NULL, '{}'::jsonb, '{"gold_14k":10,"gold_18k":10,"platinum":10}'::jsonb, '{}'::jsonb, 43, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-43' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-44.png',
  description = NULL,
  making_charges = '{"silver_925":3500,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6,"gold_18k":6,"gold_22k":6,"platinum":6}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 44,
  is_active = true
WHERE name = 'Design-44' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-44', 'ring', '/ring-designs/design-44.png', NULL, '{"silver_925":3500,"panchdhatu":2500,"panchdhatu_with_gold":10000}'::jsonb, '{"gold_14k":6,"gold_18k":6,"gold_22k":6,"platinum":6}'::jsonb, '{}'::jsonb, 44, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-44' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-45.png',
  description = NULL,
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":9,"gold_18k":9,"platinum":9}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 45,
  is_active = true
WHERE name = 'Design-45' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-45', 'ring', '/ring-designs/design-45.png', NULL, '{}'::jsonb, '{"gold_14k":9,"gold_18k":9,"platinum":9}'::jsonb, '{}'::jsonb, 45, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-45' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-46.jpeg',
  description = NULL,
  making_charges = '{"silver_925":7000}'::jsonb,
  estimated_metal_weight = '{"gold_14k":10,"gold_18k":10,"gold_22k":10,"platinum":10}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 46,
  is_active = true
WHERE name = 'Design-46' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-46', 'ring', '/ring-designs/design-46.jpeg', NULL, '{"silver_925":7000}'::jsonb, '{"gold_14k":10,"gold_18k":10,"gold_22k":10,"platinum":10}'::jsonb, '{}'::jsonb, 46, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-46' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-47.jpeg',
  description = '18K Gold: +25000 For Diamonds',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6.5,"gold_18k":6.5,"platinum":6.5}'::jsonb,
  diamond_charges = '{"gold_18k":25000}'::jsonb,
  sort_order = 47,
  is_active = true
WHERE name = 'Design-47' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-47', 'ring', '/ring-designs/design-47.jpeg', '18K Gold: +25000 For Diamonds', '{}'::jsonb, '{"gold_14k":6.5,"gold_18k":6.5,"platinum":6.5}'::jsonb, '{"gold_18k":25000}'::jsonb, 47, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-47' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-48.jpeg',
  description = '18K Gold: +15000 Extra For Diamonds',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb,
  diamond_charges = '{"gold_18k":15000}'::jsonb,
  sort_order = 48,
  is_active = true
WHERE name = 'Design-48' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-48', 'ring', '/ring-designs/design-48.jpeg', '18K Gold: +15000 Extra For Diamonds', '{}'::jsonb, '{"gold_14k":5.5,"gold_18k":5.5,"platinum":5.5}'::jsonb, '{"gold_18k":15000}'::jsonb, 48, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-48' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-49.jpeg',
  description = 'Panchdhatu (Without Gold): available on request — contact for quote. Panchdhatu (With Gold): available on request — contact for quote.',
  making_charges = '{"silver_925":7500}'::jsonb,
  estimated_metal_weight = '{"gold_14k":9,"gold_18k":9,"gold_22k":9,"platinum":9}'::jsonb,
  diamond_charges = '{}'::jsonb,
  sort_order = 49,
  is_active = true
WHERE name = 'Design-49' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-49', 'ring', '/ring-designs/design-49.jpeg', 'Panchdhatu (Without Gold): available on request — contact for quote. Panchdhatu (With Gold): available on request — contact for quote.', '{"silver_925":7500}'::jsonb, '{"gold_14k":9,"gold_18k":9,"gold_22k":9,"platinum":9}'::jsonb, '{}'::jsonb, 49, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-49' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-50.jpeg',
  description = '18K Gold: +2Lakhs Extra For Diamonds',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":8,"gold_18k":8,"platinum":8}'::jsonb,
  diamond_charges = '{"gold_18k":200000}'::jsonb,
  sort_order = 50,
  is_active = true
WHERE name = 'Design-50' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-50', 'ring', '/ring-designs/design-50.jpeg', '18K Gold: +2Lakhs Extra For Diamonds', '{}'::jsonb, '{"gold_14k":8,"gold_18k":8,"platinum":8}'::jsonb, '{"gold_18k":200000}'::jsonb, 50, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-50' AND setting_type = 'ring');

UPDATE jewelry_designs SET
  image_url = '/ring-designs/design-51.jpeg',
  description = '18K Gold: +25000 Extra For Diamonds',
  making_charges = '{}'::jsonb,
  estimated_metal_weight = '{"gold_14k":6.5,"gold_18k":6.5,"platinum":6.5}'::jsonb,
  diamond_charges = '{"gold_18k":25000}'::jsonb,
  sort_order = 51,
  is_active = true
WHERE name = 'Design-51' AND setting_type = 'ring';

INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, sort_order, is_active)
SELECT 'Design-51', 'ring', '/ring-designs/design-51.jpeg', '18K Gold: +25000 Extra For Diamonds', '{}'::jsonb, '{"gold_14k":6.5,"gold_18k":6.5,"platinum":6.5}'::jsonb, '{"gold_18k":25000}'::jsonb, 51, true
WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE name = 'Design-51' AND setting_type = 'ring');

-- Deactivate migrated designs removed from the source sheet (preserves FK history)
UPDATE jewelry_designs SET is_active = false
WHERE is_active = true
  AND setting_type = 'ring'
  AND name ~ '^Design-[0-9]+$'
  AND name NOT IN ('Design-1', 'Design-2', 'Design-3', 'Design-4', 'Design-5', 'Design-6', 'Design-7', 'Design-8', 'Design-9', 'Design-10', 'Design-11', 'Design-12', 'Design-13', 'Design-14', 'Design-15', 'Design-16', 'Design-17', 'Design-18', 'Design-19', 'Design-20', 'Design-21', 'Design-22', 'Design-23', 'Design-24', 'Design-25', 'Design-26', 'Design-27', 'Design-28', 'Design-29', 'Design-30', 'Design-31', 'Design-32', 'Design-33', 'Design-34', 'Design-35', 'Design-36', 'Design-37', 'Design-38', 'Design-39', 'Design-40', 'Design-41', 'Design-42', 'Design-43', 'Design-44', 'Design-45', 'Design-46', 'Design-47', 'Design-48', 'Design-49', 'Design-50', 'Design-51');
