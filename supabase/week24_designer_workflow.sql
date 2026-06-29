-- ============================================================================
-- Week 24: Jewelry designer workflow — invitations, routing, design statuses
-- ============================================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_designer_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS design_routed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS design_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS design_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_designer
  ON orders (assigned_designer_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS team_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  name          VARCHAR(200) NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'designer',
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  invited_by    UUID REFERENCES team_members(id) ON DELETE SET NULL,
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_email
  ON team_invitations (lower(email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_invitations_expires
  ON team_invitations (expires_at)
  WHERE accepted_at IS NULL;

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages team invitations" ON team_invitations;
CREATE POLICY "Admin manages team invitations"
  ON team_invitations FOR ALL
  USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

COMMIT;
