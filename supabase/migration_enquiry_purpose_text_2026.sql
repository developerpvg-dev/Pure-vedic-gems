-- Fix: ₹101 lead insert failed when purpose > 180 chars (varchar limit).
-- Align enquiries fields with consultations.life_situation (up to 5000).
-- Idempotent.

ALTER TABLE public.enquiries
  ALTER COLUMN area_of_concern TYPE TEXT,
  ALTER COLUMN birth_place TYPE TEXT;
