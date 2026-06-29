-- ============================================================================
-- Week 25: Allow design-phase order statuses + team member avatars
-- Run after week24_designer_workflow.sql
-- ============================================================================

BEGIN;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_week3_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_week3_check
  CHECK (status IN (
    'pending_payment', 'placed', 'confirmed', 'processing',
    'design_assigned', 'design_in_progress', 'design_completed',
    'jewelry_making', 'certification', 'energization', 'quality_check',
    'shipped', 'delivered', 'cancelled', 'refunded', 'payment_review'
  )) NOT VALID;

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMIT;
