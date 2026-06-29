-- Week 20: Customer activity log for admin CRM timeline (logins, etc.)
-- and customer account status controls (active / inactive / blocked)

BEGIN;

CREATE TABLE IF NOT EXISTS customer_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(60) NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle TEXT,
  entity_type VARCHAR(80),
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_activity_log_customer_created
  ON customer_activity_log(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_activity_log_type
  ON customer_activity_log(event_type, created_at DESC);

ALTER TABLE customer_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages customer activity log" ON customer_activity_log;
CREATE POLICY "Service role manages customer activity log"
  ON customer_activity_log FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE customer_profiles DROP CONSTRAINT IF EXISTS customer_profiles_account_status_check;
ALTER TABLE customer_profiles
  ADD CONSTRAINT customer_profiles_account_status_check
  CHECK (account_status IN ('active', 'inactive', 'blocked'));

CREATE INDEX IF NOT EXISTS idx_customer_profiles_account_status
  ON customer_profiles(account_status, created_at DESC);

COMMIT;
