/**
 * ponytail: bulk redirects stay out of next.config so Vercel deploy doesn't hit the route ceiling.
 */
import { lookupLegacyRedirect } from './legacy-redirects';
import { LIVE_APP_EXACT_PATHS } from './live-app-paths.generated';
import p2p11Pairs from '../../redirects/p2-p11-redirects.json';

const cases: [string, string | null][] = [
  ['/author/admin', '/blog'],
  ['/author/admin/', '/blog'],
  ['/cart', null],
  ['/checkout', null],
  ['/shop/navaratna/ruby', '/shop/ruby'],
  ['/shop/upratna/pitambari/', '/shop/pitambari'],
  ['/shop/navaratna/some-product-sku', null],
  ['/rudrakshas', '/shop/rudraksha'],
  ['/rudrakshas/', '/shop/rudraksha'],
  ['/product-category/navratan/rudrakshas/5-mukhi-rudraksha', '/shop/5-mukhi'],
  ['/product-category/navratan/rudrakshas/5-mukhi-rudraksha/', '/shop/5-mukhi'],
  ['/product-category/navratan/rudrakshas', '/shop/rudraksha'],
  ['/shop/navratan/rudrakshas/10-mukhi-rudraksha', '/shop/10-mukhi'],
  ['/product-category/navratan/rudrakshas/ganesh-rudrakshas', '/shop/ganesh-rudraksha'],
  [
    '/product-category/navratan/rudrakshas/5-mukhi-rudraksha/5-mukhi-rudraksha-2-496g-natural-rudraksha',
    '/shop/5-mukhi/5-mukhi-rudraksha-2-496g-natural-rudraksha',
  ],
  ['/product-category/spiritual-idols', '/shop/idols'],
  ['/product-category/spiritual-idols/', '/shop/idols'],
  ['/shop/spiritual-idols', '/shop/idols'],
  ['/product-category/navratan/exclusive-rudraksha', '/shop/rudraksha'],
  ['/shop/page/80', '/shop'],
  ['/shop/page/96/', '/shop'],
  ['/blog/page/3', '/blog'],
  ['/blog/page/12/', '/blog'],
  [
    '/shop/upratan/zircon/zircon-5-95ct-2060per-ct-natural-gemstone',
    '/shop/zircon/zircon-5-95ct-2060per-ct-natural-gemstone',
  ],
  ['/shop/jewellery/diamond-jewellery/sample-8', '/shop/diamond-jewellery'],
  ['/shop/jewelry/diamond-ring-on-demand-6', '/shop/diamond-jewellery'],
  ['/shop/jewelry/diamond-ring-on-demand-20', '/shop/diamond-jewellery'],
  ['/shop/jewellery/diamond-jewellery/diamond-ring-on-demand-3', '/shop/diamond-jewellery'],
  ['/shop/jewellery/malas/3-mukhi-rudraksha-mala-13mm-2', '/shop/malas/3-mukhi-rudraksha-mala-13mm-2'],
  ['/shop/jewellery/malas', '/shop/malas'],
  [
    '/shop/jewellery/bracelets/lapis lazuli bracelet 8mm natural gemstone',
    '/shop/bracelets/lapis-lazuli-bracelet-8mm-natural-gemstone',
  ],
  [
    '/shop/jewellery/bracelets/lapis-lazuli-bracelet-8mm-natural-gemstone',
    '/shop/bracelets/lapis-lazuli-bracelet-8mm-natural-gemstone',
  ],
  ['/shop/jewellery/bracelets', '/shop/bracelets'],
  ['/shop/jewellery/diamond-jewellery/diamond-ring-18', '/shop/diamond-jewellery'],
  [
    '/shop/navratan/emerald/emerald-5-53ct-23181-per-ct-super-luxury-natural-gemstone',
    '/shop/emerald',
  ],
  ['/tag/original-vs-substitute-gemstones', '/knowledge/gem-qualities'],
  ['/tag/gemstone-selection', '/gems-recommendations'],
  ['/tag/blue-sapphire', '/shop/blue-sapphire'],
  ['/tag/blue-sapphire-price', '/shop/blue-sapphire'],
  ['/tag/certified-rudrakshas', '/shop/rudraksha'],
  ['/tag/purevedicgems', '/about'],
  ['/tag/pure-vedic-rudraksha', '/shop/rudraksha'],
  ['/tag/free-gemstone-suggestion', '/gems-recommendations'],
  ['/tag/free-gemstone-recommendation', '/gems-recommendations'],
  ['/tag/gemstone-consultation-vedic-astrology', '/gems-recommendations'],
  ['/tag/authentic-vedic-gemstones', '/blog'],
  ['/tag/authentic-gemstones', '/blog'],
  ['/tag/original-astrology-gemstones', '/blog'],
  ['/tag/gemstone-benefits', '/blog'],
  ['/tag/vedic-quality-gemstones', '/blog'],
  ['/tag/gemstones-in-daily-life', '/blog'],
  ['/tag/benefits-of-pure-and-natural-blue-sapphire-gemstone', '/shop/blue-sapphire'],
  ['/tag/care-of-gemstones', '/knowledge/gems-care'],
  ['/tag/chandra-ratna', '/shop/pearl'],
  ['/tag/garnet-jewellery', '/shop/garnet'],
  ['/tag/cats-eye-certification', '/shop/cats-eye'],
  ['/tag/white-sapphire', '/shop/white-sapphire'],
  ['/tag/neelam-stone', '/shop/blue-sapphire'],
  ['/tag/vedic-mantra', '/knowledge/astrology'],
  ['/tag/vedic-astrology-benefits', '/knowledge/astrology'],
  ['/tag/pure-gems', '/shop'],
  ['/tag/vedic-remedies', '/gems-recommendations'],
  [
    '/our_services/online-offline-store-retail-store-gemstones-and-rudrakshas-selling/retail-store-2',
    '/about/stores',
  ],
  ['/testimonial/satya', null],
  ['/category/navratnas', '/shop/navaratna'],
  ['/astrological-gemstones-online', '/gems-recommendations'],
  ['/tag/astrological-gemstones', '/gems-recommendations'],
  // Unmapped tag fallback after removing next.config /tag catch-all
  ['/tag/zzzz-unmapped-fallback-test', '/blog'],
  // Must NOT hub-dump — same-path video permalinks are live app routes.
  ['/videos/about-pukhraj', null],
  ['/videos/how-to-clean-your-astro-gems/', null],
  ['/videos_cat/informational-videos-about-gemstones-and-rudrakshas', '/videos'],
  // Jewelry design catalog (overrides dump → /)
  ['/designs_set/design-1', '/designs/ring/design-1'],
  ['/designs_set/design-14-2', '/designs/ring/design-14'],
  ['/designs_cat/rings-design', '/designs/ring'],
  ['/designs_cat/pendents', '/designs/pendant'],
  ['/rudraksha-designs', '/designs/rudraksha'],
];

for (const [from, want] of cases) {
  const got = lookupLegacyRedirect(from);
  if (got !== want) {
    throw new Error(`lookupLegacyRedirect(${from}) => ${got}, want ${want}`);
  }
}

// No exact WP redirect may target a live Next.js page path.
const stolen: string[] = [];
for (const [from] of p2p11Pairs as [string, string][]) {
  const bare = from.length > 1 && from.endsWith('/') ? from.slice(0, -1) : from;
  if (!LIVE_APP_EXACT_PATHS.has(bare)) continue;
  const got = lookupLegacyRedirect(bare);
  if (got != null) stolen.push(`${bare} → ${got}`);
}
if (stolen.length) {
  throw new Error(`live app paths still redirect:\n${stolen.join('\n')}`);
}

for (const path of LIVE_APP_EXACT_PATHS) {
  if (lookupLegacyRedirect(path) != null) {
    throw new Error(`live path ${path} must not redirect`);
  }
}

console.log('legacy-redirects.selfcheck: ok');
