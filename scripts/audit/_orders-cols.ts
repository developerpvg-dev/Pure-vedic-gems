import { Client } from 'pg';

async function main() {
  const c = new Client({ connectionString: process.env.LEGACY_IMPORT_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const cols = await c.query(
    "select column_name from information_schema.columns where table_schema='public' and table_name='orders' order by ordinal_position",
  );
  console.log('orders columns:', cols.rows.map((r) => r.column_name).join(', '));
  const n = await c.query('select count(*)::int n from orders');
  console.log('orders count:', n.rows[0].n);
  try {
    const lg = await c.query('select count(*)::int n, count(legacy_woo_id) lc from orders');
    console.log('orders legacy_woo_id present:', JSON.stringify(lg.rows[0]));
  } catch {
    console.log('no legacy_woo_id col');
  }
  await c.end();
}
main().catch((e) => { console.error((e as Error).message); process.exit(1); });
