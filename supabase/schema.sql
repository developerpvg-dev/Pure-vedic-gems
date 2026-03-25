-- ═══════════════════════════════════════════════════════════════════════════
-- PureVedicGems — Complete Database Schema
-- Execute this in Supabase SQL Editor (Settings → SQL Editor)
-- Run in one go — tables, indexes, RLS, triggers, functions
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════
-- TABLE 1: PRODUCTS
-- ═══════════════════════════════════════════════════
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku             VARCHAR(30) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) UNIQUE NOT NULL,
    category        VARCHAR(50) NOT NULL,
    sub_category    VARCHAR(100),

    -- Pricing
    price           DECIMAL(12,2) NOT NULL,
    price_per_carat DECIMAL(10,2),
    compare_price   DECIMAL(12,2),
    currency        VARCHAR(3) DEFAULT 'INR',

    -- Gemstone-specific fields
    carat_weight    DECIMAL(6,2),
    ratti_weight    DECIMAL(6,2),
    origin          VARCHAR(100),
    shape           VARCHAR(50),
    treatment       VARCHAR(50) DEFAULT 'Natural',
    color_grade     VARCHAR(20),
    clarity         VARCHAR(20),
    certification   VARCHAR(50),

    -- Vedic properties
    planet          VARCHAR(50),
    vedic_name      VARCHAR(100),
    hindi_name      VARCHAR(100),
    chakra          VARCHAR(50),
    rashi           VARCHAR(100),
    finger          VARCHAR(50),
    wearing_day     VARCHAR(20),
    wearing_metal   VARCHAR(50),

    -- Rudraksha-specific fields
    mukhi_count     INTEGER,
    xray_certified  BOOLEAN DEFAULT FALSE,
    ruling_deity    VARCHAR(100),

    -- Content
    short_desc      TEXT,
    description     TEXT,
    vedic_significance TEXT,
    benefits        JSONB DEFAULT '[]',
    wearing_guide   TEXT,
    expert_note     TEXT,
    expert_id       UUID,

    -- Media
    images          JSONB DEFAULT '[]',
    certificate_url TEXT,
    video_url       TEXT,
    thumbnail_url   TEXT,

    -- Status & Inventory
    in_stock        BOOLEAN DEFAULT TRUE,
    stock_quantity  INTEGER DEFAULT 1,
    low_stock_threshold INTEGER DEFAULT 1,
    featured        BOOLEAN DEFAULT FALSE,
    is_directors_pick BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    display_order   INTEGER DEFAULT 0,

    -- SEO
    meta_title      VARCHAR(70),
    meta_description VARCHAR(160),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category, sub_category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_planet ON products(planet);
CREATE INDEX idx_products_active ON products(is_active, in_stock);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX idx_products_directors ON products(is_directors_pick) WHERE is_directors_pick = true;
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_carat ON products(carat_weight);
CREATE INDEX idx_products_search ON products
    USING GIN (to_tsvector('english',
        coalesce(name,'') || ' ' ||
        coalesce(vedic_name,'') || ' ' ||
        coalesce(origin,'') || ' ' ||
        coalesce(planet,'') || ' ' ||
        coalesce(short_desc,'')
    ));

-- ═══════════════════════════════════════════════════
-- TABLE 2: EXPERTS
-- ═══════════════════════════════════════════════════
CREATE TABLE experts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    title           VARCHAR(200),
    photo_url       TEXT,
    tier            VARCHAR(20) NOT NULL,
    specialty       VARCHAR(200),
    years_experience INTEGER,
    bio             TEXT,
    personal_quote  TEXT,
    credentials     TEXT[],
    languages       TEXT[],
    rating          DECIMAL(2,1) DEFAULT 5.0,
    consultation_count INTEGER DEFAULT 0,
    is_available    BOOLEAN DEFAULT TRUE,
    availability_schedule JSONB,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK on products.expert_id now that experts table exists
ALTER TABLE products ADD CONSTRAINT fk_products_expert FOREIGN KEY (expert_id) REFERENCES experts(id);

-- ═══════════════════════════════════════════════════
-- TABLE 3: CUSTOMER_PROFILES
-- ═══════════════════════════════════════════════════
CREATE TABLE customer_profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       VARCHAR(200),
    phone           VARCHAR(20),
    whatsapp        VARCHAR(20),
    email           VARCHAR(255),
    date_of_birth   DATE,
    birth_time      TIME,
    birth_place     VARCHAR(200),
    gotra           VARCHAR(100),
    rashi           VARCHAR(50),
    addresses       JSONB DEFAULT '[]',
    default_address_index INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- TABLE 4: ORDERS
