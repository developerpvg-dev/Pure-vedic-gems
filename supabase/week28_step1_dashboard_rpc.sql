-- STEP 1b — FULL dashboard RPC (run AFTER step 1a succeeds and disk IO has recovered)
-- If step 1a times out, use week28_step1a_minimal_rpc.sql instead.

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
  p_today_start timestamptz,
  p_week_start timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'stats', jsonb_build_object(
      'total_orders', (SELECT count(*)::int FROM orders),
      'today_orders', (SELECT count(*)::int FROM orders WHERE created_at >= p_today_start),
      'total_revenue', (SELECT coalesce(sum(total), 0) FROM orders WHERE payment_status = 'captured'),
      'today_revenue', (
        SELECT coalesce(sum(total), 0)
        FROM orders
        WHERE payment_status = 'captured' AND created_at >= p_today_start
      ),
      'pending_orders', (
        SELECT count(*)::int
        FROM orders
        WHERE status NOT IN ('delivered', 'cancelled', 'refunded')
      ),
      'new_enquiries', (SELECT count(*)::int FROM enquiries WHERE status = 'new'),
      'active_products', (SELECT count(*)::int FROM products WHERE is_active = true),
      'out_of_stock_products', (
        SELECT count(*)::int FROM products WHERE is_active = true AND stock_quantity <= 0
      ),
      'total_consultations', (SELECT count(*)::int FROM consultations),
      'consultation_revenue', (
        SELECT coalesce(sum(amount_inr), 0)
        FROM consultations
        WHERE payment_status = 'captured'
      )
    ),
    'pipeline', (
      SELECT coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
      FROM (SELECT status, count(*)::int AS cnt FROM orders GROUP BY status) s
    ),
    'payment_status', (
      SELECT coalesce(jsonb_object_agg(
        coalesce(payment_status, 'unknown'),
        jsonb_build_object('count', cnt, 'total', rev)
      ), '{}'::jsonb)
      FROM (
        SELECT payment_status, count(*)::int AS cnt, coalesce(sum(total), 0) AS rev
        FROM orders
        GROUP BY payment_status
      ) s
    ),
    'consultation_status', (
      SELECT coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
      FROM (SELECT status, count(*)::int AS cnt FROM consultations GROUP BY status) s
    ),
    'consultation_payments', (
      SELECT coalesce(jsonb_object_agg(
        coalesce(payment_status, 'unknown'),
        jsonb_build_object('count', cnt, 'total', rev)
      ), '{}'::jsonb)
      FROM (
        SELECT payment_status, count(*)::int AS cnt, coalesce(sum(amount_inr), 0) AS rev
        FROM consultations
        GROUP BY payment_status
      ) s
    ),
    'enquiry_status', (
      SELECT coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
      FROM (SELECT status, count(*)::int AS cnt FROM enquiries GROUP BY status) s
    ),
    'product_availability', (
      SELECT coalesce(jsonb_object_agg(coalesce(availability_status, 'unknown'), cnt), '{}'::jsonb)
      FROM (
        SELECT availability_status, count(*)::int AS cnt
        FROM products
        WHERE is_active = true
        GROUP BY availability_status
      ) s
    ),
    'product_categories', (
      SELECT coalesce(jsonb_object_agg(cat, cnt), '{}'::jsonb)
      FROM (
        SELECT coalesce(category, product_type, 'uncategorized') AS cat, count(*)::int AS cnt
        FROM products
        WHERE is_active = true
        GROUP BY 1
      ) s
    ),
    'team_roles', (
      SELECT coalesce(jsonb_object_agg(role, cnt), '{}'::jsonb)
      FROM (
        SELECT role, count(*)::int AS cnt
        FROM team_members
        WHERE is_active = true
        GROUP BY role
      ) s
    ),
    'chart_data', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'date', d::text,
          'revenue', coalesce(day_rev, 0),
          'orders', coalesce(day_cnt, 0)
        )
        ORDER BY d
      ), '[]'::jsonb)
      FROM generate_series(p_week_start::date, current_date, '1 day') d
      LEFT JOIN LATERAL (
        SELECT
          count(*)::int AS day_cnt,
          coalesce(sum(total) FILTER (WHERE payment_status = 'captured'), 0) AS day_rev
        FROM orders
        WHERE created_at >= d::timestamptz
          AND created_at < (d + 1)::timestamptz
      ) day_stats ON true
    )
  );
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(timestamptz, timestamptz) TO service_role;
