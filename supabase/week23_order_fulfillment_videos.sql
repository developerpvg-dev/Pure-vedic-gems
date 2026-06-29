-- ============================================================================
-- Week 23: Order fulfillment video links (product + puja) for customer journey
-- ============================================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS product_video_url TEXT,
  ADD COLUMN IF NOT EXISTS puja_video_url TEXT;

COMMIT;
