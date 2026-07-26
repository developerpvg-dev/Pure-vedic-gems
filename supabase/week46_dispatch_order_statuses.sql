-- ============================================================================
-- Week 46: Parcel dispatch statuses — out_for_delivery + post-delivery feedback
-- Run after week45_online_advance_payments.sql
-- ============================================================================

BEGIN;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_week3_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_week3_check
  CHECK (status IN (
    'pending_payment', 'placed', 'confirmed', 'processing',
    'design_assigned', 'design_in_progress', 'design_completed',
    'jewelry_making', 'certification', 'energization', 'quality_check',
    'shipped', 'out_for_delivery', 'delivered', 'feedback',
    'cancelled', 'refunded', 'payment_review'
  )) NOT VALID;

COMMIT;
