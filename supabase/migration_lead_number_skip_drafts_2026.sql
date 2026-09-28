-- SR. No. only for real leads: incomplete-form drafts no longer burn lead numbers.
-- Before: every draft insert took nextval, then was deleted on submit → gaps in the inbox.
BEGIN;

ALTER TABLE enquiries
  ALTER COLUMN lead_number DROP DEFAULT,
  ALTER COLUMN lead_number DROP NOT NULL;

CREATE OR REPLACE FUNCTION enquiries_assign_lead_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT COALESCE(NEW.is_draft, false) AND NEW.lead_number IS NULL THEN
    NEW.lead_number := nextval('enquiries_lead_number_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enquiries_assign_lead_number ON enquiries;
CREATE TRIGGER trg_enquiries_assign_lead_number
  BEFORE INSERT OR UPDATE OF is_draft, lead_number ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION enquiries_assign_lead_number();

COMMIT;
