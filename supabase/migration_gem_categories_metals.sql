-- ═══════════════════════════════════════════════════════════════════════════
-- PureVedicGems — Migration: gem_categories + metals tables
-- Run AFTER the main schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════
-- TABLE: GEM_CATEGORIES
-- Admin-managed Navaratna (9) and Upratna gem categories.
-- gem_categories.slug maps to products.sub_category
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS gem_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('navaratna', 'upratna')),
    sanskrit_name   VARCHAR(100),
    planet          VARCHAR(50),
    emoji           VARCHAR(10),
    color           VARCHAR(20),
    image_url       TEXT,
    description     TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gem_categories_type ON gem_categories(type);
CREATE INDEX idx_gem_categories_slug ON gem_categories(slug);
CREATE INDEX idx_gem_categories_active ON gem_categories(is_active, type, sort_order);

-- ═══════════════════════════════════════════════════
-- TABLE: METALS
-- Admin-managed metals with live prices for the configurator.
-- metals.slug maps to product_configurations.metal
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS metals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    purity          VARCHAR(20),
    price_per_gram  DECIMAL(10,2) NOT NULL DEFAULT 0,
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metals_slug ON metals(slug);
CREATE INDEX idx_metals_active ON metals(is_active, sort_order);

-- ═══════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════

-- gem_categories: publicly readable (active only), admin full CRUD
ALTER TABLE gem_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gem categories publicly viewable"
    ON gem_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access to gem_categories"
    ON gem_categories FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- metals: publicly readable (active only), admin full CRUD
ALTER TABLE metals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Metals publicly viewable"
    ON metals FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access to metals"
    ON metals FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

-- ═══════════════════════════════════════════════════
-- AUTO UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_gem_categories_updated_at
    BEFORE UPDATE ON gem_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_metals_updated_at
    BEFORE UPDATE ON metals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════
-- SEED DATA: NAVARATNA (9 sacred gems)
-- ═══════════════════════════════════════════════════
INSERT INTO gem_categories (name, slug, type, sanskrit_name, planet, emoji, color, description, sort_order) VALUES
('Ruby',            'ruby',            'navaratna', 'Manik',    'Sun',     '🔴', '#DC2626', 'Natural Manikya / Pigeon Blood Rubies. Gem of the Sun — bestows confidence, authority and vitality.', 1),
('Pearl',           'pearl',           'navaratna', 'Moti',     'Moon',    '⚪', '#F5F5F4', 'Natural Moti from South Sea and freshwater origins. Gem of the Moon — calms mind and enhances intuition.', 2),
('Red Coral',       'red-coral',       'navaratna', 'Moonga',   'Mars',    '🟠', '#EA580C', 'Natural Italian Moonga. Gem of Mars — builds courage, energy and removes obstacles.', 3),
('Emerald',         'emerald',         'navaratna', 'Panna',    'Mercury', '🟢', '#16A34A', 'Natural Panna gemstones from Zambia and Colombia. Gem of Mercury — enhances intellect and communication.', 4),
('Yellow Sapphire', 'yellow-sapphire', 'navaratna', 'Pukhraj',  'Jupiter', '🟡', '#CA8A04', 'Natural Pukhraj stones from Ceylon (Sri Lanka). Gem of Jupiter — brings wisdom, prosperity and divine blessings.', 5),
('Diamond',         'diamond',         'navaratna', 'Heera',    'Venus',   '💎', '#A8A29E', 'Natural certified diamonds. Gem of Venus — luxury, love and creative expression.', 6),
('Blue Sapphire',   'blue-sapphire',   'navaratna', 'Neelam',   'Saturn',  '🔵', '#2563EB', 'Natural Neelam stones. Gem of Saturn — one of the most powerful and fast-acting Vedic gemstones.', 7),
('Hessonite',       'hessonite',       'navaratna', 'Gomed',    'Rahu',    '🟤', '#92400E', 'Natural Gomed from Ceylon. Gem of Rahu — removes confusion and fear.', 8),
('Cat''s Eye',      'cats-eye',        'navaratna', 'Lehsunia', 'Ketu',    '🐱', '#65A30D', 'Natural Chrysoberyl with sharp chatoyancy. Gem of Ketu — intuition, liberation and protection.', 9);

