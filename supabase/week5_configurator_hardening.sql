-- Week 5: Configurator hardening and product option eligibility
-- Adds immutable configuration snapshots, custom design review fields,
-- delivery ETA metadata, and gold-rate override audit trail.

ALTER TABLE product_configurations
  ADD COLUMN IF NOT EXISTS custom_design_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_design_status VARCHAR(40),
  ADD COLUMN IF NOT EXISTS custom_design_fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_eta_min_days INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_eta_max_days INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_eta_label TEXT,
  ADD COLUMN IF NOT EXISTS configuration_snapshot JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB DEFAULT '{}'::jsonb;

ALTER TABLE product_configurations
  ALTER COLUMN status TYPE VARCHAR(60);

CREATE INDEX IF NOT EXISTS idx_configs_status_created
  ON product_configurations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_configs_custom_design_queue
  ON product_configurations(custom_design_status, created_at DESC)
  WHERE custom_design_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_configs_snapshot_gin
  ON product_configurations USING GIN (configuration_snapshot);

CREATE TABLE IF NOT EXISTS gold_rate_override_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gold_rate_cache_id INTEGER REFERENCES gold_rate_cache(id) ON DELETE SET NULL,
  gold_22k_per_gram DECIMAL(10,2) NOT NULL,
  gold_18k_per_gram DECIMAL(10,2),
  silver_per_gram DECIMAL(10,2),
  source TEXT,
  manual_override BOOLEAN DEFAULT FALSE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gold_rate_override_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin reads gold rate override audit" ON gold_rate_override_audit;
CREATE POLICY "Admin reads gold rate override audit"
  ON gold_rate_override_audit FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = auth.uid()
        AND team_members.is_active = TRUE
        AND team_members.role IN ('director', 'admin', 'accounts')
    )
  );

DROP POLICY IF EXISTS "Service role manages gold rate override audit" ON gold_rate_override_audit;
CREATE POLICY "Service role manages gold rate override audit"
  ON gold_rate_override_audit FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION log_gold_rate_override_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.manual_override, FALSE) THEN
    INSERT INTO gold_rate_override_audit (
      gold_rate_cache_id,
      gold_22k_per_gram,
      gold_18k_per_gram,
      silver_per_gram,
      source,
      manual_override,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.gold_22k_per_gram,
      NEW.gold_18k_per_gram,
      NEW.silver_per_gram,
      NEW.source,
      NEW.manual_override,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gold_rate_override_audit ON gold_rate_cache;
CREATE TRIGGER trg_gold_rate_override_audit
  AFTER INSERT OR UPDATE ON gold_rate_cache
  FOR EACH ROW EXECUTE FUNCTION log_gold_rate_override_audit();

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    file_size_limit = 10485760
WHERE id = 'custom-uploads';