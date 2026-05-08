CREATE TABLE IF NOT EXISTS customer_preferences (
  customer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_preferences JSONB NOT NULL DEFAULT '{
    "email_order_updates": true,
    "email_review_requests": true,
    "email_guides": true,
    "email_offers": false,
    "whatsapp_order_updates": true,
    "whatsapp_consultation": true,
    "wishlist_price_drop": false,
    "wishlist_back_in_stock": false,
    "consent_marketing": false,
    "consent_updated_at": null
  }'::jsonb,
  family_birth_profiles JSONB NOT NULL DEFAULT '[]'::jsonb,
  security_preferences JSONB NOT NULL DEFAULT '{
    "phone_verified": false,
    "high_value_order_review": true,
    "session_review_enabled": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own customer preferences" ON customer_preferences;
CREATE POLICY "Users manage own customer preferences"
  ON customer_preferences FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admin reads customer preferences" ON customer_preferences;
CREATE POLICY "Admin reads customer preferences"
  ON customer_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = auth.uid()
        AND team_members.is_active = TRUE
    )
  );

DROP TRIGGER IF EXISTS customer_preferences_updated_at ON customer_preferences;
CREATE TRIGGER customer_preferences_updated_at
  BEFORE UPDATE ON customer_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_reviews_pending_moderation ON reviews(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_purchase ON reviews(customer_id, order_id, product_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_customer_created ON saved_items(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_status_created ON notification_log(status, created_at DESC);