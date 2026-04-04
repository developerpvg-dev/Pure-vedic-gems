-- Add hover_image_url to gem_categories
-- Run in Supabase SQL editor

ALTER TABLE gem_categories
  ADD COLUMN IF NOT EXISTS hover_image_url TEXT;