-- ═══════════════════════════════════════════════════
-- SEED DATA: UPRATNA (Semi-precious gems)
-- ═══════════════════════════════════════════════════
INSERT INTO gem_categories (name, slug, type, sanskrit_name, planet, emoji, color, description, sort_order) VALUES
('Opal',          'opal',          'upratna', 'Doodhiya Patthar', 'Venus',   '🌈', '#E0E7FF', 'Natural Opal — a semi-precious alternative for Venus. Enhances creativity and emotional balance.', 1),
('Turquoise',     'turquoise',     'upratna', 'Firoza',           'Jupiter', '🩵', '#06B6D4', 'Natural Firoza. Semi-precious stone for Jupiter — brings good fortune and spiritual wisdom.', 2),
('Amethyst',      'amethyst',      'upratna', 'Katela',           'Saturn',  '💜', '#9333EA', 'Natural Katela. Semi-precious stone for Saturn — promotes calm and mental clarity.', 3),
('Moonstone',     'moonstone',     'upratna', 'Chandrakant',      'Moon',    '🌙', '#E0E7FF', 'Natural Chandrakant Mani. Semi-precious stone for Moon — enhances emotional balance.', 4),
('Garnet',        'garnet',        'upratna', 'Tamra',            'Rahu',    '🔴', '#B91C1C', 'Natural Garnet. Semi-precious stone for Rahu — provides stability and grounding.', 5),
('Peridot',       'peridot',       'upratna', 'Zabarjad',         'Mercury', '💚', '#65A30D', 'Natural Peridot. Semi-precious stone for Mercury — aids communication and learning.', 6),
('Tanzanite',     'tanzanite',     'upratna', 'Neeli',            'Saturn',  '🔮', '#6D28D9', 'Natural Tanzanite. Semi-precious alternative for Saturn — spiritual awakening.', 7),
('Lapis Lazuli',  'lapis-lazuli',  'upratna', 'Lajward',          'Saturn',  '🫐', '#1E40AF', 'Natural Lajward. Semi-precious stone for Saturn — wisdom and truth.', 8),
('Citrine',       'citrine',       'upratna', 'Sunela',           'Jupiter', '🌟', '#F59E0B', 'Natural Sunela. Semi-precious stone for Jupiter — prosperity and positivity.', 9),
('Aquamarine',    'aquamarine',    'upratna', 'Beruj',            'Moon',    '🧊', '#67E8F9', 'Natural Beruj. Semi-precious stone for Moon — courage and calming energies.', 10);

-- ═══════════════════════════════════════════════════
-- SEED DATA: METALS (with current default prices)
-- ═══════════════════════════════════════════════════
INSERT INTO metals (name, slug, purity, price_per_gram, description, sort_order) VALUES
('Silver 925',  'silver_925',  '92.5%',   95.00,  'Sterling Silver — 92.5% pure silver, durable and affordable.', 1),
('Panchdhatu',  'panchdhatu',  'Alloy',   350.00, 'Sacred five-metal alloy (Gold, Silver, Copper, Iron, Zinc) — recommended for Vedic jewelry.', 2),
('Gold 18K',    'gold_18k',    '75%',     5900.00, '18 Karat Gold — 75% pure gold, good balance of purity and durability.', 3),
('Gold 22K',    'gold_22k',    '91.6%',   7200.00, '22 Karat Gold — 91.6% pure gold, traditional Indian purity standard.', 4),
('Platinum',    'platinum',    '95%',     3200.00, 'Platinum 950 — rare and lustrous, hypoallergenic.', 5);
