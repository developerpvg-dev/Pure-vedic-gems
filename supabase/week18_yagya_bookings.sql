-- ============================================================================
-- PureVedicGems Week 18 Yagya Bookings Migration
-- Paid Vedic Yagya / Pooja bookings: Razorpay payment metadata, sankalp
-- (birth) details, service status lifecycle, and admin fulfillment fields.
-- Yagya catalogue itself lives in the products table (product_type='service').
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS yagya_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(40) NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Yagya snapshot (so historical bookings stay correct even if catalogue changes)
  yagya_title_snapshot TEXT NOT NULL,
  yagya_slug_snapshot TEXT,

  -- Contact
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40),

  -- Sankalp / birth details
  sankalp_name VARCHAR(200),
  gotra VARCHAR(120),
  rashi VARCHAR(80),
  nakshatra VARCHAR(80),
  date_of_birth DATE,
  birth_time TIME,
  birth_place VARCHAR(200),
  preferred_date DATE,
  message TEXT,

  -- Amount
  amount_inr DECIMAL(10,2),
  amount_paise INTEGER,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',

  -- Payment
  payment_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(80),
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature TEXT,
  payment_attempts INTEGER NOT NULL DEFAULT 0,
  payment_failure_reason TEXT,
  payment_review_reason TEXT,
  amount_verified_at TIMESTAMPTZ,
  payment_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Service status lifecycle
  status VARCHAR(40) NOT NULL DEFAULT 'pending_payment',

  -- Admin fulfillment
  scheduled_date DATE,
  muhurat_note TEXT,
  recording_link TEXT,
  admin_notes TEXT,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yagya_bookings_payment_status ON yagya_bookings(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_yagya_bookings_status ON yagya_bookings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_yagya_bookings_customer_created ON yagya_bookings(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_yagya_bookings_product ON yagya_bookings(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_yagya_bookings_razorpay_order ON yagya_bookings(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_yagya_bookings_razorpay_payment ON yagya_bookings(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

ALTER TABLE yagya_bookings DROP CONSTRAINT IF EXISTS yagya_bookings_payment_status_check;
ALTER TABLE yagya_bookings
  ADD CONSTRAINT yagya_bookings_payment_status_check
  CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'amount_mismatch', 'cancelled')) NOT VALID;

ALTER TABLE yagya_bookings DROP CONSTRAINT IF EXISTS yagya_bookings_status_check;
ALTER TABLE yagya_bookings
  ADD CONSTRAINT yagya_bookings_status_check
  CHECK (status IN ('pending_payment', 'confirmed', 'scheduled', 'performed', 'completed', 'cancelled', 'payment_review')) NOT VALID;

DROP TRIGGER IF EXISTS yagya_bookings_updated_at ON yagya_bookings;
CREATE TRIGGER yagya_bookings_updated_at
  BEFORE UPDATE ON yagya_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE yagya_bookings ENABLE ROW LEVEL SECURITY;

-- Customers can read their own bookings
DROP POLICY IF EXISTS "Users read own yagya bookings" ON yagya_bookings;
CREATE POLICY "Users read own yagya bookings"
  ON yagya_bookings FOR SELECT
  USING (auth.uid() = customer_id);

-- Authenticated users can insert their own bookings
DROP POLICY IF EXISTS "Users insert own yagya bookings" ON yagya_bookings;
CREATE POLICY "Users insert own yagya bookings"
  ON yagya_bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Admin / team members manage everything
DROP POLICY IF EXISTS "Admin manages yagya bookings" ON yagya_bookings;
CREATE POLICY "Admin manages yagya bookings"
  ON yagya_bookings FOR ALL
  USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE));

-- ----------------------------------------------------------------------------
-- Align yagya catalogue display order with the legacy purevedicgems.com site
-- (planet-wise ordering as shown on the old "Vedic Pooja/Yagya Services" page).
-- ----------------------------------------------------------------------------
WITH legacy_order(slug, ord) AS (
  VALUES
    ('surya-shanti-yagya', 10),
    ('surya-shanti-yagya-by-beej-mantra', 20),
    ('chandra-shanti-yagya', 30),
    ('chandra-shanti-yagya-with-beej-mantra', 40),
    ('mangal-shanti-yagya', 50),
    ('mangal-shanti-yagya-beej-mantra', 60),
    ('budh-shanti-yagya', 70),
    ('budh-shanti-yagya-by-beej-mantra', 80),
    ('vedic-guru-shanti-yagya', 90),
    ('guru-shanti-yagya-by-beej-mantra', 100),
    ('shukra-shanti-yagya-2', 110),
    ('shukra-shanti-yagya-by-beej-mantra', 120),
    ('shani-shanti-yagya', 130),
    ('shani-shanti-yagya-by-beej-mantra', 140),
    ('rahu-shanti-yagya', 150),
    ('rahu-shanti-yagya-beej-mantra', 160),
    ('ketu-shanti-yagya', 170),
    ('ketu-shanti-yagya-beej-mantra', 180),
    ('vedic-rudrabhishek', 190),
    ('durga-saptashati-yagya', 200),
    ('mahamritunjay-yagya-pooja11000-jaap', 210),
    ('mahamritunjay-yagya-pooja-31000-jaap', 220),
    ('mahamritunjay-yagya-pooja-51000-jaap', 230),
    ('mahamritunjay-yagya-pooja', 240)
)
UPDATE products p
SET display_order = lo.ord
FROM legacy_order lo
WHERE p.slug = lo.slug
  AND p.product_type = 'service';

COMMIT;
