-- =============================================================================
-- Leftover Phase 1 - Legacy Import Staging Schema
-- =============================================================================
-- Migrates the 85 legacy products that earlier phases skipped because they were
-- tagged only with generic legacy buckets ("Exclusive Gems" / "Pitambari" /
-- "NAVRATAN") instead of a specific stone sub-category:
--   * Opal (60)            -> upratna / opal
--   * Pitambari (23)       -> navaratna / pitambari
--   * Emerald (1)          -> navaratna / emerald
--   * 2 Mukhi Rudraksha(1) -> rudraksha / 2-mukhi
--
-- The raw WordPress mirror tables (stg_wp_*) and the shared stg_media_url_map
-- are created by supabase/navratna_phase1_staging.sql and already loaded.
-- This file only adds the leftover-specific staging tables. The products table
-- is a SUPERSET of the upratna + rudraksha staging columns so a single transform
-- can stage every family and a single upsert can branch on `family`/`category`.
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS legacy_import;

CREATE TABLE IF NOT EXISTS legacy_import.stg_leftover_products (
    legacy_woo_id           BIGINT PRIMARY KEY,
    sku                     VARCHAR(100),
    legacy_sku              VARCHAR(100),
    name                    TEXT NOT NULL,
    slug                    VARCHAR(400) NOT NULL,
    legacy_slug             VARCHAR(400) NOT NULL,
    legacy_permalink        TEXT,
    legacy_status           VARCHAR(40),
    legacy_created_at       TIMESTAMPTZ,
    -- Drives upsert branching: 'gemstone' (opal/pitambari/emerald) | 'rudraksha'
    family                  VARCHAR(40) NOT NULL,
    category                VARCHAR(40) NOT NULL,
    sub_category            VARCHAR(100) NOT NULL,
    product_type            VARCHAR(30) NOT NULL DEFAULT 'gemstone',
    quality_label           VARCHAR(100),
    recommendation_category_code VARCHAR(100),
    -- Pricing
    price                   DECIMAL(12,2),
    compare_price           DECIMAL(12,2),
    price_per_carat         DECIMAL(10,2),
    price_mode              VARCHAR(30) NOT NULL DEFAULT 'fixed',
    -- Gemstone attributes
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
    -- Rudraksha attributes
    rudraksha_type          VARCHAR(60),
    mukhi_count             INTEGER,
    bead_weight             DECIMAL(8,3),
    bead_size_mm            DECIMAL(8,2),
    ruling_deity            VARCHAR(120),
    mantra                  TEXT,
    xray_certificate_number VARCHAR(120),
    energization_eligible   BOOLEAN NOT NULL DEFAULT FALSE,
    -- Certification
    certificate_number      VARCHAR(120),
    certificate_lab         VARCHAR(160),
    certificate_status      VARCHAR(40) NOT NULL DEFAULT 'not_required',
    certificate_file_url    TEXT,
    -- Content
    short_desc              TEXT,
    legacy_html_description TEXT,
    clean_description       TEXT,
    legacy_thumbnail_url    TEXT,
    legacy_image_urls       JSONB NOT NULL DEFAULT '[]'::jsonb,
    images                  JSONB NOT NULL DEFAULT '[]'::jsonb,
    thumbnail_url           TEXT,
    video_url               TEXT,
    -- Stock
    in_stock                BOOLEAN NOT NULL DEFAULT TRUE,
    stock_status            VARCHAR(30) NOT NULL DEFAULT 'in_stock',
    stock_quantity          INTEGER,
    manual_reserve_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    reservation_note        TEXT,
    -- SEO
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
    transform_version       VARCHAR(20) NOT NULL DEFAULT 'leftover-1'
);
CREATE INDEX IF NOT EXISTS idx_stg_leftover_family
  ON legacy_import.stg_leftover_products (family);
CREATE INDEX IF NOT EXISTS idx_stg_leftover_subcat
  ON legacy_import.stg_leftover_products (sub_category);
CREATE INDEX IF NOT EXISTS idx_stg_leftover_slug
  ON legacy_import.stg_leftover_products (slug);

CREATE TABLE IF NOT EXISTS legacy_import.stg_leftover_redirect_candidates (
    legacy_woo_id BIGINT NOT NULL,
    legacy_path   TEXT NOT NULL,
    new_path      TEXT NOT NULL,
    source_label  VARCHAR(80) NOT NULL,
    PRIMARY KEY (legacy_woo_id, legacy_path)
);

COMMIT;
