-- Restore legacy ring design diamond add-ons and Design-34 quality remark.

UPDATE jewelry_designs SET
  description = '18K Gold: +17500 diamonds cost',
  diamond_charges = '{"gold_14k":17500,"gold_18k":17500,"platinum":17500}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-14' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +7500 diamonds cost',
  diamond_charges = '{"gold_14k":7500,"gold_18k":7500,"platinum":7500}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-16' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +7500 diamonds cost',
  diamond_charges = '{"gold_14k":7500,"gold_18k":7500,"platinum":7500}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-17' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +7500 diamonds cost',
  diamond_charges = '{"gold_14k":7500,"gold_18k":7500,"platinum":7500}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-18' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +20000 diamonds cost',
  diamond_charges = '{"gold_14k":20000,"gold_18k":20000,"platinum":20000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-20' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +12500 diamonds cost',
  diamond_charges = '{"gold_14k":12500,"gold_18k":12500,"platinum":12500}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-21' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +5000 diamonds cost',
  diamond_charges = '{"gold_14k":5000,"gold_18k":5000,"platinum":5000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-23' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +25000 diamonds cost',
  diamond_charges = '{"gold_14k":25000,"gold_18k":25000,"platinum":25000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-27' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +35000 diamonds cost',
  diamond_charges = '{"gold_14k":35000,"gold_18k":35000,"platinum":35000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-28' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +15000 diamonds cost',
  diamond_charges = '{"gold_14k":15000,"gold_18k":15000,"platinum":15000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-31' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +7500 diamonds cost',
  diamond_charges = '{"gold_14k":7500,"gold_18k":7500,"platinum":7500}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-32' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = 'Remark the price of the small stones to be used around the centre big depends on quality.',
  diamond_charges = '{}'::jsonb,
  stone_addon_label = NULL
WHERE name = 'Design-34' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '22K Gold: +1lakh Approx Extra Diamonds Cost',
  diamond_charges = '{"gold_14k":100000,"gold_18k":100000,"gold_22k":100000,"platinum":100000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-36' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +25000 For Diamonds',
  diamond_charges = '{"gold_14k":25000,"gold_18k":25000,"platinum":25000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-47' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +15000 Extra For Diamonds',
  diamond_charges = '{"gold_14k":15000,"gold_18k":15000,"platinum":15000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-48' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +2Lakhs Extra For Diamonds',
  diamond_charges = '{"gold_14k":200000,"gold_18k":200000,"platinum":200000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-50' AND setting_type = 'ring' AND product_scope = 'gemstone';

UPDATE jewelry_designs SET
  description = '18K Gold: +25000 Extra For Diamonds',
  diamond_charges = '{"gold_14k":25000,"gold_18k":25000,"platinum":25000}'::jsonb,
  stone_addon_label = 'Diamond'
WHERE name = 'Design-51' AND setting_type = 'ring' AND product_scope = 'gemstone';
