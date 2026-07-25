-- Offline manual designs and multiple commission recipients.

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS commissions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_commissions_array_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_commissions_array_check
  CHECK (jsonb_typeof(commissions) = 'array');

UPDATE orders
SET commissions = jsonb_build_array(jsonb_build_object(
  'source', commission_source,
  'name', COALESCE(commission_name, ''),
  'amount', COALESCE(commission_amount, 0)
))
WHERE commissions = '[]'::jsonb
  AND commission_source IS NOT NULL;

COMMENT ON COLUMN orders.commissions IS
  'Admin-only commission recipients: [{source, name, amount}]. Legacy singular columns mirror the first entry.';

COMMIT;
