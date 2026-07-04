-- Switch rewards to admin-assignment-only mode (no automatic earn/redeem at checkout).
UPDATE reward_settings
SET
  is_active = FALSE,
  earn_points_per_order = 0,
  updated_at = NOW()
WHERE id = 'default';
