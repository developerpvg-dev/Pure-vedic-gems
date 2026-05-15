-- Week 14: In-app notifications for customers and admins

CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role VARCHAR(40),
  audience VARCHAR(20) NOT NULL CHECK (audience IN ('user', 'admin')),
  type VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  href TEXT,
  entity_type VARCHAR(80),
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user
  ON in_app_notifications(recipient_user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_admin
  ON in_app_notifications(audience, recipient_role, read_at, created_at DESC)
  WHERE audience = 'admin';

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_entity
  ON in_app_notifications(entity_type, entity_id);

ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON in_app_notifications;
CREATE POLICY "Users read own notifications"
  ON in_app_notifications FOR SELECT
  USING (audience = 'user' AND recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON in_app_notifications;
CREATE POLICY "Users update own notifications"
  ON in_app_notifications FOR UPDATE
  USING (audience = 'user' AND recipient_user_id = auth.uid())
  WITH CHECK (audience = 'user' AND recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read admin notifications" ON in_app_notifications;
CREATE POLICY "Admins read admin notifications"
  ON in_app_notifications FOR SELECT
  USING (
    audience = 'admin'
    AND auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Admins update admin notifications" ON in_app_notifications;
CREATE POLICY "Admins update admin notifications"
  ON in_app_notifications FOR UPDATE
  USING (
    audience = 'admin'
    AND auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  )
  WITH CHECK (
    audience = 'admin'
    AND auth.uid() IN (SELECT id FROM team_members WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Service role manages in-app notifications" ON in_app_notifications;
CREATE POLICY "Service role manages in-app notifications"
  ON in_app_notifications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');