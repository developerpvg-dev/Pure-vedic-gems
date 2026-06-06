-- ============================================================================
-- Week 18: Newsletter subscribers, recommendation requests, and legacy metadata
-- ============================================================================

BEGIN;

ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS legacy_wp_id BIGINT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS legacy_data JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_legacy_wp_id
  ON testimonials (legacy_wp_id)
  WHERE legacy_wp_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(180),
  status VARCHAR(24) NOT NULL DEFAULT 'subscribed'
    CHECK (status IN ('subscribed', 'pending', 'unsubscribed', 'bounced', 'complained')),
  source VARCHAR(80) NOT NULL DEFAULT 'website',
  consent_source VARCHAR(120),
  consent_text TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  legacy_wp_id BIGINT,
  legacy_list_id BIGINT,
  legacy_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_legacy_wp_id
  ON newsletter_subscribers (legacy_wp_id)
  WHERE legacy_wp_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status
  ON newsletter_subscribers (status, subscribed_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(40),
  birth_date DATE,
  birth_time VARCHAR(40),
  birth_place VARCHAR(180),
  rashi VARCHAR(80),
  purpose VARCHAR(180),
  budget_min NUMERIC(12,2),
  budget_max NUMERIC(12,2),
  recommendation JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(80) NOT NULL DEFAULT 'website',
  status VARCHAR(24) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'contacted', 'converted', 'archived')),
  enquiry_id UUID,
  legacy_wp_id BIGINT,
  legacy_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendation_requests_legacy_wp_id
  ON recommendation_requests (legacy_wp_id)
  WHERE legacy_wp_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recommendation_requests_status
  ON recommendation_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_requests_email
  ON recommendation_requests (lower(email))
  WHERE email IS NOT NULL;

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages newsletter subscribers" ON newsletter_subscribers;
CREATE POLICY "Admin manages newsletter subscribers"
  ON newsletter_subscribers FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Admin manages recommendation requests" ON recommendation_requests;
CREATE POLICY "Admin manages recommendation requests"
  ON recommendation_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
  );

COMMIT;
