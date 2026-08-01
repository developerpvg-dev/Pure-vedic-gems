-- Remove Skype from consultation plan titles/descriptions (telephonic stays).
UPDATE consultation_plans
SET
  title = trim(regexp_replace(regexp_replace(title, '\s*/\s*Skype\b', '', 'gi'), '\bSkype\b', '', 'gi')),
  description = trim(regexp_replace(regexp_replace(description, '\s*/\s*Skype\b', '', 'gi'), '\bSkype\b', '', 'gi')),
  updated_at = NOW()
WHERE title ILIKE '%skype%' OR description ILIKE '%skype%';

-- Clean snapshots already stored on bookings (display only; amount/plan unchanged).
UPDATE consultations
SET
  plan_title_snapshot = trim(regexp_replace(regexp_replace(plan_title_snapshot, '\s*/\s*Skype\b', '', 'gi'), '\bSkype\b', '', 'gi')),
  plan_description_snapshot = CASE
    WHEN plan_description_snapshot IS NULL THEN NULL
    ELSE trim(regexp_replace(regexp_replace(plan_description_snapshot, '\s*/\s*Skype\b', '', 'gi'), '\bSkype\b', '', 'gi'))
  END,
  updated_at = NOW()
WHERE plan_title_snapshot ILIKE '%skype%'
   OR plan_description_snapshot ILIKE '%skype%';
