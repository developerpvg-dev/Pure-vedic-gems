-- STEP 0 — run this alone FIRST (sets longer timeouts for the session)
-- If this alone times out, stop and wait 1 hour for Disk IO budget to reset.

SET statement_timeout = '180s';
SET lock_timeout = '60s';
