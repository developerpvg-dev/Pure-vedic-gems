-- ═══════════════════════════════════════════════════════════════════════════
-- Navratna Phase 1 — Minimal Canonical Schema for Staging
-- ═══════════════════════════════════════════════════════════════════════════
-- Creates only the public.* tables that 06-upsert writes to.
-- No RLS, no team_members FKs, no auth.users FKs — service-role only.
-- Idempotent: CREATE TABLE IF NOT EXISTS + ON CONFLICT seeds.
-- ═══════════════════════════════════════════════════════════════════════════

-- products: superset of base + week2/week3/week7/week12 columns that 06-upsert writes.
CREATE TABLE IF NOT EXISTS public.products (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku              VARCHAR(100) UNIQUE NOT NULL,
    name             VARCHAR(255) NOT NULL,
    slug             VARCHAR(255) UNIQUE NOT NULL,
    category         VARCHAR(50)  NOT NULL,
    sub_category     VARCHAR(100),
    price            DECIMAL(12,2) NOT NULL,
    price_per_carat  DECIMAL(12,2),
    compare_price    DECIMAL(12,2),
    currency         VARCHAR(3) DEFAULT 'INR',
    carat_weight     DECIMAL(8,3),
    ratti_weight     DECIMAL(8,3),
    shape            VARCHAR(80),
    short_desc       TEXT,
    description      TEXT,
    images           JSONB DEFAULT '[]'::jsonb,
    thumbnail_url    TEXT,
    in_stock         BOOLEAN DEFAULT TRUE,
    is_active        BOOLEAN DEFAULT TRUE,
    meta_title       VARCHAR(255),
    meta_description VARCHAR(500),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    -- week2 additions
    legacy_woo_id    BIGINT,
    legacy_parent_id BIGINT,
    legacy_sku       VARCHAR(100),
    legacy_slug      VARCHAR(255),
    legacy_permalink TEXT,
    legacy_status    VARCHAR(50),
    legacy_created_at TIMESTAMPTZ,
    import_batch_id  UUID,
    import_warnings  JSONB DEFAULT '[]'::jsonb,
    legacy_data      JSONB DEFAULT '{}'::jsonb,
    product_type     VARCHAR(30) DEFAULT 'gemstone',
    price_mode       VARCHAR(30) DEFAULT 'fixed',
    tax_status       VARCHAR(30) DEFAULT 'taxable',
    stock_status     VARCHAR(30) DEFAULT 'instock',
    availability_status VARCHAR(40) DEFAULT 'available',
    manual_reserve_enabled BOOLEAN DEFAULT FALSE,
    reservation_note TEXT,
    clean_description TEXT,
    legacy_html_description TEXT,
    meta_keywords    TEXT[] DEFAULT ARRAY[]::TEXT[],
    canonical_url    TEXT,
    seo_data         JSONB DEFAULT '{}'::jsonb,
    legacy_seo       JSONB DEFAULT '{}'::jsonb,
    gemstone_name    VARCHAR(100),
    quality_label    VARCHAR(80),
    color_description TEXT,
    clarity_description TEXT,
    treatment_summary TEXT,
    origin_country   VARCHAR(80),
    origin_region    VARCHAR(120),
    origin_display   VARCHAR(200),
    dimensions_mm    JSONB,
    composition      VARCHAR(120),
    recommendation_category_code VARCHAR(40),
    certificate_number VARCHAR(120),
    certificate_lab  VARCHAR(80),
    certificate_status VARCHAR(40),
    certificate_display_enabled BOOLEAN DEFAULT TRUE,
    certificate_file_url TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_legacy_woo_id
  ON public.products (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category, sub_category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- product_categories
CREATE TABLE IF NOT EXISTS public.product_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(120) UNIQUE NOT NULL,
    name            VARCHAR(160) NOT NULL,
    family          VARCHAR(40),
    parent_id       UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    description     TEXT,
    legacy_names    TEXT[] DEFAULT ARRAY[]::TEXT[],
    canonical_path  TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed parent + all navaratna children including white-sapphire
INSERT INTO public.product_categories (slug, name, family, legacy_names, canonical_path, sort_order) VALUES
  ('navaratna', 'Navaratna Gemstones', 'navaratna', ARRAY['NAVRATAN','Navratan'], '/shop/navaratna', 10)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, family=EXCLUDED.family, canonical_path=EXCLUDED.canonical_path;

INSERT INTO public.product_categories (slug, name, family, parent_id, legacy_names, canonical_path, sort_order)
SELECT v.slug, v.name, 'navaratna', p.id, v.legacy_names, v.canonical_path, v.sort_order
FROM (VALUES
  ('ruby',            'Ruby (Manik)',                  ARRAY['Ruby','NAVRATAN > Ruby'],                           '/shop/ruby',            101),
  ('pearl',           'Pearl (Moti)',                  ARRAY['Pearl','NAVRATAN > Pearl'],                         '/shop/pearl',           102),
  ('red-coral',       'Red Coral (Moonga)',            ARRAY['Red Coral','NAVRATAN > Red Coral'],                 '/shop/red-coral',       103),
  ('emerald',         'Emerald (Panna)',               ARRAY['Emerald','NAVRATAN > Emerald'],                     '/shop/emerald',         104),
  ('yellow-sapphire', 'Yellow Sapphire (Pukhraj)',     ARRAY['Yellow Sapphire','NAVRATAN > Yellow Sapphire'],     '/shop/yellow-sapphire', 105),
  ('diamond',         'Diamond (Heera)',               ARRAY['Diamond','NAVRATAN > Diamond'],                     '/shop/diamond',         106),
  ('blue-sapphire',   'Blue Sapphire (Neelam)',        ARRAY['Blue Sapphire','NAVRATAN > Blue Sapphire'],         '/shop/blue-sapphire',   107),
  ('hessonite',       'Hessonite (Gomed)',             ARRAY['Hessonite','Gomed'],                                '/shop/hessonite',       108),
  ('cats-eye',        'Cat''s Eye (Lehsunia)',         ARRAY['Catseye','Cat''s Eye'],                             '/shop/cats-eye',        109),
  ('white-sapphire',  'White Sapphire (Safed Pukhraj)',ARRAY['White Sapphire', 'Shvet Pukhraj'],                  '/shop/white-sapphire',  111)
) AS v(slug, name, legacy_names, canonical_path, sort_order)
JOIN public.product_categories p ON p.slug='navaratna'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, parent_id=EXCLUDED.parent_id, legacy_names=EXCLUDED.legacy_names, canonical_path=EXCLUDED.canonical_path, sort_order=EXCLUDED.sort_order;

-- assignments
CREATE TABLE IF NOT EXISTS public.product_category_assignments (
    product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id  UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
    is_primary   BOOLEAN DEFAULT FALSE,
    sort_order   INTEGER DEFAULT 0,
    legacy_path  TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, category_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pca_primary
  ON public.product_category_assignments(product_id) WHERE is_primary = TRUE;

-- option rules (single row per product)
CREATE TABLE IF NOT EXISTS public.product_option_rules (
    product_id              UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    certificate_enabled     BOOLEAN DEFAULT FALSE,
    energization_enabled    BOOLEAN DEFAULT FALSE,
    jewelry_design_enabled  BOOLEAN DEFAULT FALSE,
    metal_enabled           BOOLEAN DEFAULT FALSE,
    ring_size_enabled       BOOLEAN DEFAULT FALSE,
    allowed_setting_types   TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_metals          TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_ring_size_systems TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_certification_lab_ids UUID[] DEFAULT ARRAY[]::UUID[],
    allowed_energization_option_ids UUID[] DEFAULT ARRAY[]::UUID[],
    legacy_certificate_options JSONB DEFAULT '[]'::jsonb,
    legacy_energization_options JSONB DEFAULT '[]'::jsonb,
    legacy_metal_options       JSONB DEFAULT '[]'::jsonb,
    legacy_setting_options     JSONB DEFAULT '[]'::jsonb,
    legacy_ring_size_options   JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- redirects
CREATE TABLE IF NOT EXISTS public.product_redirect_sources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
    source_url  TEXT UNIQUE NOT NULL,
    source_slug VARCHAR(255),
    http_status INTEGER DEFAULT 301,
    source      VARCHAR(40) DEFAULT 'woocommerce',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

  CREATE INDEX IF NOT EXISTS idx_product_redirect_sources_active
    ON public.product_redirect_sources(source_url)
    WHERE is_active = TRUE;

-- import batches
CREATE TABLE IF NOT EXISTS public.product_import_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          VARCHAR(80) NOT NULL DEFAULT 'woocommerce_csv',
    filename        TEXT,
    status          VARCHAR(40) NOT NULL DEFAULT 'pending',
    total_rows      INTEGER DEFAULT 0,
    processed_rows  INTEGER DEFAULT 0,
    failed_rows     INTEGER DEFAULT 0,
    summary         JSONB DEFAULT '{}'::jsonb,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);
