-- Add configurator_enabled column to products table
-- Run this in your Supabase SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS configurator_enabled BOOLEAN DEFAULT FALSE;

-- Optional: Add comment for documentation
COMMENT ON COLUMN products.configurator_enabled IS 'When true, customers can configure this gem into jewelry via the configurator';
