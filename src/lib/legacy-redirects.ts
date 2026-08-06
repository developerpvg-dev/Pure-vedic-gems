/**
 * Bulk legacy redirects kept out of next.config — Vercel caps custom routes
 * (~1–2k). Lookup lives in proxy instead.
 */
import p2p11Pairs from '../../redirects/p2-p11-redirects.json';

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

const EXACT = new Map<string, string>();
for (const [from, to] of p2p11Pairs as [string, string][]) {
  EXACT.set(from, to);
  if (!from.endsWith('/')) EXACT.set(`${from}/`, to);
}

const NESTED_SHOP = /^\/shop\/([^/]+)\/([^/]+)\/?$/;

export function lookupLegacyRedirect(pathname: string): string | null {
  const hit = EXACT.get(pathname);
  if (hit) return hit;

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

  return null;
}
