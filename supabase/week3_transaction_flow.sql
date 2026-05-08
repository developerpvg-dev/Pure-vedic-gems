-- ============================================================================
-- PureVedicGems Week 3 Transaction Flow Migration
-- Cart persistence, cart events, shipping methods, coupon safety, payment event
-- idempotency, guest order protection, and reservation/payment metadata.
-- Run after schema.sql, storage setup, and week2_product_model.sql.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate the timestamp helper defensively for projects that run this file
-- without the original base schema helper in scope.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- Carts and line items
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  item_count INTEGER NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  last_event_at TIMESTAMPTZ DEFAULT NOW(),
  merged_at TIMESTAMPTZ,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (customer_id IS NOT NULL OR guest_session_id IS NOT NULL),
  CHECK (status IN ('active', 'merged', 'ordered', 'abandoned', 'cleared'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_active_customer
  ON carts(customer_id)
  WHERE status = 'active' AND customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_guest_session ON carts(guest_session_id) WHERE guest_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_last_event ON carts(last_event_at DESC);

DROP TRIGGER IF EXISTS carts_updated_at ON carts;
CREATE TRIGGER carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  line_key TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  configuration_id UUID REFERENCES product_configurations(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
  sku VARCHAR(100),
  tag_number VARCHAR(100),
  name_snapshot VARCHAR(240) NOT NULL,
  category_snapshot VARCHAR(100),
  image_url_snapshot TEXT,
  price_snapshot DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total_snapshot DECIMAL(12,2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_cart_line_key ON cart_items(cart_id, line_key);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

DROP TRIGGER IF EXISTS cart_items_updated_at ON cart_items;
CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS cart_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_session_id TEXT,
  cart_id UUID REFERENCES carts(id) ON DELETE SET NULL,
  cart_item_id UUID REFERENCES cart_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  event_type VARCHAR(60) NOT NULL,
  quantity INTEGER,
  value DECIMAL(12,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (customer_id IS NOT NULL OR guest_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_cart_events_customer ON cart_events(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_events_guest ON cart_events(guest_session_id, created_at DESC) WHERE guest_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_events_type ON cart_events(event_type, created_at DESC);

-- --------------------------------------------------------------------------
-- Shipping and coupons
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shipping_methods (
  id VARCHAR(40) PRIMARY KEY,
  label VARCHAR(160) NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  free_above DECIMAL(12,2),
  min_order_amount DECIMAL(12,2),
  max_order_amount DECIMAL(12,2),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  zones TEXT[] NOT NULL DEFAULT ARRAY['IN']::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO shipping_methods (id, label, description, cost, free_above, estimated_days_min, estimated_days_max, sort_order)
VALUES
  ('standard', 'Standard Delivery (5-7 days)', 'Insured domestic delivery across India.', 0, 50000, 5, 7, 10),
  ('express', 'Express Delivery (2-3 days)', 'Priority insured dispatch for eligible pincodes.', 250, NULL, 2, 3, 20),
  ('same_day', 'Same Day (Delhi NCR only)', 'Same-day hand delivery after manual availability confirmation.', 500, NULL, 0, 1, 30)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  cost = EXCLUDED.cost,
  free_above = EXCLUDED.free_above,
  estimated_days_min = EXCLUDED.estimated_days_min,
  estimated_days_max = EXCLUDED.estimated_days_max,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

DROP TRIGGER IF EXISTS shipping_methods_updated_at ON shipping_methods;
CREATE TRIGGER shipping_methods_updated_at BEFORE UPDATE ON shipping_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit_per_customer INTEGER;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applies_to_product_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applies_to_category_slugs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS excluded_product_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS excluded_category_slugs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS first_time_customers_only BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email_hash TEXT,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_customer ON coupon_redemptions(coupon_id, customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_guest ON coupon_redemptions(coupon_id, guest_email_hash) WHERE guest_email_hash IS NOT NULL;

DROP TRIGGER IF EXISTS coupons_updated_at ON coupons;
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- Payment event idempotency and order state metadata
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(30) NOT NULL DEFAULT 'razorpay',
  event_id TEXT,
  event_type VARCHAR(100) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  signature_valid BOOLEAN,
  amount_paise INTEGER,
  expected_paise INTEGER,
  status VARCHAR(40) NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_event
  ON payment_events(provider, event_id)
  WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_events_order ON payment_events(order_id, created_at DESC) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON payment_events(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_access_token TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_review_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notification_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_payment_event_id UUID REFERENCES payment_events(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_guest_access_token
  ON orders(guest_access_token)
  WHERE guest_access_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_review ON orders(payment_status, status) WHERE payment_status IN ('amount_mismatch', 'failed');

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_week3_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_week3_check
  CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'amount_mismatch', 'cancelled')) NOT VALID;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_week3_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_week3_check
  CHECK (status IN (
    'pending_payment', 'placed', 'confirmed', 'processing', 'jewelry_making',
    'certification', 'energization', 'quality_check', 'shipped', 'delivered',
    'cancelled', 'refunded', 'payment_review'
  )) NOT VALID;

-- Week 2 product reservation columns are expected, but add guards for projects
-- that run Week 3 before Week 2 by mistake.
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_individually BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manual_reserve_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_by_customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_by_admin_id UUID REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reservation_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(30) NOT NULL DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) NOT NULL DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tag_number VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_products_reservation ON products(reserved_until) WHERE reserved_until IS NOT NULL;

-- --------------------------------------------------------------------------
-- RLS policies
-- --------------------------------------------------------------------------

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own carts" ON carts;
CREATE POLICY "Users manage own carts" ON carts
  FOR ALL USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Admin manages carts" ON carts;
CREATE POLICY "Admin manages carts" ON carts
  FOR ALL USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own cart items" ON cart_items;
CREATE POLICY "Users manage own cart items" ON cart_items
  FOR ALL USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = auth.uid()));
DROP POLICY IF EXISTS "Admin manages cart items" ON cart_items;
CREATE POLICY "Admin manages cart items" ON cart_items
  FOR ALL USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

ALTER TABLE cart_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own cart events" ON cart_events;
CREATE POLICY "Users insert own cart events" ON cart_events
  FOR INSERT WITH CHECK (auth.uid() = customer_id OR (customer_id IS NULL AND guest_session_id IS NOT NULL));
DROP POLICY IF EXISTS "Admin reads cart events" ON cart_events;
CREATE POLICY "Admin reads cart events" ON cart_events
  FOR SELECT USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads active shipping methods" ON shipping_methods;
CREATE POLICY "Public reads active shipping methods" ON shipping_methods
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin manages shipping methods" ON shipping_methods;
CREATE POLICY "Admin manages shipping methods" ON shipping_methods
  FOR ALL USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin reads coupon redemptions" ON coupon_redemptions;
CREATE POLICY "Admin reads coupon redemptions" ON coupon_redemptions
  FOR SELECT USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin reads payment events" ON payment_events;
CREATE POLICY "Admin reads payment events" ON payment_events
  FOR SELECT USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

COMMIT;