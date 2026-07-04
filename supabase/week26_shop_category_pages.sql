-- ============================================================================
-- Week 26: Shop category hub pages — rich SEO content per product category
-- Run after gem_categories / product_categories migrations. Idempotent.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS shop_category_pages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(100) UNIQUE NOT NULL,
    name                VARCHAR(200) NOT NULL,
    sanskrit_name       VARCHAR(100),
    product_category    VARCHAR(50) NOT NULL,
    planet              VARCHAR(50),
    image_url           TEXT,
    hero_image_url      TEXT,

    seo_title           TEXT,
    seo_description     TEXT,
    meta_keywords       TEXT[] DEFAULT '{}',

    intro_text          TEXT,
    hero_benefits       JSONB DEFAULT '[]'::jsonb,

    about_html          TEXT,
    how_to_wear_html    TEXT,
    who_should_wear_html TEXT,
    benefits_html       TEXT,
    types_html          TEXT,
    quality_price_html  TEXT,
    jewellery_html      TEXT,
    cleaning_care_html  TEXT,
    buyer_beware_html   TEXT,
    faqs                JSONB DEFAULT '[]'::jsonb,

    geo_primary_city    VARCHAR(100) DEFAULT 'New Delhi',
    geo_primary_country VARCHAR(10) DEFAULT 'IN',
    geo_service_areas   TEXT[] DEFAULT ARRAY['India', 'United Kingdom', 'United States', 'Canada', 'Australia', 'UAE'],

    sort_order          INTEGER DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_category_pages_slug ON shop_category_pages(slug);
CREATE INDEX IF NOT EXISTS idx_shop_category_pages_active ON shop_category_pages(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_shop_category_pages_product_category ON shop_category_pages(product_category, is_active);

ALTER TABLE shop_category_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active shop category pages" ON shop_category_pages;
CREATE POLICY "Public reads active shop category pages"
    ON shop_category_pages FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages shop category pages" ON shop_category_pages;
CREATE POLICY "Admin manages shop category pages"
    ON shop_category_pages FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

DROP TRIGGER IF EXISTS shop_category_pages_updated_at ON shop_category_pages;
CREATE TRIGGER shop_category_pages_updated_at
    BEFORE UPDATE ON shop_category_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
