-- Lead CRM: pipeline, assignment, remarks, audit — built for 100+/day intake
BEGIN;

-- Sequential display number (SR. No.) — never reuse
CREATE SEQUENCE IF NOT EXISTS enquiries_lead_number_seq;

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS lead_number BIGINT UNIQUE DEFAULT nextval('enquiries_lead_number_seq'),
  ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(40) NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS enquiry_type VARCHAR(120),
  ADD COLUMN IF NOT EXISTS ip_location VARCHAR(160),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS birth_time VARCHAR(40),
  ADD COLUMN IF NOT EXISTS birth_place VARCHAR(180),
  ADD COLUMN IF NOT EXISTS area_of_concern VARCHAR(180),
  ADD COLUMN IF NOT EXISTS details_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_received BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_note TEXT,
  ADD COLUMN IF NOT EXISTS payment_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS astrologer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS astrologer_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS astrologer_forwarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS astrologer_replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS remedies_text TEXT,
  ADD COLUMN IF NOT EXISTS forwarded_to_customer_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS astrologer_help BOOLEAN,
  ADD COLUMN IF NOT EXISTS product_purchase BOOLEAN,
  ADD COLUMN IF NOT EXISTS sale_close BOOLEAN,
  ADD COLUMN IF NOT EXISTS feedback_received BOOLEAN,
  ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_remark_code VARCHAR(40),
  ADD COLUMN IF NOT EXISTS last_remark_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_reason VARCHAR(80);

-- Backfill lead_number for rows that missed the default
UPDATE enquiries
SET lead_number = nextval('enquiries_lead_number_seq')
WHERE lead_number IS NULL;

ALTER TABLE enquiries
  ALTER COLUMN lead_number SET NOT NULL,
  ALTER COLUMN lead_number SET DEFAULT nextval('enquiries_lead_number_seq');

-- Indexes for filter-heavy inbox (100+/day → tens of thousands/year)
CREATE INDEX IF NOT EXISTS idx_enquiries_pipeline_created
  ON enquiries (pipeline_stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_pipeline
  ON enquiries (assigned_to, pipeline_stage, created_at DESC)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_astrologer_pipeline
  ON enquiries (astrologer_id, pipeline_stage, created_at DESC)
  WHERE astrologer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at
  ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_follow_up
  ON enquiries (follow_up_date)
  WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_sale_close
  ON enquiries (sale_close)
  WHERE sale_close IS TRUE;
CREATE INDEX IF NOT EXISTS idx_enquiries_source
  ON enquiries (source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_email_lower
  ON enquiries (lower(email));
CREATE INDEX IF NOT EXISTS idx_enquiries_phone
  ON enquiries (phone)
  WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_last_remark
  ON enquiries (last_remark_code, last_remark_at DESC)
  WHERE last_remark_code IS NOT NULL;

-- Append-only remarks (Remark 1…N timeline)
CREATE TABLE IF NOT EXISTS lead_remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  remark_code VARCHAR(40) NOT NULL,
  remark_label VARCHAR(200) NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_remarks_enquiry
  ON lead_remarks (enquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_code
  ON lead_remarks (remark_code, created_at DESC);

-- Audit trail for every meaningful mutation
CREATE TABLE IF NOT EXISTS lead_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  action VARCHAR(80) NOT NULL,
  from_value TEXT,
  to_value TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES auth.users(id),
  actor_name VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_enquiry
  ON lead_activity (enquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activity_action
  ON lead_activity (action, created_at DESC);

ALTER TABLE lead_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages lead remarks" ON lead_remarks;
CREATE POLICY "Admin manages lead remarks"
  ON lead_remarks FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Admin manages lead activity" ON lead_activity;
CREATE POLICY "Admin manages lead activity"
  ON lead_activity FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
  );

-- Round-robin helper: least-loaded active telecom (or sales as fallback)
CREATE OR REPLACE FUNCTION pick_next_lead_assignee()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT tm.id
  FROM team_members tm
  WHERE tm.is_active = true
    AND lower(tm.role) IN ('telecom', 'sales')
  ORDER BY (
    SELECT count(*)::int
    FROM enquiries e
    WHERE e.assigned_to = tm.id
      AND e.pipeline_stage NOT IN ('closed', 'sent_to_customer')
      AND e.sale_close IS DISTINCT FROM TRUE
  ) ASC,
  tm.created_at ASC
  LIMIT 1;
$$;

COMMIT;