-- ═══════════════════════════════════════════════════
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(20) UNIQUE NOT NULL,
    customer_id     UUID REFERENCES auth.users(id),

    guest_email     VARCHAR(255),
    guest_phone     VARCHAR(20),
    guest_name      VARCHAR(200),

    items           JSONB NOT NULL,

    -- Pricing (all server-calculated)
    subtotal        DECIMAL(12,2) NOT NULL,
    jewelry_charges DECIMAL(10,2) DEFAULT 0,
    metal_charges   DECIMAL(10,2) DEFAULT 0,
    certification_charges DECIMAL(10,2) DEFAULT 0,
    energization_charges DECIMAL(10,2) DEFAULT 0,
    shipping_cost   DECIMAL(10,2) DEFAULT 0,
    discount        DECIMAL(10,2) DEFAULT 0,
    coupon_code     VARCHAR(50),
    gst_amount      DECIMAL(10,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,

    -- Shipping
    shipping_address JSONB NOT NULL,
    shipping_method  VARCHAR(50),
    special_instructions TEXT,

    -- Energization/Puja details
    include_energization BOOLEAN DEFAULT FALSE,
    energization_type VARCHAR(50),
    ceremony_gotra  VARCHAR(100),
    ceremony_dob    DATE,
    ceremony_rashi  VARCHAR(50),
    record_ceremony BOOLEAN DEFAULT FALSE,

    -- Payment
    payment_method  VARCHAR(50),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(200),
    payment_status  VARCHAR(20) DEFAULT 'pending',

    -- Order Pipeline Status
    status          VARCHAR(30) DEFAULT 'placed',

    -- Tracking
    tracking_number VARCHAR(100),
    tracking_url    TEXT,
    estimated_delivery DATE,

    -- Internal
    assigned_to     UUID REFERENCES auth.users(id),
    internal_notes  TEXT,

    -- GST Invoice
    invoice_number  VARCHAR(30),
    invoice_url     TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_date ON orders(created_at DESC);

-- ═══════════════════════════════════════════════════
-- TABLE 5: JEWELRY DESIGNS
-- ═══════════════════════════════════════════════════
CREATE TABLE jewelry_designs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    setting_type    VARCHAR(50) NOT NULL,
    image_url       TEXT,
    description     TEXT,
    making_charges  JSONB NOT NULL,
    estimated_metal_weight JSONB,
    is_custom       BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- TABLE 6: ENERGIZATION OPTIONS
-- ═══════════════════════════════════════════════════
CREATE TABLE energization_options (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    duration        VARCHAR(50),
    includes        JSONB DEFAULT '[]',
    includes_video  BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- TABLE 7: CERTIFICATION LABS
-- ═══════════════════════════════════════════════════
CREATE TABLE certification_labs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(20) NOT NULL,
    full_name       VARCHAR(200),
    extra_charge    DECIMAL(10,2) DEFAULT 0,
    turnaround_days INTEGER DEFAULT 3,
    sample_cert_url TEXT,
    description     TEXT,
    is_default      BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- TABLE 8: PRODUCT CONFIGURATIONS
-- ═══════════════════════════════════════════════════
CREATE TABLE product_configurations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      VARCHAR(100),
    customer_id     UUID REFERENCES auth.users(id),
    product_id      UUID REFERENCES products(id) NOT NULL,

    setting_type    VARCHAR(50),
    design_id       UUID REFERENCES jewelry_designs(id),
    metal           VARCHAR(50),
    ring_size       VARCHAR(10),
    chain_length    VARCHAR(10),
    certification_id UUID REFERENCES certification_labs(id),
    energization_id UUID REFERENCES energization_options(id),

    -- Itemized pricing
    gem_price       DECIMAL(12,2),
    making_charge   DECIMAL(10,2),
    metal_price     DECIMAL(10,2),
    metal_weight_grams DECIMAL(6,2),
    gold_rate_per_gram DECIMAL(10,2),
    certification_fee DECIMAL(10,2),
    energization_fee DECIMAL(10,2),
    total_price     DECIMAL(12,2),

    status          VARCHAR(20) DEFAULT 'draft',
    order_id        UUID REFERENCES orders(id),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_configs_session ON product_configurations(session_id);
CREATE INDEX idx_configs_customer ON product_configurations(customer_id);

-- ═══════════════════════════════════════════════════
-- TABLE 9: CONSULTATIONS
-- ═══════════════════════════════════════════════════
CREATE TABLE consultations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES auth.users(id),
    expert_id       UUID REFERENCES experts(id),
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    date_of_birth   DATE,
    birth_time      TIME,
    birth_place     VARCHAR(200),
    life_situation  TEXT,
    consultation_type VARCHAR(50),
    mode            VARCHAR(20),
    preferred_date  DATE,
    preferred_time  TIME,
    message         TEXT,
    status          VARCHAR(20) DEFAULT 'pending',
    assigned_expert UUID REFERENCES experts(id),
    internal_notes  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_expert ON consultations(assigned_expert);

-- ═══════════════════════════════════════════════════
-- TABLE 10: ENQUIRIES
-- ═══════════════════════════════════════════════════
CREATE TABLE enquiries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    subject         VARCHAR(200),
    message         TEXT NOT NULL,
    product_id      UUID REFERENCES products(id),
    source          VARCHAR(50) DEFAULT 'contact_form',
    status          VARCHAR(20) DEFAULT 'new',
    assigned_to     UUID REFERENCES auth.users(id),
    follow_up_date  DATE,
    internal_notes  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enquiries_status ON enquiries(status);

-- ═══════════════════════════════════════════════════
-- TABLE 11: REVIEWS
-- ═══════════════════════════════════════════════════
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID REFERENCES products(id) NOT NULL,
    order_id        UUID REFERENCES orders(id),
    customer_id     UUID REFERENCES auth.users(id),
    customer_name   VARCHAR(200) NOT NULL,
    customer_location VARCHAR(100),
    rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
    title           VARCHAR(200),
    review_text     TEXT,
    images          JSONB DEFAULT '[]',
    is_verified     BOOLEAN DEFAULT FALSE,
    is_approved     BOOLEAN DEFAULT FALSE,
    is_featured     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON reviews(product_id, is_approved);
CREATE INDEX idx_reviews_featured ON reviews(is_featured) WHERE is_featured = true;

-- ═══════════════════════════════════════════════════
-- TABLE 12: COUPONS
-- ═══════════════════════════════════════════════════
CREATE TABLE coupons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) UNIQUE NOT NULL,
    discount_type   VARCHAR(20) NOT NULL,
    discount_value  DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(12,2) DEFAULT 0,
    max_discount    DECIMAL(10,2),
    usage_limit     INTEGER,
    used_count      INTEGER DEFAULT 0,
    valid_from      TIMESTAMPTZ DEFAULT NOW(),
    valid_until     TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- TABLE 13: SAVED ITEMS (Wishlist)
-- ═══════════════════════════════════════════════════
CREATE TABLE saved_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES auth.users(id) NOT NULL,
    product_id      UUID REFERENCES products(id) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- ═══════════════════════════════════════════════════
-- TABLE 14: ADMIN ACTIVITY LOG
-- ═══════════════════════════════════════════════════
CREATE TABLE admin_activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users(id) NOT NULL,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     UUID,
    details         JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON admin_activity_log(user_id);
CREATE INDEX idx_activity_date ON admin_activity_log(created_at DESC);

-- ═══════════════════════════════════════════════════
-- TABLE 15: TEAM MEMBERS (RBAC)
-- ═══════════════════════════════════════════════════
CREATE TABLE team_members (
    id              UUID PRIMARY KEY REFERENCES auth.users(id),
    role            VARCHAR(30) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    permissions     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- TABLE 16: GOLD RATE CACHE
-- ═══════════════════════════════════════════════════
CREATE TABLE gold_rate_cache (
    id              SERIAL PRIMARY KEY,
    gold_22k_per_gram DECIMAL(10,2) NOT NULL,
    gold_18k_per_gram DECIMAL(10,2),
    silver_per_gram DECIMAL(10,2),
    source          VARCHAR(100),
    fetched_at      TIMESTAMPTZ DEFAULT NOW(),
    manual_override BOOLEAN DEFAULT FALSE
);

-- ═══════════════════════════════════════════════════
-- TABLE 17: NOTIFICATION LOG
-- ═══════════════════════════════════════════════════
CREATE TABLE notification_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(50) NOT NULL,
    recipient       VARCHAR(255) NOT NULL,
    template        VARCHAR(100),
    context         JSONB,
    status          VARCHAR(20) DEFAULT 'sent',
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════

-- Products: publicly readable (only active)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products publicly viewable"
    ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to products"
    ON products FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Experts: publicly readable
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experts publicly viewable"
    ON experts FOR SELECT USING (true);
CREATE POLICY "Admin full access to experts"
    ON experts FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Customer profiles: users see own data only
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile"
    ON customer_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
    ON customer_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"
    ON customer_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Orders: users see own, admins see all
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders"
    ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Admin full access to orders"
    ON orders FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );
CREATE POLICY "Guest can insert orders"
    ON orders FOR INSERT WITH CHECK (true);

-- Jewelry designs: publicly readable
ALTER TABLE jewelry_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Designs publicly viewable"
    ON jewelry_designs FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to designs"
    ON jewelry_designs FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Energization options: publicly readable
ALTER TABLE energization_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Energization publicly viewable"
    ON energization_options FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to energization"
    ON energization_options FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Certification labs: publicly readable
ALTER TABLE certification_labs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Labs publicly viewable"
    ON certification_labs FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to labs"
    ON certification_labs FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Product configurations: user sees own, admins see all
ALTER TABLE product_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own configs"
    ON product_configurations FOR SELECT USING (
        auth.uid() = customer_id OR session_id IS NOT NULL
    );
CREATE POLICY "Users insert configs"
    ON product_configurations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own configs"
    ON product_configurations FOR UPDATE USING (
        auth.uid() = customer_id OR session_id IS NOT NULL
    );
CREATE POLICY "Admin full access to configs"
    ON product_configurations FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Consultations: users see own, admins see all
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own consultations"
    ON consultations FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Anyone can insert consultations"
    ON consultations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manages consultations"
    ON consultations FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Enquiries: anyone can insert, admins manage
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert enquiries"
    ON enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manages enquiries"
    ON enquiries FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Reviews: publicly readable (approved), users insert own
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads approved reviews"
    ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users insert own reviews"
    ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admin manages reviews"
    ON reviews FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Saved items: users see own
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved items"
    ON saved_items FOR ALL USING (auth.uid() = customer_id);

-- Coupons: publicly readable (active)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active coupons"
    ON coupons FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));
