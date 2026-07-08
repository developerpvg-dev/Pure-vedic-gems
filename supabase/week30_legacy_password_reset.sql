-- ════════════════════════════════════════════════════════════════════════════
-- Week 30: Legacy WordPress → Supabase user password-reset gate
-- ════════════════════════════════════════════════════════════════════════════
-- The old site ran on WordPress/WooCommerce. Customer accounts were migrated
-- into Supabase Auth, but the original WordPress password hashes could not be
-- reused (different hashing scheme). Each migrated customer was given a
-- temporary password and flagged here so the new site forces them to set their
-- own password on first login before they can reach the dashboard.
--
-- Flow:
--   1. User logs in with the temporary password (or clicks "Forgot password").
--   2. proxy.ts / account layout sees requires_password_reset = true and
--      redirects to /account/set-password.
--   3. User sets a new password; this flag is cleared and the full dashboard
--      (orders, rewards, consultations, ...) becomes available.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS requires_password_reset BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ;

-- Backfill any rows that pre-date the column. Defaults to FALSE so new
-- registrations and existing active customers are unaffected; the legacy
-- migration / seed scripts set this to TRUE explicitly for migrated users.
UPDATE customer_profiles
   SET requires_password_reset = FALSE
 WHERE requires_password_reset IS NULL;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_requires_password_reset
  ON customer_profiles(requires_password_reset)
  WHERE requires_password_reset = TRUE;

COMMIT;
