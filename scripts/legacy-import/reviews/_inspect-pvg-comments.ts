/**
 * Inspect content-site (pvg_) comments + commentmeta. Read-only.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const DUMP = resolve(repoRoot, '..', 'purevedi_comnewlive', 'purevedi_comnewlive.sql');

async function main() {
  const byType = new Map<string, number>();
  const byTypeApproved = new Map<string, number>();
  const samples: Record<string, SqlValue>[] = [];

  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'pvg_comments' })) {
    const type = String(r.comment_type ?? '').trim() || '(empty)';
    byType.set(type, (byType.get(type) ?? 0) + 1);
    if (String(r.comment_approved) === '1') byTypeApproved.set(type, (byTypeApproved.get(type) ?? 0) + 1);
    if (samples.length < 4 && String(r.comment_approved) === '1') samples.push(r);
  }

  console.log('pvg_comments type tallies (total / approved):');
  for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(20)} ${String(n).padStart(6)}  / approved ${byTypeApproved.get(t) ?? 0}`);
  }

  const metaKeys = new Map<string, number>();
  let metaRows = 0;
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'pvg_commentmeta' })) {
    metaRows++;
    metaKeys.set(String(r.meta_key ?? ''), (metaKeys.get(String(r.meta_key ?? '')) ?? 0) + 1);
  }
  console.log(`\npvg_commentmeta rows: ${metaRows}`);
  for (const [k, n] of [...metaKeys.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${k.padEnd(24)} ${n}`);

  console.log('\nsample approved rows:');
  for (const s of samples) {
    console.log(JSON.stringify({
      id: s.comment_ID, post: s.comment_post_ID, author: s.comment_author,
      type: s.comment_type || '(empty)', parent: s.comment_parent,
      content: String(s.comment_content ?? '').slice(0, 90),
    }));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
