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

const scopeSql = readFileSync(
  path.resolve(process.cwd(), 'supabase/migration_scope_labor_profiles_2026.sql'),
  'utf8'
);
const seedSql = readFileSync(
  path.resolve(process.cwd(), 'supabase/migration_rudraksha_pendant_labor_profiles_2026.sql'),
  'utf8'
);

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(scopeSql);
    await client.query(seedSql);
    const { rows } = await client.query<{ settings_values: Record<string, unknown> }>(
      `SELECT values AS settings_values FROM commerce_settings WHERE id = 'commerce'`
    );
    const rudraksha = (
      rows[0]?.settings_values?.jewelry_setting_metal_profiles as
        | { rudraksha?: { pendant?: { labor_rates?: Record<string, number>; default_gst_percent?: number } } }
        | undefined
    )?.rudraksha?.pendant;
    console.log('Rudraksha pendant labor:', rudraksha?.labor_rates ?? {});
    console.log('Rudraksha pendant GST %:', rudraksha?.default_gst_percent ?? 3);
    const { rows: designRows } = await client.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM jewelry_designs
       WHERE setting_type = 'pendant' AND product_scope = 'rudraksha' AND labor_rates != '{}'::jsonb`
    );
    console.log('Rudraksha pendant designs with labor_rates:', designRows[0]?.n);
    await client.query(`NOTIFY pgrst, 'reload schema'`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
