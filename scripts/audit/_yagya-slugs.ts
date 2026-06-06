import { Client } from 'pg';

async function main() {
  const c = new Client({ connectionString: process.env.LEGACY_IMPORT_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const y = await c.query(`select slug, name from products where product_type='service' and is_active=true order by slug`);
  console.log(`yagya service products: ${y.rows.length}`);
  for (const r of y.rows) console.log(`  ${r.slug}\t${r.name}`);
  await c.end();
}
main().catch((e) => { console.error((e as Error).message); process.exit(1); });
