-- =============================================================================
-- Navratna Phase 1 — Legacy Import Staging Schema
-- =============================================================================
-- Purpose:
--   Isolated staging area for the Navratna (Sacred Nine Gems) migration from
--   the legacy WordPress / WooCommerce database (pugemved_indb.sql).
--
-- Design rules (apply to every legacy import phase):
--   1. Staging lives in its OWN schema (`legacy_import`) so it can never
--      collide with the application `public` schema, and so a full reset is
--      one DROP SCHEMA away.
--   2. Every staged row preserves the raw legacy payload verbatim.
--   3. Idempotent: re-running this file is safe (CREATE ... IF NOT EXISTS).
--   4. No RLS policies — staging is service-role only and never exposed to
--      the API. The schema is explicitly NOT granted to `anon` / `authenticated`.
--   5. No foreign keys into `public.products` from staging — staging is a
--      read source, never a parent of live tables.
--
-- Apply with:
--   psql "$SUPABASE_DB_URL" -f supabase/navratna_phase1_staging.sql
--
-- Reverse with:
--   DROP SCHEMA legacy_import CASCADE;
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS legacy_import;

REVOKE ALL ON SCHEMA legacy_import FROM PUBLIC;
REVOKE ALL ON SCHEMA legacy_import FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. Raw legacy mirrors (only the columns Phase 1 actually needs).
--    Loaded by scripts/legacy-import/navratna/02-stage.ts.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legacy_import.stg_wp_posts (
    id                  BIGINT      PRIMARY KEY,
    post_author         BIGINT,
    post_date_gmt       TIMESTAMPTZ,
    post_modified_gmt   TIMESTAMPTZ,
    post_content        TEXT,
    post_title          TEXT,
    post_excerpt        TEXT,
    post_status         VARCHAR(40),
    post_name           VARCHAR(400),
    post_parent         BIGINT,
    post_type           VARCHAR(40),
    menu_order          INTEGER,
    raw                 JSONB       NOT NULL,
    staged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stg_wp_posts_type   ON legacy_import.stg_wp_posts (post_type);
CREATE INDEX IF NOT EXISTS idx_stg_wp_posts_status ON legacy_import.stg_wp_posts (post_status);
CREATE INDEX IF NOT EXISTS idx_stg_wp_posts_parent ON legacy_import.stg_wp_posts (post_parent);

CREATE TABLE IF NOT EXISTS legacy_import.stg_wp_postmeta (
    meta_id     BIGINT      PRIMARY KEY,
    post_id     BIGINT      NOT NULL,
    meta_key    VARCHAR(255),
    meta_value  TEXT,
    staged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stg_wp_postmeta_post_key ON legacy_import.stg_wp_postmeta (post_id, meta_key);
CREATE INDEX IF NOT EXISTS idx_stg_wp_postmeta_key      ON legacy_import.stg_wp_postmeta (meta_key);

CREATE TABLE IF NOT EXISTS legacy_import.stg_wp_terms (
    term_id     BIGINT      PRIMARY KEY,
    name        VARCHAR(200),
    slug        VARCHAR(200),
    term_group  BIGINT,
    staged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legacy_import.stg_wp_term_taxonomy (
    term_taxonomy_id BIGINT      PRIMARY KEY,
    term_id          BIGINT      NOT NULL,
    taxonomy         VARCHAR(80),
    description      TEXT,
    parent           BIGINT,
    count            BIGINT,
    staged_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stg_wp_term_taxonomy_tax     ON legacy_import.stg_wp_term_taxonomy (taxonomy);
CREATE INDEX IF NOT EXISTS idx_stg_wp_term_taxonomy_term_id ON legacy_import.stg_wp_term_taxonomy (term_id);

CREATE TABLE IF NOT EXISTS legacy_import.stg_wp_term_relationships (
    object_id        BIGINT      NOT NULL,
    term_taxonomy_id BIGINT      NOT NULL,
    term_order       INTEGER,
    staged_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (object_id, term_taxonomy_id)
);
CREATE INDEX IF NOT EXISTS idx_stg_wp_term_rel_tt ON legacy_import.stg_wp_term_relationships (term_taxonomy_id);

-- -----------------------------------------------------------------------------
-- 2. Transformed canonical row, one per Navratna product.
--    Produced by scripts/legacy-import/navratna/03-transform.ts.
--    This is the row that 06-upsert.ts reads to write `public.products`.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legacy_import.stg_navratna_products (
    legacy_woo_id           BIGINT      PRIMARY KEY,
    -- Identity
    sku                     VARCHAR(100),
    legacy_sku              VARCHAR(100),
    name                    TEXT        NOT NULL,
    slug                    VARCHAR(400) NOT NULL,
    legacy_slug             VARCHAR(400) NOT NULL,
    legacy_permalink        TEXT,
    legacy_status           VARCHAR(40),
    legacy_created_at       TIMESTAMPTZ,
    -- Classification
    category                VARCHAR(40) NOT NULL DEFAULT 'navaratna',
    sub_category            VARCHAR(80) NOT NULL,
    product_type            VARCHAR(30) NOT NULL DEFAULT 'gemstone',
    quality_label           VARCHAR(100),
    recommendation_category_code VARCHAR(100),
    -- Pricing
    price                   DECIMAL(12,2),
    compare_price           DECIMAL(12,2),
    price_per_carat         DECIMAL(10,2),
    price_mode              VARCHAR(30) NOT NULL DEFAULT 'fixed',
    -- Spec
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
    -- Certificate
    certificate_number      VARCHAR(120),
    certificate_lab         VARCHAR(160),
    certificate_status      VARCHAR(40) NOT NULL DEFAULT 'not_required',
    certificate_file_url    TEXT,
    -- Content
    short_desc              TEXT,
    legacy_html_description TEXT,
    clean_description       TEXT,
    -- Media (legacy URLs at transform time; rewritten to Supabase Storage URLs in step 4)
    legacy_thumbnail_url    TEXT,
    legacy_image_urls       JSONB       NOT NULL DEFAULT '[]'::jsonb,
    images                  JSONB       NOT NULL DEFAULT '[]'::jsonb,
    thumbnail_url           TEXT,
    video_url               TEXT,
    -- Stock
    in_stock                BOOLEAN     NOT NULL DEFAULT TRUE,
    stock_status            VARCHAR(30) NOT NULL DEFAULT 'in_stock',
    manual_reserve_enabled  BOOLEAN     NOT NULL DEFAULT FALSE,
    reservation_note        TEXT,
    -- SEO
    meta_title              VARCHAR(70),
    meta_description        VARCHAR(160),
    meta_keywords           TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    canonical_url           TEXT,
    seo_data                JSONB       NOT NULL DEFAULT '{}'::jsonb,
    legacy_seo              JSONB       NOT NULL DEFAULT '{}'::jsonb,
    -- Audit
    legacy_data             JSONB       NOT NULL DEFAULT '{}'::jsonb,
    warnings                JSONB       NOT NULL DEFAULT '[]'::jsonb,
    transformed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transform_version       VARCHAR(20) NOT NULL DEFAULT 'navratna-1'
);
CREATE INDEX IF NOT EXISTS idx_stg_navratna_subcat ON legacy_import.stg_navratna_products (sub_category);
CREATE INDEX IF NOT EXISTS idx_stg_navratna_slug   ON legacy_import.stg_navratna_products (slug);

ALTER TABLE legacy_import.stg_navratna_products
    ADD COLUMN IF NOT EXISTS video_url TEXT;

-- -----------------------------------------------------------------------------
-- 3. Transformed option rules, one row per (product, attribute, option value).
--    Source for `public.product_option_rules` upsert.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legacy_import.stg_navratna_option_rules (
    id                BIGSERIAL    PRIMARY KEY,
    legacy_woo_id     BIGINT       NOT NULL REFERENCES legacy_import.stg_navratna_products (legacy_woo_id) ON DELETE CASCADE,
    kind              VARCHAR(40)  NOT NULL,        -- certificate | energization | metal | mount | size | size_system
    option_label      TEXT         NOT NULL,
    option_slug       VARCHAR(160),
    price_delta       DECIMAL(12,2),
    turnaround_days   INTEGER,
    lab_code          VARCHAR(80),
    sort_order        INTEGER      NOT NULL DEFAULT 0,
    raw               JSONB        NOT NULL,
    UNIQUE (legacy_woo_id, kind, option_label)
);
CREATE INDEX IF NOT EXISTS idx_stg_navratna_options_kind ON legacy_import.stg_navratna_option_rules (kind);

-- -----------------------------------------------------------------------------
-- 4. Media URL map. Filled by step 4 (download → upload). Source for image
--    rewrite in step 6.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legacy_import.stg_media_url_map (
    legacy_url        TEXT         PRIMARY KEY,
    sha256            VARCHAR(64),
    storage_bucket    VARCHAR(80),
    storage_path      TEXT,
    public_url        TEXT,
    width             INTEGER,
    height            INTEGER,
    mime_type         VARCHAR(80),
    bytes             BIGINT,
    download_status   VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- pending | ok | failed | skipped
    download_error    TEXT,
    legacy_attachment_id BIGINT,
    first_seen_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_stg_media_url_map_sha    ON legacy_import.stg_media_url_map (sha256);
CREATE INDEX IF NOT EXISTS idx_stg_media_url_map_status ON legacy_import.stg_media_url_map (download_status);

-- -----------------------------------------------------------------------------
-- 5. Redirect candidates. Populated alongside transform; consumed by step 6
--    to write `public.product_redirect_sources`.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legacy_import.stg_redirect_candidates (
    legacy_woo_id   BIGINT       NOT NULL,
    legacy_path     TEXT         NOT NULL,
    new_path        TEXT         NOT NULL,
    source_label    VARCHAR(80)  NOT NULL,  -- e.g. shop_navratan | product_category_navratan
    PRIMARY KEY (legacy_woo_id, legacy_path)
);

-- -----------------------------------------------------------------------------
-- 6. Dry-run report rows. Persisted so PR reviewers can diff between runs.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legacy_import.stg_dryrun_reports (
    id              BIGSERIAL    PRIMARY KEY,
    batch_label     VARCHAR(80)  NOT NULL,
    phase           VARCHAR(40)  NOT NULL DEFAULT 'navratna',
    summary         JSONB        NOT NULL,
    warnings        JSONB        NOT NULL DEFAULT '[]'::jsonb,
    errors          JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMIT;
