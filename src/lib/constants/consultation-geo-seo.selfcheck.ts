/**
 * ponytail: geo consultation SEO + redirects stay complete.
 * Run: npx tsx src/lib/constants/consultation-geo-seo.selfcheck.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  CONSULTATION_GEO_KEYWORDS,
  CONSULTATION_GEO_META,
  CONSULTATION_GEO_REDIRECT_SOURCES,
  CONSULTATION_GEO_SOURCES,
  CONSULTATION_PATH,
  consultationGeoInternalJsonLd,
} from './consultation-geo-seo';

if (CONSULTATION_PATH !== '/consultation') throw new Error('path');
if (CONSULTATION_GEO_REDIRECT_SOURCES.length < 6) throw new Error('missing redirect sources');
if (CONSULTATION_GEO_SOURCES.length < 13) throw new Error('missing SEO source pages');
if (CONSULTATION_GEO_KEYWORDS.length < 15) throw new Error('thin keywords');
if (!CONSULTATION_GEO_META.title.toLowerCase().includes('consultation')) {
  throw new Error('title missing consultation');
}
if (!CONSULTATION_GEO_META.description.toLowerCase().includes('abu dhabi')) {
  throw new Error('description missing geo cities');
}

const ld = consultationGeoInternalJsonLd((p = '/') => `https://purevedicgems.com${p}`);
const webpage = ld.find((x) => x['@type'] === 'WebPage') as { abstract?: string } | undefined;
if (!webpage?.abstract || webpage.abstract.length < 800) {
  throw new Error('WebPage abstract too thin');
}

const cfg = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8');
for (const source of CONSULTATION_GEO_REDIRECT_SOURCES) {
  if (!cfg.includes(`'${source}'`)) {
    throw new Error(`next.config missing redirect source: ${source}`);
  }
}
if (!cfg.includes("destination: '/consultation'")) {
  throw new Error('next.config missing consultation destination block');
}

console.log('consultation-geo-seo.selfcheck: ok', {
  redirects: CONSULTATION_GEO_REDIRECT_SOURCES.length,
  sources: CONSULTATION_GEO_SOURCES.length,
  keywords: CONSULTATION_GEO_KEYWORDS.length,
});