CREATE POLICY "Admin manages coupons"
    ON coupons FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Admin activity log: admins only
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads activity log"
    ON admin_activity_log FOR SELECT USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );
CREATE POLICY "Admin inserts activity log"
    ON admin_activity_log FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Team members: admins only
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads team members"
    ON team_members FOR SELECT USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );
CREATE POLICY "Director manages team"
    ON team_members FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role = 'director' AND is_active = true)
    );

-- Gold rate cache: publicly readable
ALTER TABLE gold_rate_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads gold rate"
    ON gold_rate_cache FOR SELECT USING (true);
CREATE POLICY "Admin manages gold rate"
    ON gold_rate_cache FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Notification log: admins only
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads notifications"
    ON notification_log FOR SELECT USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );
CREATE POLICY "Service inserts notifications"
    ON notification_log FOR INSERT WITH CHECK (true);


-- ═══════════════════════════════════════════════════
-- DATABASE FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER configs_updated_at BEFORE UPDATE ON product_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER enquiries_updated_at BEFORE UPDATE ON enquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate order number: PVG-2026-00001
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)), 0) + 1
    INTO next_num FROM orders
    WHERE order_number LIKE 'PVG-' || TO_CHAR(NOW(), 'YYYY') || '-%';

    NEW.order_number = 'PVG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_auto_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Auto-calculate ratti weight from carat
