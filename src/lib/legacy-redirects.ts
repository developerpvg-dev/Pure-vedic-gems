/**
 * Bulk legacy redirects kept out of next.config — Vercel caps custom routes
 * (~1–2k). Lookup lives in proxy instead.
 */
import p2p11Pairs from '../../redirects/p2-p11-redirects.json';
import { GEO_GEM_LANDING_PATHS } from '@/lib/constants/geo-gem-landings';
import { LIVE_APP_EXACT_PATHS } from '@/lib/live-app-paths.generated';
import { toCanonicalStorefrontPath } from '@/lib/categories/canonical-storefront-path';

const FLAT_PARENTS = new Set([
  'navaratna',
  'upratna',
  'rudraksha',
  'idols',
  'jewelry',
  'malas',
]);

// Same slug list as next.config flat-category redirects (keep in sync).
const FLAT_CATEGORY_SLUGS = new Set([
  'ruby', 'pearl', 'red-coral', 'emerald', 'yellow-sapphire', 'diamond', 'blue-sapphire',
  'hessonite', 'cats-eye', 'white-sapphire', 'pitambari', 'exclusive-gems',
  'opal', 'turquoise', 'amethyst', 'moonstone', 'garnet', 'peridot', 'tanzanite',
  'lapis-lazuli', 'citrine', 'aquamarine', 'blue-topaz', 'white-topaz', 'zircon',
  'iolite', 'tourmaline', 'diopside', 'malachite', 'tiger-eye', 'kyanite', 'sunstone',
  'hakik', 'white-coral', 'spinel', 'chrysoberyl', 'rose-quartz',
  '1-mukhi', '2-mukhi', '3-mukhi', '4-mukhi', '5-mukhi', '6-mukhi', '7-mukhi',
  '8-mukhi', '9-mukhi', '10-mukhi', '11-mukhi', '12-mukhi', '13-mukhi', '14-mukhi',
  '15-mukhi', '16-mukhi', '17-mukhi', '18-mukhi', '19-mukhi', '20-mukhi', '21-mukhi',
  'gauri-shankar', 'ganesh-rudraksha', 'nir-mukhi', 'garbh-gauri', 'sawar-rudraksha',
  'shree-yantra', 'durga-devi', 'hanuman', 'shiv-ji', 'shivling', 'ganesha', 'lakshmi',
  'nandi', 'saraswati', 'vishnu', 'bracelets', 'diamond-jewellery', 'malas',
  'exclusive-rudraksha-malas', 'ready-rudraksha-jewelry-stock', 'astro-gems-stock',
]);

function barePath(pathname: string) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isProtectedLivePath(pathname: string) {
  const bare = barePath(pathname);
  return GEO_GEM_LANDING_PATHS.has(bare) || LIVE_APP_EXACT_PATHS.has(bare);
}

const EXACT = new Map<string, string>();
for (const [from, to] of p2p11Pairs as [string, string][]) {
  // Live app pages + rebuilt geo SEO URLs — never redirect away from the same URL.
  if (isProtectedLivePath(from)) continue;
  // Imported WP videos live at the same /videos/{slug} route. Collapsing every
  // legacy video permalink onto the hub broke Google + sitelinks; skip those rows.
  const fromBare = barePath(from);
  if (to === '/videos' && /^\/videos\/.+/u.test(fromBare)) continue;
  EXACT.set(from, to);
  if (!from.endsWith('/')) EXACT.set(`${from}/`, to);
}

const NESTED_SHOP = /^\/shop\/([^/]+)\/([^/]+)\/?$/;

// WP: /product-category|shop/navratan/rudrakshas/{n}-mukhi-rudraksha[/product]
// Generic next.config rewrite maps these to /shop/navaratna/... → 404.
const LEGACY_RUDRAKSHA_TREE =
  /^\/(?:product-category|shop)\/navratan\/rudrakshas(?:\/([^/]+))?(?:\/([^/]+))?$/;

const RUDRAKSHA_CAT_ALIASES: Record<string, string> = {
  'ganesh-rudrakshas': 'ganesh-rudraksha',
  'gauri-shankar-rudrakshas': 'gauri-shankar',
  'nir-mukhi-rudraksha': 'nir-mukhi',
  'garbh-gauri': 'garbh-gauri',
  'sawar-rudraksha': 'sawar-rudraksha',
};

function mapLegacyRudrakshaCat(legacy: string): string | null {
  const mukhi = legacy.match(/^(\d{1,2})-mukhi-rudraksha$/);
  if (mukhi) return `${mukhi[1]}-mukhi`;
  return RUDRAKSHA_CAT_ALIASES[legacy] ?? null;
}

