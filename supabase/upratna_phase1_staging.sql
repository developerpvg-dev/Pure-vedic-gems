-- =============================================================================
-- Upratna Phase 1 - Legacy Import Staging Schema
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS legacy_import;

REVOKE ALL ON SCHEMA legacy_import FROM PUBLIC;
REVOKE ALL ON SCHEMA legacy_import FROM anon, authenticated;

-- Raw WordPress mirror tables are shared with the Navratna/Rudraksha imports.
-- They are created by supabase/navratna_phase1_staging.sql and loaded with the
-- Upratna raw subtree before these phase-specific staging rows are generated.

CREATE TABLE IF NOT EXISTS legacy_import.stg_upratna_categories (
    legacy_term_taxonomy_id BIGINT PRIMARY KEY,
    legacy_term_id          BIGINT NOT NULL,
    legacy_slug             VARCHAR(200) NOT NULL,
    legacy_name             VARCHAR(200) NOT NULL,
    legacy_path             TEXT,
    category_slug           VARCHAR(140) NOT NULL,
    category_name           VARCHAR(160) NOT NULL,
    family                  VARCHAR(40) NOT NULL DEFAULT 'upratna',
    sort_order              INTEGER NOT NULL DEFAULT 0,
    legacy_count            INTEGER NOT NULL DEFAULT 0,
    product_count           INTEGER NOT NULL DEFAULT 0,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    source_data             JSONB NOT NULL DEFAULT '{}'::jsonb,
    transformed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stg_upratna_categories_slug
  ON legacy_import.stg_upratna_categories (category_slug);

CREATE TABLE IF NOT EXISTS legacy_import.stg_upratna_products (
    legacy_woo_id           BIGINT PRIMARY KEY,
    sku                     VARCHAR(100),
    legacy_sku              VARCHAR(100),
    name                    TEXT NOT NULL,
    slug                    VARCHAR(400) NOT NULL,
    legacy_slug             VARCHAR(400) NOT NULL,
    legacy_permalink        TEXT,
    legacy_status           VARCHAR(40),
    legacy_created_at       TIMESTAMPTZ,
    category                VARCHAR(40) NOT NULL DEFAULT 'upratna',
    sub_category            VARCHAR(100) NOT NULL,
    product_type            VARCHAR(30) NOT NULL DEFAULT 'gemstone',
    quality_label           VARCHAR(100),
    recommendation_category_code VARCHAR(100),
    price                   DECIMAL(12,2),
    compare_price           DECIMAL(12,2),
    price_per_carat         DECIMAL(10,2),
    price_mode              VARCHAR(30) NOT NULL DEFAULT 'fixed',
    carat_weight            DECIMAL(8,3),
    ratti_weight            DECIMAL(8,3),
    shape                   VARCHAR(80),
    color_description       VARCHAR(200),
    clarity_description     VARCHAR(200),
    treatment_summary       VARCHAR(160),
    origin_country          VARCHAR(100),
    origin_region           VARCHAR(160),
    origin_display          VARCHAR(200),
    dimensions_mm           JSONB,
    composition             VARCHAR(200),
    certificate_number      VARCHAR(120),
    certificate_lab         VARCHAR(160),
    certificate_status      VARCHAR(40) NOT NULL DEFAULT 'not_required',
    certificate_file_url    TEXT,
    short_desc              TEXT,
    legacy_html_description TEXT,
    clean_description       TEXT,
    legacy_thumbnail_url    TEXT,
    legacy_image_urls       JSONB NOT NULL DEFAULT '[]'::jsonb,
    images                  JSONB NOT NULL DEFAULT '[]'::jsonb,
    thumbnail_url           TEXT,
    video_url               TEXT,
    in_stock                BOOLEAN NOT NULL DEFAULT TRUE,
    stock_status            VARCHAR(30) NOT NULL DEFAULT 'in_stock',
    stock_quantity          INTEGER,
    manual_reserve_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    reservation_note        TEXT,
    meta_title              VARCHAR(70),
    meta_description        VARCHAR(160),
    meta_keywords           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    canonical_url           TEXT,
    seo_data                JSONB NOT NULL DEFAULT '{}'::jsonb,
    legacy_seo              JSONB NOT NULL DEFAULT '{}'::jsonb,
    legacy_category_paths   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    legacy_data             JSONB NOT NULL DEFAULT '{}'::jsonb,
    warnings                JSONB NOT NULL DEFAULT '[]'::jsonb,
    transformed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transform_version       VARCHAR(20) NOT NULL DEFAULT 'upratna-1'
);
CREATE INDEX IF NOT EXISTS idx_stg_upratna_subcat
  ON legacy_import.stg_upratna_products (sub_category);
CREATE INDEX IF NOT EXISTS idx_stg_upratna_slug
  ON legacy_import.stg_upratna_products (slug);

CREATE TABLE IF NOT EXISTS legacy_import.stg_upratna_redirect_candidates (
    legacy_woo_id BIGINT NOT NULL,
    legacy_path   TEXT NOT NULL,
    new_path      TEXT NOT NULL,
    source_label  VARCHAR(80) NOT NULL,
    PRIMARY KEY (legacy_woo_id, legacy_path)
);

COMMIT;
