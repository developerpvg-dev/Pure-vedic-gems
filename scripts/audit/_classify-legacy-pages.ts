import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const TSV = resolve(here, 'legacy-pages.tsv');

// Migrated yagya service product slugs (Supabase products, product_type=service)
const YAGYA_SLUGS = new Set([
  'budh-shanti-yagya', 'budh-shanti-yagya-by-beej-mantra', 'chandra-shanti-yagya',
  'chandra-shanti-yagya-with-beej-mantra', 'durga-saptashati-yagya', 'guru-shanti-yagya-by-beej-mantra',
  'ketu-shanti-yagya', 'ketu-shanti-yagya-beej-mantra', 'mahamritunjay-yagya-pooja',
  'mahamritunjay-yagya-pooja-31000-jaap', 'mahamritunjay-yagya-pooja-51000-jaap', 'mahamritunjay-yagya-pooja11000-jaap',
  'mangal-shanti-yagya', 'mangal-shanti-yagya-beej-mantra', 'rahu-shanti-yagya', 'rahu-shanti-yagya-beej-mantra',
  'shani-shanti-yagya', 'shani-shanti-yagya-by-beej-mantra', 'shukra-shanti-yagya-2', 'shukra-shanti-yagya-by-beej-mantra',
  'surya-shanti-yagya', 'surya-shanti-yagya-by-beej-mantra', 'vedic-guru-shanti-yagya', 'vedic-rudrabhishek',
]);

const GEM_QUALITIES = new Set(['emerald', 'ruby', 'blue-sapphire', 'yellow-sapphire', 'white-sapphire', 'red-coral', 'hessonite', 'catseye', 'opal']);

// Exact legacy-slug -> new destination (static routes that exist)
const EXACT: Record<string, string> = {
  'about-us': '/about',
  'about-vedic-astrology': '/knowledge/astrology',
  'contact-us': '/contact',
  'privacy-policy': '/policies/privacy',
  'returns-policy': '/policies/returns',
  'return-refund-policy': '/policies/returns',
  'shipping-policy': '/policies/shipping',
  'terms-and-conditions': '/policies/terms',
  'testimonials': '/testimonials',
  'videos-testimonials': '/testimonials',
  'video': '/videos',
  'feedback': '/feedback',
  'lab-certificate': '/lab-certificate',
  'certificate-banner': '/lab-certificate',
  'events-and-seminars': '/events-and-seminars',
  'gems-care': '/knowledge/gems-care',
  'treatments-and-enhancements-gemstones': '/knowledge/treatments',
  'know-your-vedic-gems': '/consultation',
  'live-horoscope-analysis': '/consultation',
  'gems-recommendations': '/tools/recommendation',
  'gemstone-recommendation': '/tools/recommendation',
  'gemstone-recommendation-by-date-of-birth': '/tools/recommendation',
  'gemstone-recommendation-date-of-birth': '/tools/recommendation',
  'gemstone-recommendations-pure-vedic-science': '/tools/recommendation',
  'gemstone-recommendation-old-form': '/tools/recommendation',
  'online-rudraksha-recommendation': '/tools/recommendation',
  'rings-design': '/configure',
  'rudraksha-designs': '/configure',
  'pendents': '/configure',
  'how-to-measure-your-finger-for-ring': '/tools/ring-size-guide',
  'nine-vedic-gems': '/knowledge/gemstones',
  'buy-online-rudraksha': '/shop/rudraksha',
  'rudrakshas': '/shop/rudraksha',
  'energized-gems': '/knowledge/energized-gems',
  'blogs': '/blog',
  'shop': '/shop',
  'cart': '/cart',
  'checkout': '/checkout',
  'my-account': '/account',
  'wishlist': '/account/saved',
  'home': '/',
  'homenew': '/',
  'new-home': '/',
  'welcome-to-pure-vedic-gems': '/',
  'vedic-yagyas-service': '/vedic-yagyas-service',
  'livepuja': '/vedic-yagyas-service',
  'rudraksha-qualities': '/knowledge/rudraksha-qualities',
  'buy-online-blue-sapphire-gemstone': '/knowledge/gem-qualities/blue-sapphire',
  'buy-online-catseye-gemstone': '/knowledge/gem-qualities/catseye',
  'buy-online-emerald-gemstone': '/knowledge/gem-qualities/emerald',
  'buy-online-ruby-gemstone': '/knowledge/gem-qualities/ruby',
  'buy-online-yellow-sapphire-gemstone': '/knowledge/gem-qualities/yellow-sapphire',
};

// gem "qualities" page slug -> gem-qualities key
const QUALITY_MAP: Record<string, string> = {
  'blue-sapphire': 'blue-sapphire',
  'emerald-gemstone': 'emerald',
  'ruby-qualities': 'ruby',
  'yellow-sapphire': 'yellow-sapphire',
  'white-sapphire-gemstone-qualities': 'white-sapphire',
  'red-coral-qualities': 'red-coral',
  'hessonite-qualities': 'hessonite',
  'hessonite-qualites': 'hessonite',
  'catseye-gemstone': 'catseye',
  'opal-qualities': 'opal',
};

const MUKHI_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, 'twenty-one': 21,
};

function mukhiFromSlug(slug: string): number | null {
  const num = slug.match(/(\d+)\s*[-]?mukhi/) || slug.match(/(\d+)-mukhi/);
  if (num) { const n = Number(num[1]); if (n >= 1 && n <= 21) return n; }
  if (/twenty-one-mukhi/.test(slug)) return 21;
  const word = slug.match(/^([a-z]+)-\d*-?mukhi/) || slug.match(/^([a-z]+)-mukhi/);
  if (word && MUKHI_WORDS[word[1]] != null) return MUKHI_WORDS[word[1]];
  return null;
}

