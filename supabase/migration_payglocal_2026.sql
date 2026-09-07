-- PayGlocal as a second online gateway on the existing ledger.
-- Reuses razorpay_order_id / razorpay_payment_id columns (merchantTxnId / gid).

BEGIN;

ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS order_payments_provider_check;
ALTER TABLE order_payments
  ADD CONSTRAINT order_payments_provider_check
  CHECK (provider IN ('counter', 'razorpay', 'payglocal'));

ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS order_payments_method_check;
ALTER TABLE order_payments
  ADD CONSTRAINT order_payments_method_check
  CHECK (method IN (
    'cash', 'upi', 'card', 'bank_transfer',
    'razorpay', 'payglocal', 'netbanking', 'wallet', 'emi', 'paylater'
  ));

COMMENT ON COLUMN order_payments.provider IS 'counter = admin POS; razorpay / payglocal = online gateway';

COMMIT;
