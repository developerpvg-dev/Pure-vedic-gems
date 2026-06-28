-- Restore gemstone pendant design diamond add-ons.

UPDATE jewelry_designs SET
  description = '18K Gold: +2000 Diamonds Cost',
  diamond_charges = '{"gold_14k":2000,"gold_18k":2000,"platinum":2000}'::jsonb
WHERE name = 'Design-6' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +3000 Diamonds Cost',
  diamond_charges = '{"gold_14k":3000,"gold_18k":3000,"platinum":3000}'::jsonb
WHERE name = 'Design-7' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +20000 Diamonds Cost',
  diamond_charges = '{"gold_14k":20000,"gold_18k":20000,"platinum":20000}'::jsonb
WHERE name = 'Design-16' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +8000 Diamonds Cost',
  diamond_charges = '{"gold_14k":8000,"gold_18k":8000,"platinum":8000}'::jsonb
WHERE name = 'Design-18' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +6000 Diamonds Cost',
  diamond_charges = '{"gold_14k":6000,"gold_18k":6000,"platinum":6000}'::jsonb
WHERE name = 'Design-20' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +8000 Diamonds Cost',
  diamond_charges = '{"gold_14k":8000,"gold_18k":8000,"platinum":8000}'::jsonb
WHERE name = 'Design-22' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +30000 Diamonds Cost',
  diamond_charges = '{"gold_14k":30000,"gold_18k":30000,"platinum":30000}'::jsonb
WHERE name = 'Design-23' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +15000 Diamonds Cost',
  diamond_charges = '{"gold_14k":15000,"gold_18k":15000,"platinum":15000}'::jsonb
WHERE name = 'Design-25' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +10000 Diamonds Cost',
  diamond_charges = '{"gold_14k":10000,"gold_18k":10000,"platinum":10000}'::jsonb
WHERE name = 'Design-26' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +15000 Diamonds Cost',
  diamond_charges = '{"gold_14k":15000,"gold_18k":15000,"platinum":15000}'::jsonb
WHERE name = 'Design-27' AND setting_type = 'pendant' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +5000 Diamonds Cost',
  diamond_charges = '{"gold_14k":5000,"gold_18k":5000,"platinum":5000}'::jsonb
WHERE name = 'Design-29' AND setting_type = 'pendant' AND product_scope = 'gemstone';
