-- Harden funnel tables: write dedupe + SQL aggregates (no 50k-row app scans).
BEGIN;

-- ── Product events: one noisy action per session (refresh / double-click safe) ──
DROP INDEX IF EXISTS idx_product_funnel_session_dedupe;

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

CREATE INDEX IF NOT EXISTS idx_lead_funnel_events_created_funnel
  ON lead_funnel_events (created_at DESC, funnel, event);

-- ── Product journey rollups in Postgres ──
CREATE OR REPLACE FUNCTION product_funnel_metrics(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  WITH bounds AS (
    SELECT
      COALESCE(p_date_from, now() - interval '30 days') AS d_from,
      COALESCE(p_date_to, now()) AS d_to
  ),
  ev AS (
    SELECT e.event, e.category, e.product_id, e.product_sku, e.product_name, e.source
    FROM product_funnel_events e, bounds b
    WHERE e.created_at >= b.d_from AND e.created_at <= b.d_to
  )
  SELECT jsonb_build_object(
    'summary', (
      SELECT jsonb_build_object(
        'category_views', COUNT(*) FILTER (WHERE event = 'category_view'),
        'product_clicks', COUNT(*) FILTER (WHERE event = 'product_click'),
        'product_views', COUNT(*) FILTER (WHERE event = 'product_view'),
        'add_to_cart', COUNT(*) FILTER (WHERE event = 'add_to_cart'),
        'begin_checkout', COUNT(*) FILTER (WHERE event = 'begin_checkout'),
        'checkout_abandon', COUNT(*) FILTER (WHERE event = 'checkout_abandon'),
        'purchase', COUNT(*) FILTER (WHERE event = 'purchase'),
        'whatsapp_clicks', COUNT(*) FILTER (WHERE event = 'whatsapp_click'),
        'call_clicks', COUNT(*) FILTER (WHERE event = 'call_click')
      )
      FROM ev
    ),
    'top_categories', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      FROM (
        SELECT
          category,
          COUNT(*) FILTER (WHERE event = 'category_view')::int AS views,
          COUNT(*) FILTER (WHERE event = 'product_click')::int AS clicks,
          COUNT(*) FILTER (WHERE event = 'add_to_cart')::int AS add_to_cart,
          COUNT(*) FILTER (WHERE event = 'whatsapp_click')::int AS whatsapp,
          COUNT(*) FILTER (WHERE event = 'call_click')::int AS call
        FROM ev
        WHERE category IS NOT NULL AND category <> ''
        GROUP BY category
        ORDER BY
          (COUNT(*) FILTER (WHERE event = 'category_view')
           + COUNT(*) FILTER (WHERE event = 'product_click')) DESC
        LIMIT 30
      ) t
    ),
    'top_products', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      FROM (
        SELECT
          product_id::text AS product_id,
          product_sku AS sku,
          COALESCE(
            MAX(product_name) FILTER (WHERE product_name IS NOT NULL AND product_name <> ''),
            MAX(product_sku),
            product_id::text
          ) AS name,
          COUNT(*) FILTER (WHERE event = 'product_click')::int AS clicks,
          COUNT(*) FILTER (WHERE event = 'product_view')::int AS views,
          COUNT(*) FILTER (WHERE event = 'add_to_cart')::int AS add_to_cart,
          COUNT(*) FILTER (WHERE event = 'whatsapp_click')::int AS whatsapp,
          COUNT(*) FILTER (WHERE event = 'call_click')::int AS call
        FROM ev
        WHERE product_id IS NOT NULL OR (product_sku IS NOT NULL AND product_sku <> '')
        GROUP BY product_id, product_sku
        ORDER BY
          (COUNT(*) FILTER (WHERE event IN ('product_view', 'product_click', 'add_to_cart'))) DESC
        LIMIT 40
      ) t
    ),
    'whatsapp_by_source', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('source', s.source, 'count', s.cnt)), '[]'::jsonb)
      FROM (
        SELECT COALESCE(NULLIF(source, ''), 'unknown') AS source, COUNT(*)::int AS cnt
        FROM ev
        WHERE event = 'whatsapp_click'
        GROUP BY 1
        ORDER BY cnt DESC
        LIMIT 40
      ) s
    ),
    'call_by_source', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('source', s.source, 'count', s.cnt)), '[]'::jsonb)
      FROM (
        SELECT COALESCE(NULLIF(source, ''), 'unknown') AS source, COUNT(*)::int AS cnt
        FROM ev
        WHERE event = 'call_click'
        GROUP BY 1
        ORDER BY cnt DESC
        LIMIT 40
      ) s
    ),
    'abandoned_checkouts', (
      SELECT COALESCE(jsonb_agg(row_to_json(d)::jsonb), '[]'::jsonb)
      FROM (
        SELECT c.id, c.session_id, c.step, c.full_name, c.email, c.phone, c.updated_at
        FROM checkout_abandon_drafts c, bounds b
        WHERE c.is_active IS TRUE
          AND c.updated_at >= b.d_from
          AND c.updated_at <= b.d_to
        ORDER BY c.updated_at DESC
        LIMIT 100
      ) d
    )
  );
$$;

