import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { streamWpTable } from './lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..', '..');
const workspaceRoot = resolve(appRoot, '..');
const contentDump = resolve(workspaceRoot, 'purevedi_comnewlive', 'purevedi_comnewlive.sql');
const wooDump = resolve(workspaceRoot, 'pugemved_indb', 'pugemved_indb.sql');

function inc(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function printMap(title: string, map: Map<string, number>) {
  console.log(`\n${title}`);
  for (const [key, count] of [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    console.log(`${key}: ${count}`);
  }
}

async function main() {
  const contentPostTypes = new Map<string, number>();
  const contentPostStatus = new Map<string, number>();
  for await (const row of streamWpTable({ filePath: contentDump, tableName: 'pvg_posts' })) {
    inc(contentPostTypes, String(row.post_type ?? ''));
    inc(contentPostStatus, `${row.post_type}:${row.post_status}`);
  }

  const wooPostTypes = new Map<string, number>();
  const wooPostStatus = new Map<string, number>();
  for await (const row of streamWpTable({ filePath: wooDump, tableName: 'wp_posts' })) {
    inc(wooPostTypes, String(row.post_type ?? ''));
    inc(wooPostStatus, `${row.post_type}:${row.post_status}`);
  }

  const contentTables = [
    'pvg_eemail_newsletter',
    'pvg_eemail_newsletter_sub',
    'recommendations',
    'pvg_comments',
    'pvg_users',
  ];
  console.log('CONTENT SQL TABLE COUNTS');
  for (const tableName of contentTables) {
    let count = 0;
    for await (const _ of streamWpTable({ filePath: contentDump, tableName })) count++;
    console.log(`${tableName}: ${count}`);
  }

  const wooTables = ['wp_users', 'wp_comments', 'wp_woocommerce_order_items', 'wp_posts'];
  console.log('\nWOO SQL TABLE COUNTS');
  for (const tableName of wooTables) {
    let count = 0;
    for await (const _ of streamWpTable({ filePath: wooDump, tableName })) count++;
    console.log(`${tableName}: ${count}`);
  }

  printMap('CONTENT POST TYPES', contentPostTypes);
  printMap('CONTENT POST TYPE/STATUS', contentPostStatus);
  printMap('WOO POST TYPES', wooPostTypes);
  printMap('WOO POST TYPE/STATUS', wooPostStatus);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
