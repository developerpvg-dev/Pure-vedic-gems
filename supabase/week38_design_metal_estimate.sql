-- ============================================================================
-- Week 38: Metal estimate on design work slip
-- ============================================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS design_metal_estimate TEXT;

COMMIT;