GRANT EXECUTE ON FUNCTION product_funnel_metrics(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- ── Lead funnel rollups in Postgres ──
CREATE OR REPLACE FUNCTION lead_funnel_metrics(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  WITH bounds AS (
    SELECT
      COALESCE(p_date_from, now() - interval '30 days') AS d_from,
      COALESCE(p_date_to, now()) AS d_to
  ),
  ev AS (
    SELECT e.funnel, e.event, e.blog_slug, e.meta
    FROM lead_funnel_events e, bounds b
    WHERE e.created_at >= b.d_from AND e.created_at <= b.d_to
  ),
  funnel_events AS (
    SELECT
      funnel,
      COUNT(*) FILTER (WHERE event = 'page_view')::int AS page_views,
      COUNT(*) FILTER (WHERE event = 'form_start')::int AS form_starts,
      COUNT(*) FILTER (WHERE event = 'pay_started')::int AS pay_started,
      COUNT(*) FILTER (WHERE event = 'pay_abandoned')::int AS pay_abandoned,
      COUNT(*) FILTER (WHERE event = 'pay_success')::int AS pay_success,
      COUNT(*) FILTER (
        WHERE event = 'pay_success'
          AND COALESCE((meta->>'free_international')::boolean, false)
      )::int AS free_international
    FROM ev
    GROUP BY funnel
  ),
  enq_kind AS (
    SELECT
      CASE
        WHEN e.source = 'homepage_recommendation'
          OR e.enquiry_type ILIKE '%Remedies%'
          OR e.enquiry_type ILIKE '%Gemstone%'
          THEN 'remedies'
        WHEN e.source = 'consultation_page' OR e.enquiry_type ILIKE '%Consultation%'
          THEN 'consultation'
        WHEN e.source IN ('blog_popup', 'blog_sidebar') OR e.enquiry_type ILIKE '%Blog%'
          THEN 'blog'
        WHEN e.source = 'contact_form'
          OR e.enquiry_type = 'Enquiry'
          OR e.enquiry_type ILIKE '%Contact enquir%'
          THEN 'contact'
        ELSE NULL
      END AS kind,
      COALESCE(e.is_draft, false) AS is_draft,
      e.blog_slug,
      e.consultation_id,
      COALESCE(e.payment_received, false) AS payment_received
    FROM enquiries e, bounds b
    WHERE e.created_at >= b.d_from AND e.created_at <= b.d_to
  ),
  enq_counts AS (
    SELECT
      kind,
      COUNT(*) FILTER (WHERE is_draft)::int AS drafts,
      COUNT(*) FILTER (WHERE NOT is_draft)::int AS submitted
    FROM enq_kind
    WHERE kind IS NOT NULL
    GROUP BY kind
  ),
  pending AS (
    SELECT k.kind, COUNT(*)::int AS paid_pending
    FROM enq_kind k
    JOIN consultations c ON c.id = k.consultation_id
    WHERE NOT k.is_draft
      AND NOT k.payment_received
      AND c.payment_status IN ('pending', 'authorized')
      AND k.kind IN ('remedies', 'consultation')
    GROUP BY k.kind
  ),
  funnel_keys AS (
    SELECT unnest(ARRAY['remedies', 'contact', 'consultation', 'blog']) AS funnel
  )
  SELECT jsonb_build_object(
    'funnels', (
      SELECT COALESCE(jsonb_object_agg(
        fk.funnel,
        jsonb_build_object(
          'page_views', COALESCE(fe.page_views, 0),
          'form_starts', COALESCE(fe.form_starts, 0),
          'drafts', COALESCE(ec.drafts, 0),
          'submitted', COALESCE(ec.submitted, 0),
          'pay_started', COALESCE(fe.pay_started, 0),
          'pay_abandoned', COALESCE(fe.pay_abandoned, 0),
          'pay_success', COALESCE(fe.pay_success, 0),
          'free_international', COALESCE(fe.free_international, 0),
          'paid_pending', COALESCE(p.paid_pending, 0)
        )
      ), '{}'::jsonb)
      FROM funnel_keys fk
      LEFT JOIN funnel_events fe ON fe.funnel = fk.funnel
      LEFT JOIN enq_counts ec ON ec.kind = fk.funnel
      LEFT JOIN pending p ON p.kind = fk.funnel
    ),
    'by_blog', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      FROM (
        SELECT
          slug,
          SUM(page_views)::int AS page_views,
          SUM(form_starts)::int AS form_starts,
          SUM(drafts)::int AS drafts,
          SUM(submitted)::int AS submitted
        FROM (
          SELECT
            blog_slug AS slug,
            COUNT(*) FILTER (WHERE event = 'page_view')::int AS page_views,
            COUNT(*) FILTER (WHERE event = 'form_start')::int AS form_starts,
            0 AS drafts,
            0 AS submitted
          FROM ev
          WHERE funnel = 'blog' AND blog_slug IS NOT NULL AND blog_slug <> ''
          GROUP BY blog_slug

          UNION ALL

          SELECT
            blog_slug AS slug,
            0, 0,
            COUNT(*) FILTER (WHERE is_draft)::int,
            COUNT(*) FILTER (WHERE NOT is_draft)::int
          FROM enq_kind
          WHERE kind = 'blog' AND blog_slug IS NOT NULL AND blog_slug <> ''
          GROUP BY blog_slug
        ) u
        GROUP BY slug
        ORDER BY (SUM(page_views) + SUM(form_starts) + SUM(drafts) + SUM(submitted)) DESC
        LIMIT 50
      ) t
    )
  );
$$;

GRANT EXECUTE ON FUNCTION lead_funnel_metrics(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

COMMENT ON FUNCTION product_funnel_metrics IS
  'Admin product journey rollups. Defaults to last 30 days. Aggregates in SQL.';
COMMENT ON FUNCTION lead_funnel_metrics IS
  'Admin lead funnel rollups. Defaults to last 30 days. Aggregates in SQL.';

-- Manual retention (optional cron): keep ~180 days of raw events
-- DELETE FROM product_funnel_events WHERE created_at < now() - interval '180 days';
-- DELETE FROM lead_funnel_events WHERE created_at < now() - interval '180 days';

COMMIT;
