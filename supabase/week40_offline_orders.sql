-- ============================================================================
-- Week 40: Offline / POS orders + counter payment ledger (advance + balance)
-- ============================================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_source VARCHAR(20) NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(20) NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_due DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manual_discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_source_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_order_source_check
  CHECK (order_source IN ('online', 'offline'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_fulfillment_type_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_fulfillment_type_check
  CHECK (fulfillment_type IN ('delivery', 'pickup', 'in_store'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_amount_paid_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_amount_paid_check
  CHECK (amount_paid >= 0);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_manual_discount_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_manual_discount_check
  CHECK (manual_discount >= 0);

-- Extend payment_status for jewelry-store advance billing
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_week3_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_week3_check
  CHECK (payment_status IN (
    'pending', 'authorized', 'captured', 'failed', 'refunded',
    'amount_mismatch', 'cancelled', 'partial'
  )) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_orders_order_source_created
  ON orders (order_source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_amount_due
  ON orders (amount_due)
  WHERE amount_due > 0;

CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  method VARCHAR(30) NOT NULL CHECK (method IN ('cash', 'upi', 'card', 'bank_transfer')),
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('advance', 'balance', 'full', 'refund_adjustment')),
  reference TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order
  ON order_payments (order_id, paid_at DESC);

ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages order payments" ON order_payments;
CREATE POLICY "Admin manages order payments"
  ON order_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

COMMENT ON COLUMN orders.order_source IS 'online = storefront checkout; offline = admin POS / walk-in';
COMMENT ON COLUMN orders.fulfillment_type IS 'delivery | pickup | in_store counter sale';
COMMENT ON COLUMN orders.amount_paid IS 'Sum of counter/online amounts recorded against the order';
COMMENT ON COLUMN orders.amount_due IS 'total - amount_paid (maintained on payment writes)';
COMMENT ON COLUMN orders.manual_discount IS 'Admin POS discount in INR (separate from coupon/rewards)';
COMMENT ON TABLE order_payments IS 'Counter payment ledger: advance, balance, full settle';

COMMIT;
