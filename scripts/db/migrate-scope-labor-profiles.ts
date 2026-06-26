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
  path.resolve(process.cwd(), 'supabase/migration_scope_labor_profiles_2026.sql'),
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
    const profiles = rows[0]?.settings_values?.jewelry_setting_metal_profiles;
    console.log('Scoped labor profiles:', JSON.stringify(profiles, null, 2));
    await client.query(`NOTIFY pgrst, 'reload schema'`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
