-- PureVedicGems Week 31 — MMI ERP sync cache + outbound queue
-- Safe to rerun in development/staging.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS erp_sync_state (
  id TEXT PRIMARY KEY DEFAULT 'mmi',
  api_calls_used INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  last_max_tsno INTEGER NOT NULL DEFAULT 0,
  item_master_synced_at TIMESTAMPTZ,
  last_sync_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO erp_sync_state (id) VALUES ('mmi') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS erp_tag_stock (
  tgno TEXT PRIMARY KEY,
  tsno INTEGER NOT NULL,
  ino INTEGER,
  idesc TEXT,
  erp_stock SMALLINT NOT NULL CHECK (erp_stock IN (1, 2)),
  remarks TEXT,
  tpre TEXT,
  cost_damt NUMERIC(14, 2),
  cost_samt NUMERIC(14, 2),
  cost_mamt NUMERIC(14, 2),
  erp_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_tag_stock_tsno ON erp_tag_stock(tsno);
CREATE INDEX IF NOT EXISTS idx_erp_tag_stock_ino ON erp_tag_stock(ino);
CREATE INDEX IF NOT EXISTS idx_erp_tag_stock_erp_stock ON erp_tag_stock(erp_stock);

CREATE TABLE IF NOT EXISTS erp_outbound_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_number TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('mark_sold', 'release_stock')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_erp_outbound_queue_status ON erp_outbound_queue(status, created_at);

COMMIT;
