-- ============================================================================
-- Week 22: Admin-managed homepage hero slides
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS hero_slides (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              VARCHAR(80) UNIQUE NOT NULL,
  desktop_image_url TEXT NOT NULL,
  mobile_image_url  TEXT NOT NULL,
  alt_text          VARCHAR(260) NOT NULL,
  link_url          TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_public
  ON hero_slides (is_active, sort_order, created_at);

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active hero slides" ON hero_slides;
CREATE POLICY "Public reads active hero slides"
  ON hero_slides FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages hero slides" ON hero_slides;
CREATE POLICY "Admin manages hero slides"
  ON hero_slides FOR ALL
  USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

WITH seed(slug, desktop_image_url, mobile_image_url, alt_text, sort_order) AS (
  VALUES
    (
      'hero-slide-1',
      '/home/hero/pvgheropc1.webp',
      '/home/hero/pvgherobg1.webp',
      'Find Your Lucky Gem - Pure Vedic Gems',
      10
    ),
    (
      'hero-slide-2',
      '/home/hero/pvgheropc2.webp',
      '/home/hero/pvgherobg2.webp',
      'Create Your Perfect Gemstone Jewellery - Pure Vedic Gems',
      20
    ),
    (
      'hero-slide-3',
      '/home/hero/pvgheropc3.webp',
      '/home/hero/pvgherobg3.webp',
      'Swift Results & Blessed Life - Pure Vedic Gems',
      30
    )
)
INSERT INTO hero_slides (slug, desktop_image_url, mobile_image_url, alt_text, sort_order, is_active)
SELECT slug, desktop_image_url, mobile_image_url, alt_text, sort_order, true
FROM seed
ON CONFLICT (slug) DO UPDATE SET
  desktop_image_url = EXCLUDED.desktop_image_url,
  mobile_image_url = EXCLUDED.mobile_image_url,
  alt_text = EXCLUDED.alt_text,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;
