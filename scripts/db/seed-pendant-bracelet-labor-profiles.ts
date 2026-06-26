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

const sql = readFileSync(
  path.resolve(process.cwd(), 'supabase/migration_pendant_bracelet_labor_profiles_2026.sql'),
  'utf8'
);

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);
    const { rows } = await client.query<{ settings_values: Record<string, unknown> }>(
      `SELECT values AS settings_values FROM commerce_settings WHERE id = 'commerce'`
    );
    const profiles = rows[0]?.settings_values?.jewelry_setting_metal_profiles as
      | {
          pendant?: { labor_rates?: Record<string, number> };
          bracelet?: { labor_rates?: Record<string, number> };
        }
      | undefined;
    console.log('Pendant labor profile seeded:', profiles?.pendant?.labor_rates ?? {});
    console.log('Bracelet labor profile seeded:', profiles?.bracelet?.labor_rates ?? {});
    const { rows: designRows } = await client.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM jewelry_designs
       WHERE setting_type IN ('pendant', 'bracelet')
         AND product_scope = 'gemstone'
         AND labor_rates != '{}'::jsonb`
    );
    console.log('Gemstone pendant/bracelet designs with labor_rates:', designRows[0]?.n);
    await client.query(`NOTIFY pgrst, 'reload schema'`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
