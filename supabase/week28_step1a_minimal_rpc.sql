-- STEP 1a — MINIMAL stub (run after step 0, or alone if step 0 works)
-- Only 3 lightweight counts. Replaces with full version in step 1b later.

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
  p_today_start timestamptz,
  p_week_start timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '120s'
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
    'pipeline', '{}'::jsonb,
    'payment_status', '{}'::jsonb,
    'consultation_status', '{}'::jsonb,
    'consultation_payments', '{}'::jsonb,
    'enquiry_status', '{}'::jsonb,
    'product_availability', '{}'::jsonb,
    'product_categories', '{}'::jsonb,
    'team_roles', '{}'::jsonb,
    'chart_data', '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(timestamptz, timestamptz) TO service_role;
