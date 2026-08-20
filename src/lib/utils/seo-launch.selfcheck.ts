/**
 * Go-live SEO wiring check.
 * Run: npx tsx src/lib/utils/seo-launch.selfcheck.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllGeoGemLandingSlugs } from '../constants/geo-gem-landings';
import { GEM_QUALITIES } from '../constants/gem-qualities';
import {
  brandLogoUrl,
  defaultOgImageUrl,
  getSiteUrl,
  organizationJsonLd,
  websiteJsonLd,
} from './seo';

const root = process.cwd();
const sitemapSrc = readFileSync(join(root, 'src/app/sitemap.ts'), 'utf8');

if (!sitemapSrc.includes('getAllGeoGemLandingSlugs')) {
  throw new Error('sitemap must include geo gem landings');
}
if (!sitemapSrc.includes('GEM_QUALITIES')) {
  throw new Error('sitemap must include gem-qualities guides');
}
if (!sitemapSrc.includes('/vedic-yagyas-service')) {
  throw new Error('sitemap missing vedic-yagyas-service');
}
if (!sitemapSrc.includes('/lab-certificate')) {
  throw new Error('sitemap missing lab-certificate');
}

const geoCount = getAllGeoGemLandingSlugs().length;
if (geoCount < 60) throw new Error(`expected ~69 geo landings, got ${geoCount}`);
if (GEM_QUALITIES.length < 9) throw new Error('expected navaratna gem quality guides');

const site = getSiteUrl();
if (!site.startsWith('http')) throw new Error('bad site url');

const org = organizationJsonLd();
const sameAs = org.sameAs as string[];
for (const url of [
  'https://www.facebook.com/puregems.vm',
  'https://www.instagram.com/purevedicgems',
  'https://www.youtube.com/@purevedicgems',
]) {
  if (!sameAs.includes(url)) throw new Error(`sameAs missing ${url}`);
}
if (!String(brandLogoUrl()).endsWith('/pvg-logo.png')) throw new Error('brand logo path');
if (!org.merchantReturnPolicy || !String((org.merchantReturnPolicy as { url?: string }).url).includes('/policies/returns')) {
  throw new Error('Organization must declare merchantReturnPolicy');
}
if (!String(defaultOgImageUrl()).endsWith('/og-default.png')) throw new Error('og image path');

const web = websiteJsonLd();
const action = web.potentialAction as { target?: { urlTemplate?: string } };
if (!action.target?.urlTemplate?.includes('/shop?q=')) {
  throw new Error('WebSite SearchAction must point at /shop?q=');
}

const requiredPublic = [
  'public/favicon.ico',
  'public/pvg-logo.png',
  'public/og-default.png',
  'public/placeholder-gem.png',
  'public/site.webmanifest',
];
for (const file of requiredPublic) {
  try {
    readFileSync(join(root, file));
  } catch {
    throw new Error(`missing asset ${file}`);
  }
}

console.log('seo-launch.selfcheck: ok', {
  geoLandings: geoCount,
  gemQualities: GEM_QUALITIES.length,
  site,
  logo: brandLogoUrl(),
});
