-- ============================================================================
-- Week 39: Internal sales/astrologer commission tracking on orders (admin-only)
-- ============================================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS commission_source TEXT
    CHECK (commission_source IS NULL OR commission_source IN ('salesperson', 'astrologer')),
  ADD COLUMN IF NOT EXISTS commission_name TEXT,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12, 2)
    CHECK (commission_amount IS NULL OR commission_amount >= 0);

COMMENT ON COLUMN orders.commission_source IS 'Internal: salesperson or astrologer who brought the order';
COMMENT ON COLUMN orders.commission_name IS 'Internal: name of salesperson/astrologer';
COMMENT ON COLUMN orders.commission_amount IS 'Internal: commission amount in INR for this order';

COMMIT;
