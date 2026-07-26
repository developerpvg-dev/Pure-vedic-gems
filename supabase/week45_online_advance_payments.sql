-- ============================================================================
-- Week 45: Online advance payments (pay 20-100% upfront, balance when ready)
--
-- Reuses the Week 40 counter ledger (order_payments / amount_paid / amount_due)
-- instead of a second payments model. Online Razorpay attempts now live in the
-- same ledger as counter payments, with provider + status + gateway ids.
-- ============================================================================

BEGIN;

ALTER TABLE order_payments
  ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'counter',
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS order_payments_provider_check;
ALTER TABLE order_payments
  ADD CONSTRAINT order_payments_provider_check
  CHECK (provider IN ('counter', 'razorpay'));

-- pending = Razorpay order created, money not yet captured.
ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS order_payments_status_check;
ALTER TABLE order_payments
  ADD CONSTRAINT order_payments_status_check
  CHECK (status IN ('pending', 'paid', 'failed'));

-- Razorpay reports methods the counter list never had (netbanking, wallet, emi...).
ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS order_payments_method_check;
ALTER TABLE order_payments
  ADD CONSTRAINT order_payments_method_check
  CHECK (method IN (
    'cash', 'upi', 'card', 'bank_transfer',
    'razorpay', 'netbanking', 'wallet', 'emi', 'paylater'
  ));

-- One ledger row per Razorpay order/payment — the idempotency key for
-- concurrent client-verify and webhook finalizers.
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payments_razorpay_order
  ON order_payments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payments_razorpay_payment
  ON order_payments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- Only one payment attempt may be in flight per order.
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payments_one_pending
  ON order_payments (order_id)
  WHERE status = 'pending';

-- Counter rows recorded before this migration were always settled cash/UPI.
UPDATE order_payments SET provider = 'counter', status = 'paid'
WHERE provider IS NULL OR status IS NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS balance_due_notified_at TIMESTAMPTZ;

-- Fully paid orders predate the ledger columns; make Paid/Due read correctly.
UPDATE orders
SET amount_paid = total, amount_due = 0
WHERE payment_status = 'captured' AND amount_paid = 0 AND total > 0;

-- Customers need to see their own advance/balance receipts in /account/orders.
DROP POLICY IF EXISTS "Customers view own order payments" ON order_payments;
CREATE POLICY "Customers view own order payments"
  ON order_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_payments.order_id AND o.customer_id = auth.uid()
  ));

COMMENT ON COLUMN order_payments.provider IS 'counter = admin POS entry; razorpay = online gateway payment';
COMMENT ON COLUMN order_payments.status IS 'pending = gateway order created; paid = captured; failed = abandoned/declined';
COMMENT ON COLUMN orders.balance_due_notified_at IS 'When admin last asked the customer to pay the remaining balance';

COMMIT;
