/**
 * Run: npx tsx src/lib/constants/geo-buy-seo.selfcheck.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { GEO_BUY_REDIRECTS, GEO_BUY_SOURCES, MALAYSIA_GEM_REDIRECTS, geoBuySourcesForDest } from './geo-buy-seo';

if (GEO_BUY_REDIRECTS.length !== 61) throw new Error(`expected 61 redirects, got ${GEO_BUY_REDIRECTS.length}`);
if (GEO_BUY_SOURCES.length !== 61) throw new Error(`expected 61 sources, got ${GEO_BUY_SOURCES.length}`);

for (const [source, dest] of GEO_BUY_REDIRECTS) {
  if (!source.startsWith('/')) throw new Error(`bad source ${source}`);
  if (!dest.startsWith('/knowledge/')) throw new Error(`bad dest ${dest}`);
  const row = GEO_BUY_SOURCES.find((s) => s.path === source);
  if (!row) throw new Error(`missing SEO row for ${source}`);
  if (row.destination !== dest) throw new Error(`dest mismatch ${source}`);
  if (!row.title && !row.h1) throw new Error(`empty title for ${source}`);
  if ((row.description || '').length < 40) throw new Error(`thin desc for ${source}`);
}

const dests = new Set(GEO_BUY_REDIRECTS.map(([, d]) => d));
for (const d of dests) {
  if (geoBuySourcesForDest(d).length === 0) throw new Error(`empty sources for ${d}`);
}

const cfg = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8');
for (const [source] of GEO_BUY_REDIRECTS) {
  if (!cfg.includes(`'${source}'`)) throw new Error(`next.config missing ${source}`);
}
if (MALAYSIA_GEM_REDIRECTS.length !== 8) throw new Error('expected 8 Malaysia gem redirects');
for (const [source, dest] of MALAYSIA_GEM_REDIRECTS) {
  if (!cfg.includes(`'${source}'`)) throw new Error(`next.config missing Malaysia source ${source}`);
  if (!cfg.includes(`'${dest}'`)) throw new Error(`next.config missing Malaysia dest ${dest}`);
  if (dest === '/consultation') throw new Error(`Malaysia gem still points at consultation: ${source}`);
}

console.log('geo-buy-seo.selfcheck: ok', {
  redirects: GEO_BUY_REDIRECTS.length,
  destinations: dests.size,
});
