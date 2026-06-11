-- ============================================================================
-- Week 19: Category-level review pools for Navaratna (and future categories)
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS category_reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category            VARCHAR(50) NOT NULL,
    sub_category        VARCHAR(100) NOT NULL,
    customer_name       VARCHAR(200) NOT NULL,
    customer_location   VARCHAR(100),
    rating              INTEGER CHECK (rating >= 1 AND rating <= 5),
    title               VARCHAR(200),
    review_text         TEXT NOT NULL,
    images              JSONB DEFAULT '[]'::jsonb,
    is_verified         BOOLEAN DEFAULT FALSE,
    is_approved         BOOLEAN DEFAULT TRUE,
    is_active           BOOLEAN DEFAULT TRUE,
    is_featured         BOOLEAN DEFAULT FALSE,
    source              VARCHAR(30) DEFAULT 'seed'
        CHECK (source IN ('seed', 'customer', 'admin', 'testimonial')),
    source_review_id    UUID REFERENCES reviews(id) ON DELETE SET NULL,
    source_product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
    source_customer_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    testimonial_id      UUID REFERENCES testimonials(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_reviews_pool
    ON category_reviews(category, sub_category, is_approved, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_category_reviews_source_review
    ON category_reviews(source_review_id)
    WHERE source_review_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_category_reviews_unique_source_review
    ON category_reviews(source_review_id)
    WHERE source_review_id IS NOT NULL;

ALTER TABLE category_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads approved category reviews" ON category_reviews;
CREATE POLICY "Public reads approved category reviews"
    ON category_reviews FOR SELECT
    USING (is_approved = true AND is_active = true);

DROP POLICY IF EXISTS "Admin manages category reviews" ON category_reviews;
CREATE POLICY "Admin manages category reviews"
    ON category_reviews FOR ALL
    USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

DROP POLICY IF EXISTS "Customers insert own category reviews" ON category_reviews;
CREATE POLICY "Customers insert own category reviews"
    ON category_reviews FOR INSERT
    WITH CHECK (auth.uid() = source_customer_id);

COMMIT;
