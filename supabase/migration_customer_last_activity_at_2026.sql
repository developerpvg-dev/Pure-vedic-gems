-- Cheap "Recent activity" sort for admin CRM:
-- store last_activity_at on the profile, bump it from real events via triggers,
-- then ORDER BY last_activity_at (no fan-out scans on every list request).

BEGIN;

ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

UPDATE customer_profiles
SET last_activity_at = COALESCE(created_at, NOW())
WHERE last_activity_at IS NULL;

-- Backfill from known customer-linked events (covers history before triggers exist).
WITH activity AS (
  SELECT customer_id, MAX(created_at) AS max_at
  FROM (
    SELECT customer_id, created_at FROM orders WHERE customer_id IS NOT NULL
    UNION ALL
    SELECT customer_id, created_at FROM cart_events WHERE customer_id IS NOT NULL
    UNION ALL
    SELECT customer_id, created_at FROM consultations WHERE customer_id IS NOT NULL
    UNION ALL
    SELECT customer_id, created_at FROM yagya_bookings WHERE customer_id IS NOT NULL
    UNION ALL
    SELECT customer_id, created_at FROM reviews WHERE customer_id IS NOT NULL
    UNION ALL
    SELECT customer_id, created_at FROM saved_items WHERE customer_id IS NOT NULL
    UNION ALL
    SELECT customer_id, created_at FROM reward_point_transactions WHERE customer_id IS NOT NULL
    UNION ALL
    SELECT customer_id, created_at FROM customer_activity_log WHERE customer_id IS NOT NULL
  ) events
  GROUP BY customer_id
)
UPDATE customer_profiles cp
SET last_activity_at = GREATEST(COALESCE(cp.last_activity_at, cp.created_at), activity.max_at)
FROM activity
WHERE cp.id = activity.customer_id;

ALTER TABLE customer_profiles
  ALTER COLUMN last_activity_at SET DEFAULT NOW();

ALTER TABLE customer_profiles
  ALTER COLUMN last_activity_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_activity
  ON customer_profiles (last_activity_at DESC);

CREATE OR REPLACE FUNCTION bump_customer_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  event_at TIMESTAMPTZ;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  event_at := COALESCE(NEW.created_at, NOW());

  UPDATE customer_profiles
  SET last_activity_at = event_at
  WHERE id = NEW.customer_id
    AND (last_activity_at IS NULL OR last_activity_at < event_at);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_bump_last_activity ON orders;
CREATE TRIGGER trg_orders_bump_last_activity
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION bump_customer_last_activity();

DROP TRIGGER IF EXISTS trg_cart_events_bump_last_activity ON cart_events;
CREATE TRIGGER trg_cart_events_bump_last_activity
  AFTER INSERT ON cart_events
  FOR EACH ROW EXECUTE FUNCTION bump_customer_last_activity();

DROP TRIGGER IF EXISTS trg_consultations_bump_last_activity ON consultations;
CREATE TRIGGER trg_consultations_bump_last_activity
  AFTER INSERT ON consultations
  FOR EACH ROW EXECUTE FUNCTION bump_customer_last_activity();

DROP TRIGGER IF EXISTS trg_yagya_bookings_bump_last_activity ON yagya_bookings;
CREATE TRIGGER trg_yagya_bookings_bump_last_activity
  AFTER INSERT ON yagya_bookings
  FOR EACH ROW EXECUTE FUNCTION bump_customer_last_activity();

DROP TRIGGER IF EXISTS trg_reviews_bump_last_activity ON reviews;
CREATE TRIGGER trg_reviews_bump_last_activity
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION bump_customer_last_activity();

DROP TRIGGER IF EXISTS trg_saved_items_bump_last_activity ON saved_items;
CREATE TRIGGER trg_saved_items_bump_last_activity
  AFTER INSERT ON saved_items
  FOR EACH ROW EXECUTE FUNCTION bump_customer_last_activity();

DROP TRIGGER IF EXISTS trg_rewards_bump_last_activity ON reward_point_transactions;
CREATE TRIGGER trg_rewards_bump_last_activity
  AFTER INSERT ON reward_point_transactions
  FOR EACH ROW EXECUTE FUNCTION bump_customer_last_activity();

DROP TRIGGER IF EXISTS trg_customer_activity_log_bump_last_activity ON customer_activity_log;
CREATE TRIGGER trg_customer_activity_log_bump_last_activity
  AFTER INSERT ON customer_activity_log
  FOR EACH ROW EXECUTE FUNCTION bump_customer_last_activity();

COMMIT;
