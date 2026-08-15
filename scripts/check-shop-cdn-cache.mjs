/**
 * ponytail: shop listings must be cached at the Vercel CDN, without caching PDPs.
 * Run: node scripts/check-shop-cdn-cache.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const config = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');
const revalidation = readFileSync(join(process.cwd(), 'src/lib/shop/revalidate.ts'), 'utf8');
const cacheHeader = "Vercel-CDN-Cache-Control";
const cacheValue = 'public, s-maxage=900, stale-while-revalidate=60';

let failed = false;
function check(condition, message) {
  if (condition) {
    console.log(`ok: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
    failed = true;
  }
}

check(config.includes("source: '/shop'"), '/shop has a dedicated header rule');
check(config.includes("source: '/shop/:category'"), '/shop/:category has a dedicated header rule');
check(config.includes(cacheHeader), 'Vercel CDN cache header is configured');
check(config.includes(cacheValue), 'cache window is fifteen minutes with stale revalidation');
check(!config.includes("source: '/shop/:category/:slug'"), 'PDPs are not CDN-cached by this rule');
check(revalidation.includes("revalidatePath('/shop/[category]', 'page')"), 'all category routes invalidate after catalog changes');
check(revalidation.includes("revalidatePath('/shop/[category]/[slug]', 'page')"), 'all product routes invalidate after catalog changes');
check(revalidation.includes("revalidatePath('/')"), 'homepage invalidates after catalog changes');
check(revalidation.includes('SHOP_FILTER_FACETS_CACHE_TAG'), 'filter facet cache is tagged for busting');

if (failed) process.exit(1);
console.log('shop CDN cache check passed');