CREATE OR REPLACE FUNCTION auto_ratti_weight()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.carat_weight IS NOT NULL THEN
        NEW.ratti_weight = ROUND(NEW.carat_weight * 1.1, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_auto_ratti BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION auto_ratti_weight();


-- ═══════════════════════════════════════════════════
-- STORAGE BUCKET POLICIES
-- ═══════════════════════════════════════════════════

-- Products: public read, admin write
CREATE POLICY "Public read products" ON storage.objects
    FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admin write products" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'products' AND
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );
CREATE POLICY "Admin update products" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'products' AND
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );
CREATE POLICY "Admin delete products" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'products' AND
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Certificates: public read, admin write
CREATE POLICY "Public read certificates" ON storage.objects
    FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Admin write certificates" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'certificates' AND
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Experts: public read, admin write
CREATE POLICY "Public read experts" ON storage.objects
    FOR SELECT USING (bucket_id = 'experts');
CREATE POLICY "Admin write experts" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'experts' AND
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Heritage: public read, admin write
CREATE POLICY "Public read heritage" ON storage.objects
    FOR SELECT USING (bucket_id = 'heritage');
CREATE POLICY "Admin write heritage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'heritage' AND
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Designs: public read, admin write
CREATE POLICY "Public read designs" ON storage.objects
    FOR SELECT USING (bucket_id = 'designs');
CREATE POLICY "Admin write designs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'designs' AND
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- Reviews: public read approved, authenticated write own
CREATE POLICY "Public read reviews" ON storage.objects
    FOR SELECT USING (bucket_id = 'reviews');
CREATE POLICY "Authenticated write reviews" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'reviews' AND auth.uid() IS NOT NULL
    );

-- Invoices: authenticated read own, service write
CREATE POLICY "Auth read own invoices" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'invoices' AND auth.uid() IS NOT NULL
    );

-- Custom uploads: authenticated write
CREATE POLICY "Auth write custom uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'custom-uploads' AND auth.uid() IS NOT NULL
    );
CREATE POLICY "Auth read own custom uploads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'custom-uploads' AND auth.uid() IS NOT NULL
    );
