-- Ring design metals + 51 designs from PVG Ring Designs with metal 2026 (1).xlsx
-- Run migration_ring_designs_2026.sql after this file, or use: npm run legacy:ring-designs

-- ═══════════════════════════════════════════════════
-- Additional metals required by the 2026 ring sheet
-- ═══════════════════════════════════════════════════
INSERT INTO metals (name, slug, purity, price_per_gram, description, sort_order)
VALUES
  ('Gold 14K', 'gold_14k', '58.5%', 4800.00, '14 Karat Gold — 58.5% pure gold.', 2),
  ('Panchdhatu (With Gold)', 'panchdhatu_with_gold', 'Alloy + Gold', 0.00, 'Panchdhatu alloy with gold inlay — fixed design price from sheet.', 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  purity = EXCLUDED.purity,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

UPDATE metals
SET name = 'Panchdhatu (Without Gold)',
    description = 'Sacred five-metal alloy without gold — recommended for Vedic jewelry.'
WHERE slug = 'panchdhatu';
