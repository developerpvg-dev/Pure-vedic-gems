-- ============================================================================
-- Week 37: Optional click-through URL on homepage hero slides
-- ============================================================================

BEGIN;

ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS link_url TEXT;

COMMIT;
