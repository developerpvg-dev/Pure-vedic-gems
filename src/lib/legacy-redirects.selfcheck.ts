/**
 * ponytail: bulk redirects stay out of next.config so Vercel deploy doesn't hit the route ceiling.
 */
import { lookupLegacyRedirect } from './legacy-redirects';
import { LIVE_APP_EXACT_PATHS } from './live-app-paths.generated';
import p2p11Pairs from '../../redirects/p2-p11-redirects.json';

const cases: [string, string | null][] = [
  ['/author/admin', '/'],
  ['/author/admin/', '/'],
  ['/cart', null],
  ['/checkout', null],
  ['/shop/navaratna/ruby', '/shop/ruby'],
  ['/shop/upratna/pitambari/', '/shop/pitambari'],
  ['/shop/navaratna/some-product-sku', null],
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
