-- Per follow-up attempt: medium + when it actually happened (may differ from created_at).
ALTER TABLE lead_remarks
  ADD COLUMN IF NOT EXISTS channel VARCHAR(20),
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ;

COMMENT ON COLUMN lead_remarks.channel IS 'call | whatsapp | email';
COMMENT ON COLUMN lead_remarks.occurred_at IS 'When the follow-up happened; defaults to created_at when null';

CREATE INDEX IF NOT EXISTS idx_lead_remarks_occurred_at
  ON lead_remarks (enquiry_id, occurred_at);
