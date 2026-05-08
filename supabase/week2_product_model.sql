-- PureVedicGems Week 2 Product Model Migration
-- Product schema, taxonomy, validators, and WooCommerce migration-ready foundations.
-- Safe to rerun in development/staging because every structural operation is guarded.

BEGIN;

-- Extensions used by generated UUID defaults and optional trigram search indexes.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- Products: legacy identity, product type, availability lifecycle, SEO, and
-- category-specific structured fields.
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_woo_id BIGINT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_parent_id BIGINT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_slug VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_permalink TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_status VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_created_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS import_batch_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS import_warnings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(30) DEFAULT 'gemstone';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tag_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS variation_parent_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS grouped_product_ids UUID[] DEFAULT ARRAY[]::UUID[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS downloadable_files JSONB DEFAULT '[]'::jsonb;

ALTER TABLE products ADD COLUMN IF NOT EXISTS price_mode VARCHAR(30) DEFAULT 'fixed';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_starts_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_ends_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_status VARCHAR(30) DEFAULT 'taxable';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_class VARCHAR(100);

ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(30) DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_individually BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS backorders_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manual_reserve_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_by_customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_by_admin_id UUID REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reservation_note TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS clean_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_html_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_reviews BOOLEAN DEFAULT TRUE;

ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_keywords TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_seo JSONB DEFAULT '{}'::jsonb;

ALTER TABLE products ADD COLUMN IF NOT EXISTS gemstone_name VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS quality_label VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS commercial_quality_grade VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_description VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS clarity_description VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS treatment_summary VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS treatment_detail TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_country VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_region VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_display VARCHAR(160);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions_mm JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS composition VARCHAR(160);
ALTER TABLE products ADD COLUMN IF NOT EXISTS recommendation_category_code VARCHAR(100);

ALTER TABLE products ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS certificate_lab VARCHAR(160);
ALTER TABLE products ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(40) DEFAULT 'not_required';
ALTER TABLE products ADD COLUMN IF NOT EXISTS certificate_display_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS certificate_file_url TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS rudraksha_type VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS bead_size_mm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS bead_weight DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS xray_certificate_number VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS deity VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS mantra TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS energization_eligible BOOLEAN DEFAULT FALSE;

ALTER TABLE products ADD COLUMN IF NOT EXISTS jewellery_type VARCHAR(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_metal VARCHAR(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS metal_purity VARCHAR(40);
ALTER TABLE products ADD COLUMN IF NOT EXISTS metal_weight_grams DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_label VARCHAR(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ring_size VARCHAR(40);
ALTER TABLE products ADD COLUMN IF NOT EXISTS design_code VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS making_charge DECIMAL(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ready_stock BOOLEAN DEFAULT FALSE;

ALTER TABLE products ADD COLUMN IF NOT EXISTS service_duration VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS service_delivery_mode VARCHAR(80);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products
  ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN (
    'simple', 'variation', 'gemstone', 'rudraksha', 'jewelry', 'idol', 'mala',
    'service', 'external', 'grouped', 'downloadable'
  )) NOT VALID;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_mode_check;
ALTER TABLE products
  ADD CONSTRAINT products_price_mode_check
  CHECK (price_mode IN ('fixed', 'per_carat', 'on_demand', 'quote_required', 'free')) NOT VALID;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_stock_status_check
  CHECK (stock_status IN ('in_stock', 'out_of_stock', 'on_backorder')) NOT VALID;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_availability_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_availability_status_check
  CHECK (availability_status IN ('in_stock', 'out_of_stock', 'sold', 'reserved', 'on_demand', 'archived')) NOT VALID;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_certificate_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_certificate_status_check
  CHECK (certificate_status IN ('not_required', 'available', 'included', 'optional', 'requested', 'pending', 'verified')) NOT VALID;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_reserved_quantity_non_negative_check;
ALTER TABLE products
  ADD CONSTRAINT products_reserved_quantity_non_negative_check
  CHECK (reserved_quantity >= 0) NOT VALID;

-- Backfill sensible defaults for existing rows.
UPDATE products
SET
  product_type = COALESCE(product_type,
    CASE
      WHEN category = 'rudraksha' THEN 'rudraksha'
      WHEN category = 'jewelry' THEN 'jewelry'
      WHEN category = 'mala' THEN 'mala'
      WHEN category = 'idol' THEN 'idol'
      ELSE 'gemstone'
    END
  ),
  stock_status = COALESCE(stock_status, CASE WHEN in_stock THEN 'in_stock' ELSE 'out_of_stock' END),
  availability_status = COALESCE(availability_status, CASE WHEN in_stock THEN 'in_stock' ELSE 'out_of_stock' END),
  price_mode = COALESCE(price_mode, CASE WHEN price_per_carat IS NOT NULL THEN 'per_carat' ELSE 'fixed' END),
  import_warnings = COALESCE(import_warnings, '[]'::jsonb),
  legacy_data = COALESCE(legacy_data, '{}'::jsonb),
  seo_data = COALESCE(seo_data, '{}'::jsonb),
  legacy_seo = COALESCE(legacy_seo, '{}'::jsonb),
  meta_keywords = COALESCE(meta_keywords, ARRAY[]::TEXT[]),
  grouped_product_ids = COALESCE(grouped_product_ids, ARRAY[]::UUID[]),
  downloadable_files = COALESCE(downloadable_files, '[]'::jsonb),
  allow_reviews = COALESCE(allow_reviews, TRUE),
  certificate_display_enabled = COALESCE(certificate_display_enabled, FALSE),
  energization_eligible = COALESCE(energization_eligible, FALSE),
  ready_stock = COALESCE(ready_stock, FALSE),
  manual_reserve_enabled = COALESCE(manual_reserve_enabled, FALSE),
  reserved_quantity = COALESCE(reserved_quantity, 0)
WHERE TRUE;

-- ============================================================================
-- Canonical taxonomy: replaces one-off category strings while retaining the
-- existing products.category/sub_category fields for compatibility.
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    slug VARCHAR(140) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    family VARCHAR(40) NOT NULL,
    legacy_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT,
    image_url TEXT,
    seo_title VARCHAR(200),
    seo_description VARCHAR(500),
    meta_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    canonical_path TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_category_assignments (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    legacy_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, category_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_category_assignments_primary
  ON product_category_assignments(product_id)
  WHERE is_primary = TRUE;

CREATE TABLE IF NOT EXISTS product_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    badge_label VARCHAR(80),
    color VARCHAR(40),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_collection_assignments (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, collection_id)
);

-- ============================================================================
-- Currency, option eligibility, redirect, and import foundations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS currency_rates (
    currency VARCHAR(3) PRIMARY KEY,
    rate_to_inr DECIMAL(14,6) NOT NULL,
    source VARCHAR(80),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    manual_override BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS product_currency_prices (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    compare_price DECIMAL(12,2),
    price_per_carat DECIMAL(12,2),
    source VARCHAR(40) DEFAULT 'legacy',
    rate_snapshot DECIMAL(14,6),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, currency)
);

CREATE TABLE IF NOT EXISTS product_option_rules (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    certificate_enabled BOOLEAN DEFAULT FALSE,
    energization_enabled BOOLEAN DEFAULT FALSE,
    jewelry_design_enabled BOOLEAN DEFAULT FALSE,
    metal_enabled BOOLEAN DEFAULT FALSE,
    ring_size_enabled BOOLEAN DEFAULT FALSE,
    allowed_setting_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_metals TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_ring_size_systems TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_certification_lab_ids UUID[] DEFAULT ARRAY[]::UUID[],
    allowed_energization_option_ids UUID[] DEFAULT ARRAY[]::UUID[],
    legacy_certificate_options JSONB DEFAULT '[]'::jsonb,
    legacy_energization_options JSONB DEFAULT '[]'::jsonb,
    legacy_metal_options JSONB DEFAULT '[]'::jsonb,
    legacy_setting_options JSONB DEFAULT '[]'::jsonb,
    legacy_ring_size_options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_redirect_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    source_url TEXT UNIQUE NOT NULL,
    source_slug VARCHAR(255),
    http_status INTEGER DEFAULT 301,
    source VARCHAR(40) DEFAULT 'woocommerce',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(80) NOT NULL DEFAULT 'woocommerce_csv',
    filename TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'pending',
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    summary JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_import_batch_fk;
ALTER TABLE products
  ADD CONSTRAINT products_import_batch_fk
  FOREIGN KEY (import_batch_id) REFERENCES product_import_batches(id) ON DELETE SET NULL
  NOT VALID;

-- ============================================================================
-- Indexes for admin lookup, migration reconciliation, SEO redirects, and filters.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_legacy_woo_id
  ON products(legacy_woo_id)
  WHERE legacy_woo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_legacy_parent_id ON products(legacy_parent_id) WHERE legacy_parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_legacy_slug ON products(legacy_slug) WHERE legacy_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_legacy_sku ON products(legacy_sku) WHERE legacy_sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_tag_number ON products(tag_number) WHERE tag_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability_status, is_active);
CREATE INDEX IF NOT EXISTS idx_products_price_mode ON products(price_mode);
CREATE INDEX IF NOT EXISTS idx_products_quality_label ON products(quality_label) WHERE quality_label IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_certificate_number ON products(certificate_number) WHERE certificate_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_origin_display ON products(origin_display) WHERE origin_display IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_categories_family ON product_categories(family, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_categories_legacy_names ON product_categories USING GIN (legacy_names);
CREATE INDEX IF NOT EXISTS idx_product_collections_active ON product_collections(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_option_rules_enabled ON product_option_rules(certificate_enabled, energization_enabled, jewelry_design_enabled);
CREATE INDEX IF NOT EXISTS idx_product_redirect_sources_slug ON product_redirect_sources(source_slug) WHERE source_slug IS NOT NULL;

-- ============================================================================
-- RLS policies: public reads for active taxonomy/assignment metadata, admin full
-- access for authenticated active team members. Product row visibility remains
-- governed by existing products RLS policies.
-- ============================================================================

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collection_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_currency_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_redirect_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product categories publicly viewable" ON product_categories;
CREATE POLICY "Product categories publicly viewable"
  ON product_categories FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Product category assignments publicly viewable" ON product_category_assignments;
CREATE POLICY "Product category assignments publicly viewable"
  ON product_category_assignments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_category_assignments.product_id
        AND products.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Product collections publicly viewable" ON product_collections;
CREATE POLICY "Product collections publicly viewable"
  ON product_collections FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Product collection assignments publicly viewable" ON product_collection_assignments;
CREATE POLICY "Product collection assignments publicly viewable"
  ON product_collection_assignments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_collection_assignments.product_id
        AND products.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Currency rates publicly viewable" ON currency_rates;
CREATE POLICY "Currency rates publicly viewable"
  ON currency_rates FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Product currency prices publicly viewable" ON product_currency_prices;
CREATE POLICY "Product currency prices publicly viewable"
  ON product_currency_prices FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_currency_prices.product_id
        AND products.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Product option rules publicly viewable" ON product_option_rules;
CREATE POLICY "Product option rules publicly viewable"
  ON product_option_rules FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_option_rules.product_id
        AND products.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Product redirects publicly viewable" ON product_redirect_sources;
CREATE POLICY "Product redirects publicly viewable"
  ON product_redirect_sources FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin manages product categories" ON product_categories;
CREATE POLICY "Admin manages product categories"
  ON product_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admin manages product category assignments" ON product_category_assignments;
CREATE POLICY "Admin manages product category assignments"
  ON product_category_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admin manages product collections" ON product_collections;
CREATE POLICY "Admin manages product collections"
  ON product_collections FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admin manages product collection assignments" ON product_collection_assignments;
CREATE POLICY "Admin manages product collection assignments"
  ON product_collection_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admin manages currency rates" ON currency_rates;
CREATE POLICY "Admin manages currency rates"
  ON currency_rates FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admin manages product currency prices" ON product_currency_prices;
CREATE POLICY "Admin manages product currency prices"
  ON product_currency_prices FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admin manages product option rules" ON product_option_rules;
CREATE POLICY "Admin manages product option rules"
  ON product_option_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admin manages product redirects" ON product_redirect_sources;
CREATE POLICY "Admin manages product redirects"
  ON product_redirect_sources FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

DROP POLICY IF EXISTS "Admin manages product import batches" ON product_import_batches;
CREATE POLICY "Admin manages product import batches"
  ON product_import_batches FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE)
  );

-- ============================================================================
-- Canonical seed taxonomy and collections. This is deliberately conservative:
-- it captures the WooCommerce families and known slugs without requiring product
-- migration to happen in the same step.
-- ============================================================================

INSERT INTO product_categories (slug, name, family, legacy_names, canonical_path, sort_order) VALUES
('navaratna', 'Navaratna Gemstones', 'navaratna', ARRAY['NAVRATAN', 'Navratan'], '/shop/navaratna', 10),
('upratna', 'Upratna / Semi-Precious Gemstones', 'upratna', ARRAY['UPRATANAS', 'Semi Precious'], '/shop/upratna', 20),
('rudraksha', 'Rudraksha Beads', 'rudraksha', ARRAY['NAVRATAN > Rudraksha', 'Rudraksha'], '/shop/rudraksha', 30),
('jewelry', 'Vedic Jewellery', 'jewelry', ARRAY['JEWELLERY', 'Jewellery', 'Jewelry'], '/shop/jewelry', 40),
('mala', 'Malas', 'mala', ARRAY['JEWELLERY > Malas', 'Malas'], '/shop/malas', 45),
('idol', 'Spiritual Idols', 'idol', ARRAY['SPIRITUAL IDOLS', 'Idols'], '/shop/idols', 50),
('services', 'Services and Pooja', 'service', ARRAY['Yagya', 'Pooja', 'Services'], '/consultation', 60),
('uncategorized-review', 'Uncategorized Review', 'uncategorized', ARRAY['Uncategorized'], '/shop', 999)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  legacy_names = EXCLUDED.legacy_names,
  canonical_path = EXCLUDED.canonical_path,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO product_categories (slug, name, family, parent_id, legacy_names, canonical_path, sort_order)
SELECT child.slug, child.name, child.family, parent.id, child.legacy_names, child.canonical_path, child.sort_order
FROM (VALUES
  ('ruby', 'Ruby / Manik', 'navaratna', 'navaratna', ARRAY['Ruby', 'NAVRATAN > Ruby'], '/shop/ruby', 101),
  ('pearl', 'Pearl / Moti', 'navaratna', 'navaratna', ARRAY['Pearl', 'NAVRATAN > Pearl'], '/shop/pearl', 102),
  ('red-coral', 'Red Coral / Moonga', 'navaratna', 'navaratna', ARRAY['Red Coral', 'NAVRATAN > Red Coral'], '/shop/red-coral', 103),
  ('emerald', 'Emerald / Panna', 'navaratna', 'navaratna', ARRAY['Emerald', 'NAVRATAN > Emerald'], '/shop/emerald', 104),
  ('yellow-sapphire', 'Yellow Sapphire / Pukhraj', 'navaratna', 'navaratna', ARRAY['Yellow Sapphire', 'NAVRATAN > Yellow Sapphire'], '/shop/yellow-sapphire', 105),
  ('diamond', 'Diamond / Heera', 'navaratna', 'navaratna', ARRAY['Diamond', 'NAVRATAN > Diamond'], '/shop/diamond', 106),
  ('blue-sapphire', 'Blue Sapphire / Neelam', 'navaratna', 'navaratna', ARRAY['Blue Sapphire', 'NAVRATAN > Blue Sapphire'], '/shop/blue-sapphire', 107),
  ('hessonite', 'Hessonite / Gomed', 'navaratna', 'navaratna', ARRAY['Hessonite', 'Gomed'], '/shop/hessonite', 108),
  ('cats-eye', 'Cat''s Eye / Lehsunia', 'navaratna', 'navaratna', ARRAY['Catseye', 'Cat''s Eye'], '/shop/cats-eye', 109),
  ('pitambari', 'Pitambari', 'navaratna', 'navaratna', ARRAY['Pitambari'], '/shop/pitambari', 110),
  ('opal', 'Opal', 'upratna', 'upratna', ARRAY['Opal'], '/shop/opal', 201),
  ('turquoise', 'Turquoise / Firoza', 'upratna', 'upratna', ARRAY['Turquoise', 'Firoza'], '/shop/turquoise', 202),
  ('amethyst', 'Amethyst / Katela', 'upratna', 'upratna', ARRAY['Amethyst', 'Katela'], '/shop/amethyst', 203),
  ('moonstone', 'Moonstone', 'upratna', 'upratna', ARRAY['Moon Stone', 'Moonstone'], '/shop/moonstone', 204),
  ('garnet', 'Garnet', 'upratna', 'upratna', ARRAY['Garnet'], '/shop/garnet', 205),
  ('peridot', 'Peridot', 'upratna', 'upratna', ARRAY['Peridot'], '/shop/peridot', 206),
  ('lapis-lazuli', 'Lapis Lazuli', 'upratna', 'upratna', ARRAY['Lapis Lazuli'], '/shop/lapis-lazuli', 207),
  ('citrine', 'Citrine / Sunela', 'upratna', 'upratna', ARRAY['Citrine', 'Sunela'], '/shop/citrine', 208),
  ('aquamarine', 'Aquamarine', 'upratna', 'upratna', ARRAY['Aquamarine'], '/shop/aquamarine', 209),
  ('hakik', 'Hakik / Agate', 'upratna', 'upratna', ARRAY['Hakik', 'Agate'], '/shop/hakik', 210),
  ('white-topaz', 'White Topaz', 'upratna', 'upratna', ARRAY['White Topaz'], '/shop/white-topaz', 211),
  ('blue-topaz', 'Blue Topaz', 'upratna', 'upratna', ARRAY['Blue Topaz'], '/shop/blue-topaz', 212),
  ('iolite', 'Iolite', 'upratna', 'upratna', ARRAY['Iolite'], '/shop/iolite', 213),
  ('diopside', 'Diopside', 'upratna', 'upratna', ARRAY['Diopside'], '/shop/diopside', 214),
  ('malachite', 'Malachite', 'upratna', 'upratna', ARRAY['Malachite'], '/shop/malachite', 215),
  ('tiger-eye', 'Tiger Eye', 'upratna', 'upratna', ARRAY['Tiger Eye'], '/shop/tiger-eye', 216),
  ('kyanite', 'Kyanite', 'upratna', 'upratna', ARRAY['Kyanite'], '/shop/kyanite', 217),
  ('sunstone', 'Sunstone', 'upratna', 'upratna', ARRAY['Sunstone'], '/shop/sunstone', 218),
  ('bracelets', 'Bracelets', 'jewelry', 'jewelry', ARRAY['Bracelets', 'JEWELLERY > Bracelets'], '/shop/bracelets', 401),
  ('diamond-jewellery', 'Diamond Jewellery', 'jewelry', 'jewelry', ARRAY['Diamond-Jewellery'], '/shop/diamond-jewellery', 402),
  ('rudraksha-jewelry', 'Ready Rudraksha Jewellery', 'jewelry', 'jewelry', ARRAY['Ready (Rudraksha Jewelry) Stock'], '/shop/rudraksha-jewelry', 403),
  ('astro-gems-stock', 'Ready Astro-Gems Stock', 'jewelry', 'jewelry', ARRAY['Ready (Astro-Gems) Stock'], '/shop/astro-gems-stock', 404),
  ('shree-yantra', 'Shree Yantra', 'idol', 'idol', ARRAY['Shree Yantra'], '/shop/shree-yantra', 501),
  ('shivling', 'Shivling', 'idol', 'idol', ARRAY['Shivling'], '/shop/shivling', 502),
  ('ganesha', 'Ganesha', 'idol', 'idol', ARRAY['Ganesha'], '/shop/ganesha', 503),
  ('hanuman', 'Hanuman', 'idol', 'idol', ARRAY['Hanuman'], '/shop/hanuman', 504),
  ('durga-devi', 'Durga Devi', 'idol', 'idol', ARRAY['Durga Devi'], '/shop/durga-devi', 505),
  ('shiv-ji', 'Shiv Ji', 'idol', 'idol', ARRAY['Shiv Ji'], '/shop/shiv-ji', 506)
) AS child(slug, name, family, parent_slug, legacy_names, canonical_path, sort_order)
JOIN product_categories parent ON parent.slug = child.parent_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  parent_id = EXCLUDED.parent_id,
  legacy_names = EXCLUDED.legacy_names,
  canonical_path = EXCLUDED.canonical_path,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO product_collections (slug, name, badge_label, sort_order) VALUES
('exclusive-gems', 'Exclusive Gems', 'Exclusive', 10),
('directors-pick', 'Director''s Pick', 'Director''s Pick', 20),
('ready-stock', 'Ready Stock', 'Ready Stock', 30),
('on-demand', 'On Demand', 'On Demand', 40),
('new-arrivals', 'New Arrivals', 'New', 50)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  badge_label = EXCLUDED.badge_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO currency_rates (currency, rate_to_inr, source, manual_override) VALUES
('INR', 1, 'system', TRUE),
('USD', 83.000000, 'legacy_placeholder', TRUE),
('AUD', 55.000000, 'legacy_placeholder', TRUE)
ON CONFLICT (currency) DO NOTHING;

COMMIT;
