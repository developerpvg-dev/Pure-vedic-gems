/**
 * Inspect Woo comments: tally comment_type, approval, and sample a review row.
 * Read-only. Run: tsx scripts/legacy-import/reviews/_inspect-comments.ts
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const WOO_DUMP = resolve(repoRoot, '..', 'pugemved_indb', 'pugemved_indb.sql');

async function main() {
  const byType = new Map<string, number>();
  const byTypeApproved = new Map<string, number>();
  let withContent = 0;
  const samples: Record<string, SqlValue>[] = [];

  for await (const r of streamWpTable({ filePath: WOO_DUMP, tableName: 'wp_comments' })) {
    const type = String(r.comment_type ?? '').trim() || '(empty)';
    byType.set(type, (byType.get(type) ?? 0) + 1);
    if (String(r.comment_approved) === '1') {
      byTypeApproved.set(type, (byTypeApproved.get(type) ?? 0) + 1);
    }
    if (String(r.comment_content ?? '').trim()) withContent++;
    if ((type === 'review' || type === '(empty)') && samples.length < 3 && String(r.comment_approved) === '1') {
      samples.push(r);
    }
  }

  console.log('comment_type tallies (total / approved):');
  for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(20)} ${String(n).padStart(6)}  / approved ${byTypeApproved.get(t) ?? 0}`);
  }
  console.log(`\nrows with content: ${withContent}`);

  // Check commentmeta for rating keys
  const metaKeys = new Map<string, number>();
  let metaRows = 0;
  for await (const r of streamWpTable({ filePath: WOO_DUMP, tableName: 'wp_commentmeta' })) {
    metaRows++;
    const k = String(r.meta_key ?? '');
    metaKeys.set(k, (metaKeys.get(k) ?? 0) + 1);
  }
  console.log(`\ncommentmeta rows: ${metaRows}`);
  for (const [k, n] of [...metaKeys.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${k.padEnd(24)} ${n}`);
  }

  console.log('\nsample approved review rows:');
  for (const s of samples) {
    console.log(JSON.stringify({
      id: s.comment_ID, post: s.comment_post_ID, author: s.comment_author,
      type: s.comment_type, approved: s.comment_approved,
      content: String(s.comment_content ?? '').slice(0, 80),
    }));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
