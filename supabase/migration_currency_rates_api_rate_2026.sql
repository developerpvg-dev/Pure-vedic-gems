-- Store raw mid-market API rate alongside the loss-adjusted rate used for charging/display.
ALTER TABLE currency_rates ADD COLUMN IF NOT EXISTS api_rate DECIMAL(14,6);
