/**
 * ponytail: bulk redirects stay out of next.config so Vercel deploy doesn't hit the route ceiling.
 */
import { lookupLegacyRedirect } from './legacy-redirects';

const cases: [string, string | null][] = [
  ['/author/admin', '/'],
  ['/author/admin/', '/'],
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

console.log('legacy-redirects.selfcheck: ok');
