-- Personalized gemstone recommendation reports (admin PDF builder).
-- Idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.recommendation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Gemstone Recommendation',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'sent')),
  customer jsonb NOT NULL DEFAULT '{}'::jsonb,
  enquiry_id uuid REFERENCES public.enquiries(id) ON DELETE SET NULL,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  chart_image_url text,
  pdf_path text,
  public_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendation_reports_status_idx
  ON public.recommendation_reports (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS recommendation_reports_enquiry_idx
  ON public.recommendation_reports (enquiry_id)
  WHERE enquiry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS recommendation_reports_token_idx
  ON public.recommendation_reports (public_token);

ALTER TABLE public.recommendation_reports ENABLE ROW LEVEL SECURITY;

-- Admin API uses service role; no public RLS policies for writes.
-- Public read of reports is via Next.js API using service role + token.
