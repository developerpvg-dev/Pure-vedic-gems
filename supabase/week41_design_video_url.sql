-- ============================================================================
-- Week 41: Optional YouTube video URL per jewelry design
-- ============================================================================

BEGIN;

ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMIT;
