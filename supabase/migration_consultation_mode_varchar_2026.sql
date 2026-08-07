-- Face-to-face plan mode label is "Personal / Face to Face" (23 chars).
-- consultations.mode was VARCHAR(20), which rejects those bookings.
ALTER TABLE public.consultations
  ALTER COLUMN mode TYPE VARCHAR(80);
