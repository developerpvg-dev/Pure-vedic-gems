-- STEP 3 of 4 — run after step 2 succeeds

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

GRANT EXECUTE ON FUNCTION get_customer_analytics_summary(timestamptz) TO service_role;
