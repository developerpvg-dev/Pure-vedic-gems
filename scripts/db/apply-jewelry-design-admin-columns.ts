import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const statements = [
  `ALTER TABLE jewelry_designs ADD COLUMN IF NOT EXISTS metal_flags JSONB NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE jewelry_designs ADD COLUMN IF NOT EXISTS product_scope VARCHAR(20) NOT NULL DEFAULT 'gemstone'`,
  `ALTER TABLE jewelry_designs ADD COLUMN IF NOT EXISTS rudraksha_category VARCHAR(50)`,
  `ALTER TABLE jewelry_designs ADD COLUMN IF NOT EXISTS diamond_charges JSONB NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE metals ADD COLUMN IF NOT EXISTS labor_rate_percent DECIMAL(5, 2)`,
  `ALTER TABLE metals ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(20) NOT NULL DEFAULT 'weight'`,
  `UPDATE metals SET pricing_mode = 'weight', labor_rate_percent = 20 WHERE slug IN ('gold_22k', 'platinum')`,
  `UPDATE metals SET pricing_mode = 'weight', labor_rate_percent = 25 WHERE slug IN ('gold_18k', 'gold_14k')`,
  `UPDATE metals SET pricing_mode = 'fixed_sheet', labor_rate_percent = NULL WHERE slug IN ('silver_925', 'panchdhatu', 'panchdhatu_with_gold')`,
  `ALTER TABLE metals ADD COLUMN IF NOT EXISTS gst_rate_percent DECIMAL(5, 2)`,
  `UPDATE metals SET gst_rate_percent = 3 WHERE gst_rate_percent IS NULL AND slug IN ('gold_22k', 'gold_18k', 'gold_14k', 'platinum', 'silver_925', 'panchdhatu', 'panchdhatu_with_gold')`,
  `ALTER TABLE jewelry_designs ADD COLUMN IF NOT EXISTS stone_addon_label TEXT`,
  `UPDATE jewelry_designs SET stone_addon_label = 'Diamond' WHERE stone_addon_label IS NULL AND diamond_charges IS NOT NULL AND diamond_charges::text NOT IN ('{}', 'null')`,
  `ALTER TABLE jewelry_designs ADD COLUMN IF NOT EXISTS labor_rates JSONB NOT NULL DEFAULT '{}'::jsonb`,
  readFileSync(path.resolve(process.cwd(), 'supabase/migration_ring_labor_profiles_2026.sql'), 'utf8'),
  readFileSync(path.resolve(process.cwd(), 'supabase/migration_pendant_bracelet_labor_profiles_2026.sql'), 'utf8'),
  readFileSync(path.resolve(process.cwd(), 'supabase/migration_scope_labor_profiles_2026.sql'), 'utf8'),
  readFileSync(path.resolve(process.cwd(), 'supabase/migration_rudraksha_pendant_labor_profiles_2026.sql'), 'utf8'),
];

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log('OK:', sql.slice(0, 60) + '...');
    }
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('PostgREST schema cache reload notified.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
