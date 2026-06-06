-- PureVedicGems Week 14 Reward Points Migration
-- Loyalty settings, ledger transactions, order reward fields, and policies.
-- Safe to rerun in development/staging.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- Order reward pricing fields
-- --------------------------------------------------------------------------

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reward_points_redeemed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reward_discount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reward_points_earned INTEGER NOT NULL DEFAULT 0;

-- --------------------------------------------------------------------------
-- Reward configuration and ledger
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reward_settings (
  id VARCHAR(40) PRIMARY KEY DEFAULT 'default',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  earn_points_per_order INTEGER NOT NULL DEFAULT 500 CHECK (earn_points_per_order >= 0),
  point_value_inr DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (point_value_inr > 0),
  min_redeem_points INTEGER NOT NULL DEFAULT 1 CHECK (min_redeem_points >= 0),
  max_redeem_points_per_order INTEGER NOT NULL DEFAULT 5000 CHECK (max_redeem_points_per_order >= 0),
  max_redeem_percent DECIMAL(5,2) NOT NULL DEFAULT 20 CHECK (max_redeem_percent >= 0 AND max_redeem_percent <= 100),
  expiry_days INTEGER CHECK (expiry_days IS NULL OR expiry_days > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES team_members(id) ON DELETE SET NULL
);

INSERT INTO reward_settings (
  id,
  is_active,
  earn_points_per_order,
  point_value_inr,
  min_redeem_points,
  max_redeem_points_per_order,
  max_redeem_percent,
  metadata
)
VALUES (
  'default',
  TRUE,
  500,
  1,
  1,
  5000,
  20,
  '{"legacy_plugin":"SUMO Reward Points","legacy_options":{"rs_global_reward_points":"500","rs_redeem_point":"1","rs_redeem_point_value":"1","rs_fixed_max_redeem_discount":"5000","rs_percent_max_redeem_discount":"20"}}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS reward_settings_updated_at ON reward_settings;
CREATE TRIGGER reward_settings_updated_at BEFORE UPDATE ON reward_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS reward_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type VARCHAR(40) NOT NULL CHECK (type IN ('earned', 'redeemed', 'adjustment', 'expired', 'refund', 'migration')),
  status VARCHAR(30) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  points INTEGER NOT NULL CHECK (points <> 0),
  amount_inr DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  expires_at TIMESTAMPTZ,
  legacy_reward_id BIGINT,
  legacy_wp_user_id BIGINT,
  legacy_order_id BIGINT,
  checkpoint VARCHAR(80),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_customer
  ON reward_point_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_order
  ON reward_point_transactions(order_id)
  WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_transactions_legacy_reward
  ON reward_point_transactions(legacy_reward_id)
  WHERE legacy_reward_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_transactions_order_earned
  ON reward_point_transactions(order_id)
  WHERE type = 'earned' AND order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_transactions_order_redeemed
  ON reward_point_transactions(order_id)
  WHERE type = 'redeemed' AND order_id IS NOT NULL;

DROP TRIGGER IF EXISTS reward_point_transactions_updated_at ON reward_point_transactions;
CREATE TRIGGER reward_point_transactions_updated_at BEFORE UPDATE ON reward_point_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- RLS policies
-- --------------------------------------------------------------------------

ALTER TABLE reward_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active reward settings" ON reward_settings;
CREATE POLICY "Public reads active reward settings" ON reward_settings
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages reward settings" ON reward_settings;
CREATE POLICY "Admin manages reward settings" ON reward_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true));

DROP POLICY IF EXISTS "Users read own reward transactions" ON reward_point_transactions;
CREATE POLICY "Users read own reward transactions" ON reward_point_transactions
  FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admin manages reward transactions" ON reward_point_transactions;
CREATE POLICY "Admin manages reward transactions" ON reward_point_transactions
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true));

COMMIT;