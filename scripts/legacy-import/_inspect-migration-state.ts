import { Client } from 'pg';

async function main() {
  const c = new Client({ connectionString: process.env.LEGACY_IMPORT_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const q = async (label: string, sql: string) => {
    try {
      const r = await c.query(sql);
      console.log(label.padEnd(42), JSON.stringify(r.rows[0]));
    } catch (e) {
      console.log(label.padEnd(42), 'ERR', (e as Error).message);
    }
  };

  await q('auth.users total', 'select count(*)::int n from auth.users');
  await q('auth.users legacy (wp_users)', `select count(*)::int n from auth.users where (raw_user_meta_data->>'legacy_source')='wp_users'`);
  await q('customer_profiles', 'select count(*)::int n from public.customer_profiles');
  await q('newsletter_subscribers', 'select count(*)::int n from newsletter_subscribers');
  await q('newsletter_campaigns', 'select count(*)::int n from newsletter_campaigns');

  // list candidate tables
  const tbls = await c.query(
    `select table_name from information_schema.tables where table_schema='public'
     and (table_name ilike '%newsletter%' or table_name ilike '%campaign%' or table_name ilike '%page%'
          or table_name ilike '%tab%' or table_name ilike '%deposit%' or table_name ilike '%form%') order by 1`,
  );
  console.log('\nrelated public tables:', tbls.rows.map((r) => r.table_name).join(', ') || '(none)');

  await c.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
