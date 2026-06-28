-- Restore gemstone bracelet design diamond add-ons.

UPDATE jewelry_designs SET
  description = '18K Gold: +50000 Diamonds Cost',
  diamond_charges = '{"gold_14k":50000,"gold_18k":50000,"platinum":50000}'::jsonb
WHERE name = 'Design-7' AND setting_type = 'bracelet' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +50000 Diamonds Cost',
  diamond_charges = '{"gold_14k":50000,"gold_18k":50000,"platinum":50000}'::jsonb
WHERE name = 'Design-8' AND setting_type = 'bracelet' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = 'Platinum: +25000 Diamonds Cost',
  diamond_charges = '{"gold_14k":25000,"gold_18k":25000,"platinum":25000}'::jsonb
WHERE name = 'Design-12' AND setting_type = 'bracelet' AND product_scope = 'gemstone';