/** Sitelinks / WP leftovers that must win over the dump’s “send to /” tag catch-alls. */
const FORCE = new Map<string, string>([
  ['/rudrakshas', '/shop/rudraksha'],
  ['/product-category/spiritual-idols', '/shop/idols'],
  ['/shop/spiritual-idols', '/shop/idols'],
  ['/product-category/navratan/exclusive-rudraksha', '/shop/rudraksha'],
  [
    '/shop/upratan/zircon/zircon-5-95ct-2060per-ct-natural-gemstone',
    '/shop/zircon/zircon-5-95ct-2060per-ct-natural-gemstone',
  ],
  ['/shop/jewellery/diamond-jewellery/sample-8', '/shop/diamond-jewellery'],
  ['/shop/jewelry/diamond-ring-on-demand-6', '/shop/diamond-jewellery'],
  ['/shop/jewellery/diamond-jewellery/diamond-ring-18', '/shop/diamond-jewellery'],
  [
    '/shop/navratan/emerald/emerald-5-53ct-23181-per-ct-super-luxury-natural-gemstone',
    '/shop/emerald',
  ],
  ['/tag/original-vs-substitute-gemstones', '/knowledge/gem-qualities'],
  ['/tag/gemstone-selection', '/gems-recommendations'],
  ['/tag/blue-sapphire', '/shop/blue-sapphire'],
  ['/tag/certified-rudrakshas', '/shop/rudraksha'],
  ['/tag/purevedicgems', '/about'],
  ['/tag/pure-vedic-rudraksha', '/shop/rudraksha'],
  ['/tag/free-gemstone-suggestion', '/gems-recommendations'],
  ['/tag/free-gemstone-recommendation', '/gems-recommendations'],
  ['/tag/free-gems-suggestion', '/gems-recommendations'],
  ['/tag/free-gems-recommendation', '/gems-recommendations'],
  ['/tag/gemstone-consultation-vedic-astrology', '/gems-recommendations'],
  ['/tag/authentic-vedic-gemstones', '/blog'],
  ['/tag/authentic-gemstones', '/blog'],
  ['/tag/authentic-gemstones-online', '/blog'],
  ['/tag/authentic-vedic-knowledge', '/blog'],
  ['/tag/original-astrology-gemstones', '/blog'],
  ['/tag/gemstone-benefits', '/blog'],
  ['/tag/vedic-quality-gemstones', '/blog'],
  ['/tag/gemstones-in-daily-life', '/blog'],
  ['/tag/astrology-gemstones', '/blog'],
  ['/tag/benefits-of-pure-and-natural-blue-sapphire-gemstone', '/shop/blue-sapphire'],
  ['/tag/benefits-of-blue-sapphire', '/shop/blue-sapphire'],
  ['/tag/blue-sapphire-benefits', '/shop/blue-sapphire'],
  ['/tag/care-of-gemstones', '/knowledge/gems-care'],
  ['/tag/chandra-ratna', '/shop/pearl'],
  ['/tag/garnet-jewellery', '/shop/garnet'],
  ['/tag/cats-eye-certification', '/shop/cats-eye'],
  ['/tag/white-sapphire', '/shop/white-sapphire'],
  ['/tag/authentic-gemstone-shopping-online', '/blog'],
  ['/tag/neelam-stone', '/shop/blue-sapphire'],
  ['/tag/vedic-mantra', '/knowledge/astrology'],
  ['/tag/vedic-astrology', '/knowledge/astrology'],
  ['/tag/vedic-astrology-benefits', '/knowledge/astrology'],
  ['/tag/pure-gems', '/shop'],
  ['/tag/vedic-remedies', '/gems-recommendations'],
  [
    '/our_services/online-offline-store-retail-store-gemstones-and-rudrakshas-selling/retail-store-2',
    '/about/stores',
  ],
  [
    '/our_services/online-offline-store-retail-store-gemstones-and-rudrakshas-selling',
    '/about/stores',
  ],
  ['/category/navratnas', '/shop/navaratna'],
  ['/astrological-gemstones-online', '/gems-recommendations'],
  ['/tag/astrological-gemstone', '/gems-recommendations'],
  ['/tag/astrological-gemstones', '/gems-recommendations'],
  ['/tag/astrological-gemstones-guide', '/gems-recommendations'],
  ['/tag/astrological-gemstones-india', '/gems-recommendations'],
  ['/tag/genuine-astrological-gemstones', '/gems-recommendations'],
]);

export function lookupLegacyRedirect(pathname: string): string | null {
  const bare = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (bare === '/shop') return '/gemstones';

  const dest = lookupLegacyRedirectRaw(pathname);
  if (dest) return toCanonicalStorefrontPath(dest);

  if (isProtectedLivePath(bare)) return null;
  const canon = toCanonicalStorefrontPath(bare);
  return canon !== bare ? canon : null;
}

