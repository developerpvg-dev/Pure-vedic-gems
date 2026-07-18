-- Manual refund proofs + billing-complete marker on orders
-- ponytail: refunds are recorded by admin after offline payout; proofs are URLs + txn ref

ALTER TABLE refund_records
  ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(160),
  ADD COLUMN IF NOT EXISTS proof_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS method VARCHAR(40) NOT NULL DEFAULT 'manual';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS billing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS products_marked_sold_at TIMESTAMPTZ;

COMMENT ON COLUMN refund_records.transaction_reference IS 'Bank/UPI/Razorpay transaction id for manual refunds';
COMMENT ON COLUMN refund_records.proof_urls IS 'Screenshot / receipt URLs uploaded by admin';
COMMENT ON COLUMN refund_records.method IS 'manual | razorpay | bank_transfer | upi | other';
COMMENT ON COLUMN orders.billing_completed_at IS 'When admin confirmed billing complete';
COMMENT ON COLUMN orders.products_marked_sold_at IS 'When unique pieces were marked sold on the website';