type Row = { site: string; id: string; path: string; title: string };

function classify(r: Row): { status: 'COVERED' | 'REDIRECT-NEEDED' | 'NOT-MIGRATED' | 'SKIP'; dest: string; note: string } {
  const slug = r.path.replace(/^\/|\/$/g, '').split('/').pop() ?? '';
  const full = r.path;

  // Junk / internal / obsolete -> SKIP (no migration needed)
  if (/^(thank-you|thankyou|certificate-banner|sitemap|data-base-integration|telecaller|gemstone-recommendation-old-form)/.test(slug)) {
    return { status: 'SKIP', dest: '-', note: 'internal/thank-you/obsolete page' };
  }

  // Exact mapped static routes
  if (EXACT[slug]) return { status: 'COVERED', dest: EXACT[slug], note: 'static route exists' };

  // Gem qualities
  if (QUALITY_MAP[slug]) return { status: 'COVERED', dest: `/knowledge/gem-qualities/${QUALITY_MAP[slug]}`, note: 'gem-qualities guide' };

  // Yagya service products
  if (YAGYA_SLUGS.has(slug)) return { status: 'COVERED', dest: `/vedic-yagyas/${slug}`, note: 'migrated yagya product' };

  // Yagya payment-page / -2 variants -> redirect to yagya landing (no online checkout now)
  if (/yagya|homam|pooja|puja|rudrabhishek|sankalpa|sankalp|navratri|navratre|mahamrityunjay|mahamritunjay|saptashati|saptshati/i.test(slug)) {
    // try to find a matching migrated yagya by stripping payment-page/-2 suffixes
    const base = slug.replace(/-payment(s)?-page.*$/, '').replace(/-paymentpage$/, '').replace(/-2$/, '');
    if (YAGYA_SLUGS.has(base)) return { status: 'COVERED', dest: `/vedic-yagyas/${base}`, note: 'yagya payment/variant -> migrated yagya' };
    return { status: 'REDIRECT-NEEDED', dest: '/vedic-yagyas-service', note: 'yagya/pooja page not individually migrated; point to yagya landing' };
  }

  // Rudraksha mukhi knowledge pages
  const mukhi = mukhiFromSlug(slug);
  if (mukhi) return { status: 'COVERED', dest: `/knowledge/rudraksha/${mukhi}-mukhi`, note: 'rudraksha mukhi guide' };

  // Country / geo SEO landing pages -> NOT migrated
  if (/-in-(philippines|switzerland|canada|uk|london|usa|australia|dubai)\b|online-in-|authentic-.*-online|harness-the-celestial|discover-the-irresistible|unlocking-prosperity|unveiling-|solar-brilliance|authenticity-well-being/.test(slug)) {
    return { status: 'NOT-MIGRATED', dest: '-', note: 'geo-targeted SEO landing page (no equivalent built)' };
  }

  // Remaining gemstone guide/content pages -> partially covered by knowledge hub, but specific article not migrated
  if (/gemstone|rudraksha|sapphire|emerald|ruby|coral|hessonite|catseye|opal|pearl|diamond|gomed|moonga|panna|manik|gems|vedic|astrolog|yoga|durga|goddess|mantra/i.test(slug) || /gemstone|rudraksha/i.test(r.title)) {
    return { status: 'NOT-MIGRATED', dest: '-', note: 'editorial/SEO content article not migrated (candidate for blog/knowledge)' };
  }

  return { status: 'NOT-MIGRATED', dest: '-', note: 'misc page not migrated' };
}

function main() {
  const lines = readFileSync(TSV, 'utf8').trim().split('\n').slice(1);
  const rows: Row[] = lines.map((l) => {
    const [site, id, path, title] = l.split('\t');
    return { site, id, path, title: title ?? '' };
  });

  const buckets: Record<string, Row[]> = { COVERED: [], 'REDIRECT-NEEDED': [], 'NOT-MIGRATED': [], SKIP: [] };
  const detail: string[] = [];
  for (const r of rows) {
    const c = classify(r);
    buckets[c.status].push(r);
    detail.push(`${c.status}\t${r.site}\t${r.path}\t${c.dest}\t${r.title}\t(${c.note})`);
  }

  console.log('=== COVERAGE SUMMARY (223 legacy published pages) ===');
  console.log(`COVERED (route/redirect already exists): ${buckets.COVERED.length}`);
  console.log(`REDIRECT-NEEDED (covered by yagya landing, add redirect): ${buckets['REDIRECT-NEEDED'].length}`);
  console.log(`NOT-MIGRATED (no equivalent built): ${buckets['NOT-MIGRATED'].length}`);
  console.log(`SKIP (junk/internal/obsolete - no action): ${buckets.SKIP.length}`);
  console.log(`Total: ${rows.length}`);

  const outFile = resolve(here, 'legacy-pages-coverage.tsv');
  writeFileSync(outFile, 'status\tsite\tpath\tdestination\ttitle\tnote\n' + detail.sort().join('\n'), 'utf8');
  console.log(`\nFull detail written to ${outFile}`);

  console.log('\n=== NOT-MIGRATED PAGES (need work) ===');
  for (const r of buckets['NOT-MIGRATED'].sort((a, b) => a.path.localeCompare(b.path))) {
    console.log(`https://www.purevedicgems.com${r.path}  —  ${r.title}`);
  }
  console.log('\n=== REDIRECT-NEEDED (yagya/pooja pages -> /vedic-yagyas-service) ===');
  for (const r of buckets['REDIRECT-NEEDED'].sort((a, b) => a.path.localeCompare(b.path))) {
    console.log(`https://www.purevedicgems.com${r.path}  —  ${r.title}`);
  }
}
main();