function lookupLegacyRedirectRaw(pathname: string): string | null {
  const bare = barePath(pathname);
  if (isProtectedLivePath(bare)) return null;

  const forced = FORCE.get(pathname) ?? FORCE.get(bare);
  if (forced) return forced;

  // WP jewelry design landings → public configurator design catalog
  const designSet = bare.match(/^\/designs_set\/(design-\d+)(?:-\d+)?$/);
  if (designSet) return `/designs/ring/${designSet[1]}`;
  if (bare === '/designs_cat/rings-design') return '/designs/ring';
  if (bare === '/designs_cat/pendents') return '/designs/pendant';
  if (bare === '/designs_cat/rudraksha-designs' || bare === '/rudraksha-designs') {
    return '/designs/rudraksha';
  }

  const hit = EXACT.get(pathname) ?? EXACT.get(bare);
  if (hit) return hit;

  const rudra = bare.match(LEGACY_RUDRAKSHA_TREE);
  if (rudra) {
    const [, cat, product] = rudra;
    if (!cat) return '/shop/rudraksha';
    const shopCat = mapLegacyRudrakshaCat(cat);
    if (!shopCat) return '/shop/rudraksha';
    return product ? `/shop/${shopCat}/${product}` : `/shop/${shopCat}`;
  }

  // WP .com/.in category tree (navratan + navratnas). Rudraksha rows already matched above.
  const wpNavratan = bare.match(/^\/product-category\/navratans?(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if (wpNavratan) {
    const [, cat, product] = wpNavratan;
    if (!cat) return '/shop/navaratna';
    const rudraCat = mapLegacyRudrakshaCat(cat);
    const shopCat = rudraCat ?? cat;
    return product ? `/shop/${shopCat}/${product}` : `/shop/${shopCat}`;
  }

  // WooCommerce catalog pagination → shop hub
  if (/^\/shop\/page\/\d+$/.test(bare)) return '/shop';
  // WP blog pagination → blog hub
  if (/^\/blog\/page\/\d+$/.test(bare)) return '/blog';

  // Dead WP diamond on-demand SKUs (not in catalog)
  if (/^\/shop\/(?:jewelry|jewellery(?:\/diamond-jewellery)?)\/diamond-ring-on-demand(?:-\d+)?$/.test(bare)) {
    return '/shop/diamond-jewellery';
  }

  // WP /shop/jewellery/malas/{slug} → /shop/malas/{slug}
  const jewMala = bare.match(/^\/shop\/jewellery\/malas(?:\/([^/]+))?$/);
  if (jewMala) return jewMala[1] ? `/shop/malas/${jewMala[1]}` : '/shop/malas';

  // WP /shop/jewellery/bracelets/{slug} → /shop/bracelets/{slug} (normalize spaces)
  const jewBracelet = bare.match(/^\/shop\/jewellery\/bracelets(?:\/(.+))?$/);
  if (jewBracelet) {
    if (!jewBracelet[1]) return '/shop/bracelets';
    let slug = jewBracelet[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      /* keep raw */
    }
    slug = slug.trim().replace(/\s+/g, '-').toLowerCase();
    return `/shop/bracelets/${slug}`;
  }

  // Legacy WP store listings
  if (
    bare === '/our_services/online-offline-store-retail-store-gemstones-and-rudrakshas-selling' ||
    bare.startsWith('/our_services/online-offline-store-retail-store-gemstones-and-rudrakshas-selling/') ||
    bare === '/our_services/online-and-offline-retail-store-gemstones-and-rudrakshas-selling' ||
    bare.startsWith('/our_services/online-and-offline-retail-store-gemstones-and-rudrakshas-selling/')
  ) {
    return '/about/stores';
  }

  // /shop/upratna|navaratna/pitambari → /shop/pitambari
  if (
    pathname === '/shop/upratna/pitambari' ||
    pathname === '/shop/upratna/pitambari/' ||
    pathname === '/shop/navaratna/pitambari' ||
    pathname === '/shop/navaratna/pitambari/'
  ) {
    return '/shop/pitambari';
  }

  const m = pathname.match(NESTED_SHOP);
  if (m && FLAT_PARENTS.has(m[1]) && FLAT_CATEGORY_SLUGS.has(m[2])) {
    return `/shop/${m[2]}`;
  }

  // Unmapped WP taxonomies (next.config must not steal these before the EXACT map)
  // ponytail: leftover tags → /blog hub; stone/remedy/etc. exacts live in dump/FORCE
  if (bare.startsWith('/tag/')) return '/blog';
  if (bare.startsWith('/author/')) return '/blog';

  return null;
}
