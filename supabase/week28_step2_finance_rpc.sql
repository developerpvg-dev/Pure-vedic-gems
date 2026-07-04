-- STEP 2 of 4 — run after step 1 succeeds

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

GRANT EXECUTE ON FUNCTION get_admin_finance_revenue(timestamptz, timestamptz, timestamptz, timestamptz, timestamptz) TO service_role;
