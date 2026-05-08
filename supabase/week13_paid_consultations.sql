-- ============================================================================
-- PureVedicGems Week 13 Paid Consultations Migration
-- Admin-managed consultation plans, Razorpay payment metadata, and booking
-- lifecycle email markers.
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

CREATE TABLE IF NOT EXISTS consultation_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(240) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT,
  amount_inr DECIMAL(10,2) NOT NULL CHECK (amount_inr >= 0),
  amount_usd DECIMAL(10,2) CHECK (amount_usd IS NULL OR amount_usd >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_plans_active_sort
  ON consultation_plans(is_active, sort_order, created_at DESC);

DROP TRIGGER IF EXISTS consultation_plans_updated_at ON consultation_plans;
CREATE TRIGGER consultation_plans_updated_at
  BEFORE UPDATE ON consultation_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO consultation_plans (title, slug, description, amount_inr, amount_usd, duration_minutes, sort_order, is_active)
VALUES
  (
    'For knowing your favorable Vedic Gemstone/Gemstones (With Horoscope Softcopy)',
    'favorable-vedic-gemstone-horoscope-softcopy',
    'Personal gemstone recommendation with horoscope softcopy for choosing suitable Vedic gemstone remedies.',
    1100,
    15,
    30,
    10,
    TRUE
  ),
  (
    'For remedy related to particular problem (Only one question) (Telephonic/Skype chat)',
    'problem-remedy-one-question-telephonic-skype',
    'Focused remedy consultation for one specific question through telephonic or Skype chat.',
    1100,
    15,
    30,
    20,
    TRUE
  ),
  (
    'For Remedy related to particular problem (Only one Question) (Personal/Face to Face)',
    'problem-remedy-one-question-face-to-face',
    'Focused remedy consultation for one specific question through a personal face-to-face session.',
    1500,
    21,
    30,
    30,
    TRUE
  ),
  (
    'For Detail Consultation/Horoscope Study/Remedies (Telephonic/Skype Chat)',
    'detailed-horoscope-remedies-telephonic-skype',
    'Detailed consultation, horoscope study, and remedy guidance through telephonic or Skype chat.',
    3100,
    42,
    60,
    40,
    TRUE
  ),
  (
    'For Detail Consultation/Horoscope Study/Remedies (Personal/Face to Face)',
    'detailed-horoscope-remedies-face-to-face',
    'Detailed consultation, horoscope study, and remedy guidance through a personal face-to-face session.',
    4100,
    55,
    60,
    50,
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  amount_inr = EXCLUDED.amount_inr,
  amount_usd = EXCLUDED.amount_usd,
  duration_minutes = EXCLUDED.duration_minutes,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

ALTER TABLE consultations ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES consultation_plans(id) ON DELETE SET NULL;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS plan_title_snapshot TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS plan_description_snapshot TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS amount_inr DECIMAL(10,2);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS amount_paise INTEGER;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'INR';
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(40) NOT NULL DEFAULT 'not_required';
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(80);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_review_reason TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS amount_verified_at TIMESTAMPTZ;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS admin_notification_sent_at TIMESTAMPTZ;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS completed_email_sent_at TIMESTAMPTZ;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_consultations_plan ON consultations(plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultations_payment_status ON consultations(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_customer_created ON consultations(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultations_razorpay_order ON consultations(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultations_razorpay_payment ON consultations(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_payment_status_check;
ALTER TABLE consultations
  ADD CONSTRAINT consultations_payment_status_check
  CHECK (payment_status IN ('not_required', 'pending', 'authorized', 'captured', 'failed', 'refunded', 'amount_mismatch', 'cancelled')) NOT VALID;

ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_paid_status_check;
ALTER TABLE consultations
  ADD CONSTRAINT consultations_paid_status_check
  CHECK (status IN ('pending_payment', 'pending', 'confirmed', 'completed', 'cancelled', 'payment_review')) NOT VALID;

ALTER TABLE consultation_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active consultation plans are public" ON consultation_plans;
CREATE POLICY "Active consultation plans are public"
  ON consultation_plans FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin manages consultation plans" ON consultation_plans;
CREATE POLICY "Admin manages consultation plans"
  ON consultation_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE));

DROP POLICY IF EXISTS "Anyone can insert consultations" ON consultations;
DROP POLICY IF EXISTS "Authenticated users insert own consultations" ON consultations;
CREATE POLICY "Authenticated users insert own consultations"
  ON consultations FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

COMMIT;