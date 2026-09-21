-- First-party lead funnels: anonymous stage events + incomplete draft enquiries.
BEGIN;

CREATE TABLE IF NOT EXISTS lead_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  funnel TEXT NOT NULL CHECK (funnel IN ('remedies', 'contact', 'consultation', 'blog')),
  event TEXT NOT NULL CHECK (event IN ('page_view', 'form_start', 'pay_started', 'pay_success', 'pay_abandoned')),
  session_id TEXT NOT NULL,
  page_path TEXT,
  blog_slug TEXT,
  country_hint TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_funnel_events_created
  ON lead_funnel_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_funnel_events_funnel_event
  ON lead_funnel_events (funnel, event, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_funnel_events_blog
  ON lead_funnel_events (blog_slug, created_at DESC)
  WHERE blog_slug IS NOT NULL;

-- One page_view / form_start per browser session per funnel (+ blog slug when set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_funnel_events_session_dedupe
  ON lead_funnel_events (session_id, funnel, event, (COALESCE(blog_slug, '')))
  WHERE event IN ('page_view', 'form_start');

ALTER TABLE lead_funnel_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS blog_slug TEXT,
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS draft_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_enquiries_is_draft_source
  ON enquiries (is_draft, source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enquiries_blog_slug
  ON enquiries (blog_slug, created_at DESC)
  WHERE blog_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_enquiries_draft_session_source
  ON enquiries (draft_session_id, source)
  WHERE is_draft IS TRUE AND draft_session_id IS NOT NULL;

COMMIT;
