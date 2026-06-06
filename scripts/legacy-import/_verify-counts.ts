import { Client } from 'pg';

const c = new Client({
  connectionString: process.env.LEGACY_IMPORT_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await c.connect();
  const ev = await c.query('select count(*)::int n, count(youtube_id)::int yt from event_videos');
  const vids = await c.query('select count(*)::int n from videos');
  const cats = await c.query('select count(*)::int n from video_categories');
  const prod = await c.query('select count(*)::int n, count(legacy_woo_id)::int leg from products');
  console.log('event_videos:', ev.rows[0]);
  console.log('videos:', vids.rows[0].n, 'video_categories:', cats.rows[0].n);
  console.log('products:', prod.rows[0]);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
