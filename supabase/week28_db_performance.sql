-- Week 28: Database performance — full-text search + admin aggregate RPCs
--
-- ⚠️  DO NOT paste the Supabase status-page incident text into SQL Editor.
-- ⚠️  DO NOT run this entire file if Disk IO budget is exhausted — it will timeout.
--
-- Instead run these ONE AT A TIME (wait for "Success" between each):
--   1. week28_step1_dashboard_rpc.sql
--   2. week28_step2_finance_rpc.sql
--   3. week28_step3_customer_rpc.sql
--   4. week28_step4_search_rpc.sql
--   5. week28_step5_search_vector_DEFERRED.sql  (only when IO budget has recovered)
--
-- Run in Supabase SQL Editor on production during low traffic.

-- ── Product full-text search (DEFERRED — see week28_step5_search_vector_DEFERRED.sql) ──
-- ALTER TABLE products ADD COLUMN ...CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
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

-- ── Admin finance revenue aggregates ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_finance_revenue(
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_start_of_today timestamptz DEFAULT NULL,
  p_start_of_week timestamptz DEFAULT NULL,
  p_start_of_month timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'filtered', (
      SELECT coalesce(sum(total), 0)
      FROM orders
      WHERE payment_status = 'captured'
        AND (p_from IS NULL OR created_at >= p_from)
        AND (p_to IS NULL OR created_at <= p_to)
    ),
    'total', (
      SELECT coalesce(sum(total), 0)
      FROM orders
      WHERE payment_status = 'captured'
    ),
    'this_month', (
      SELECT coalesce(sum(total), 0)
      FROM orders
      WHERE payment_status = 'captured'
        AND (p_start_of_month IS NULL OR created_at >= p_start_of_month)
    ),
    'this_week', (
      SELECT coalesce(sum(total), 0)
      FROM orders
      WHERE payment_status = 'captured'
        AND (p_start_of_week IS NULL OR created_at >= p_start_of_week)
    ),
    'today', (
      SELECT coalesce(sum(total), 0)
      FROM orders
      WHERE payment_status = 'captured'
        AND (p_start_of_today IS NULL OR created_at >= p_start_of_today)
    ),
    'consultations', (
      SELECT coalesce(sum(amount_inr), 0)
      FROM consultations
      WHERE payment_status = 'captured'
    ),
    'payment_status_counts', (
      SELECT coalesce(jsonb_object_agg(
        coalesce(payment_status, 'unknown'),
        jsonb_build_object('count', cnt, 'total', rev)
      ), '{}'::jsonb)
      FROM (
        SELECT payment_status, count(*)::int AS cnt, coalesce(sum(total), 0) AS rev
        FROM orders
        WHERE (p_from IS NULL OR created_at >= p_from)
          AND (p_to IS NULL OR created_at <= p_to)
        GROUP BY payment_status
      ) s
    ),
    'payment_method_counts', (
      SELECT coalesce(jsonb_object_agg(coalesce(payment_method, 'unknown'), cnt), '{}'::jsonb)
      FROM (
        SELECT payment_method, count(*)::int AS cnt
        FROM orders
        WHERE (p_from IS NULL OR created_at >= p_from)
          AND (p_to IS NULL OR created_at <= p_to)
        GROUP BY payment_method
      ) s
    ),
    'filtered_order_count', (
      SELECT count(*)::int
      FROM orders
      WHERE (p_from IS NULL OR created_at >= p_from)
        AND (p_to IS NULL OR created_at <= p_to)
    )
  );
$$;

-- ── Customer analytics aggregates ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_customer_analytics_summary(p_since timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH paid_orders AS (
    SELECT customer_id, total
    FROM orders
    WHERE customer_id IS NOT NULL AND payment_status = 'captured'
  ),
  per_customer AS (
    SELECT customer_id, count(*)::int AS order_count, coalesce(sum(total), 0) AS revenue
    FROM paid_orders
    GROUP BY customer_id
  ),
  top_spenders AS (
    SELECT coalesce(jsonb_agg(
      jsonb_build_object('customer_id', customer_id, 'revenue', revenue)
      ORDER BY revenue DESC
    ), '[]'::jsonb) AS data
    FROM (SELECT customer_id, revenue FROM per_customer ORDER BY revenue DESC LIMIT 5) t
  ),
  signup_days AS (
    SELECT created_at::date AS day, count(*)::int AS cnt
    FROM customer_profiles
    WHERE created_at >= p_since
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'total_customers', (SELECT count(*)::int FROM customer_profiles),
    'new_customers', (SELECT count(*)::int FROM customer_profiles WHERE created_at >= p_since),
    'repeat_customers', (SELECT count(*)::int FROM per_customer WHERE order_count > 1),
    'customers_with_orders', (SELECT count(*)::int FROM per_customer),
    'total_customer_revenue', (SELECT coalesce(sum(revenue), 0) FROM per_customer),
    'top_spenders', (SELECT data FROM top_spenders),
    'consultation_customers', (
      SELECT count(DISTINCT customer_id)::int
      FROM consultations
      WHERE customer_id IS NOT NULL
    ),
    'signup_trend', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object('date', day::text, 'orders', cnt, 'revenue', 0)
        ORDER BY day
      ), '[]'::jsonb)
      FROM signup_days
    )
  );
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION get_admin_finance_revenue(timestamptz, timestamptz, timestamptz, timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION get_customer_analytics_summary(timestamptz) TO service_role;
