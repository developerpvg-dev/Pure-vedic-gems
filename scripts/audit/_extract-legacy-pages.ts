import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { streamWpTable } from '../legacy-import/lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const CONTENT = resolve(repoRoot, '..', 'purevedi_comnewlive', 'purevedi_comnewlive.sql');
const WOO = resolve(repoRoot, '..', 'pugemved_indb', 'pugemved_indb.sql');

type Page = { id: string; slug: string; title: string; parent: string; site: string };

async function collect(file: string, table: string, site: string): Promise<Page[]> {
  const out: Page[] = [];
  for await (const r of streamWpTable({
    filePath: file,
    tableName: table,
    filter: (row) => row.post_type === 'page' && row.post_status === 'publish',
  })) {
    out.push({
      id: String(r.ID),
      slug: String(r.post_name ?? ''),
      title: String(r.post_title ?? '').replace(/\s+/g, ' ').trim(),
      parent: String(r.post_parent ?? '0'),
      site,
    });
  }
  return out;
}

async function main() {
  const content = await collect(CONTENT, 'pvg_posts', 'content');
  const woo = await collect(WOO, 'wp_posts', 'woo');
  console.log(`Content-site published pages: ${content.length}`);
  console.log(`Woo-site published pages: ${woo.length}`);

  // Build full path using parent slugs
  const buildPath = (pages: Page[]) => {
    const byId = new Map(pages.map((p) => [p.id, p]));
    return pages.map((p) => {
      const parts = [p.slug];
      let cur = p;
      const seen = new Set<string>();
      while (cur.parent !== '0' && byId.has(cur.parent) && !seen.has(cur.parent)) {
        seen.add(cur.parent);
        cur = byId.get(cur.parent)!;
        parts.unshift(cur.slug);
      }
      return { ...p, path: '/' + parts.filter(Boolean).join('/') + '/' };
    });
  };

  const all = [...buildPath(content), ...buildPath(woo)];
  const lines = all.map((p) => `${p.site}\t${p.id}\t${p.path}\t${p.title}`).sort();
  const outFile = resolve(here, 'legacy-pages.tsv');
  writeFileSync(outFile, 'site\tid\tpath\ttitle\n' + lines.join('\n'), 'utf8');
  console.log(`\nWrote ${all.length} pages to ${outFile}`);

  // Print all slugs grouped
  console.log('\n--- CONTENT SITE PAGES ---');
  for (const p of buildPath(content).sort((a, b) => a.slug.localeCompare(b.slug))) {
    console.log(`${p.path}\t${p.title}`);
  }
  console.log('\n--- WOO SITE PAGES ---');
  for (const p of buildPath(woo).sort((a, b) => a.slug.localeCompare(b.slug))) {
    console.log(`${p.path}\t${p.title}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
