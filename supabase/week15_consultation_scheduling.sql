-- Week 15: admin scheduling for paid consultations

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS scheduled_time TIME,
  ADD COLUMN IF NOT EXISTS scheduled_mode VARCHAR(80),
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS admin_schedule_notes TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_notification_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_date
  ON public.consultations(scheduled_date)
  WHERE scheduled_date IS NOT NULL;