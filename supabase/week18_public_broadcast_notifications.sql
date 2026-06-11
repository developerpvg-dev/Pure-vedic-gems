-- Week 18: Public broadcast in-app notifications (visible to all visitors)

ALTER TABLE in_app_notifications
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE in_app_notifications
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE in_app_notifications
  DROP CONSTRAINT IF EXISTS in_app_notifications_audience_check;

ALTER TABLE in_app_notifications
  ADD CONSTRAINT in_app_notifications_audience_check
  CHECK (audience IN ('user', 'admin', 'public'));

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_public
  ON in_app_notifications(audience, is_active, created_at DESC)
  WHERE audience = 'public';
