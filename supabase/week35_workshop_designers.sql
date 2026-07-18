-- ============================================================================
-- Week 35: Workshop designers (name-only) + design work-slip fields
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS workshop_designers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workshop_designers_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_workshop_designers_active
  ON workshop_designers (is_active, name);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS designer_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS design_price DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS design_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS design_slip_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_designer_name
  ON orders (designer_name)
  WHERE designer_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_design_due
  ON orders (design_due_at)
  WHERE design_due_at IS NOT NULL;

ALTER TABLE workshop_designers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages workshop designers" ON workshop_designers;
CREATE POLICY "Admin manages workshop designers"
  ON workshop_designers FOR ALL
  USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

COMMIT;
