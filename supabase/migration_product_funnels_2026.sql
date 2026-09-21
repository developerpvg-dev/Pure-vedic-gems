-- Product journey funnels: anonymous stage events + abandoned checkout contact drafts.
BEGIN;

CREATE TABLE IF NOT EXISTS product_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event TEXT NOT NULL CHECK (event IN (
    'category_view',
    'product_click',
    'product_view',
    'add_to_cart',
    'begin_checkout',
    'checkout_step',
    'checkout_abandon',
    'purchase',
    'whatsapp_click',
    'call_click'
  )),
  session_id TEXT NOT NULL,
  page_path TEXT,
  category TEXT,
  product_id UUID,
  product_sku TEXT,
  product_name TEXT,
  source TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_product_funnel_events_created
  ON product_funnel_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_funnel_events_event
  ON product_funnel_events (event, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_funnel_events_category
  ON product_funnel_events (category, created_at DESC)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_funnel_events_product
  ON product_funnel_events (product_id, created_at DESC)
  WHERE product_id IS NOT NULL;

-- One noisy action per session (refresh / double-click safe)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_funnel_session_dedupe
  ON product_funnel_events (
    session_id,
    event,
    (COALESCE(category, '')),
    (COALESCE(product_id::text, '')),
    (COALESCE(source, ''))
  )
  WHERE event IN (
    'category_view',
    'product_view',
    'product_click',
    'add_to_cart',
    'begin_checkout',
    'checkout_abandon',
    'whatsapp_click',
    'call_click'
  );

CREATE INDEX IF NOT EXISTS idx_product_funnel_events_created_event
  ON product_funnel_events (created_at DESC, event);

ALTER TABLE product_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS checkout_abandon_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  step TEXT NOT NULL DEFAULT 'contact',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  cart_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping_snapshot JSONB,
  page_path TEXT,
  converted_order_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_abandon_drafts_session
  ON checkout_abandon_drafts (session_id)
  WHERE is_active IS TRUE;

CREATE INDEX IF NOT EXISTS idx_checkout_abandon_drafts_updated
  ON checkout_abandon_drafts (updated_at DESC)
  WHERE is_active IS TRUE;

ALTER TABLE checkout_abandon_drafts ENABLE ROW LEVEL SECURITY;

COMMIT;
