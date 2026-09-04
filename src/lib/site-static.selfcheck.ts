/**
 * ponytail: site-static redirect helper — fails if logo stays spacey or brand paths redirect.
 * Run: npx tsx src/lib/site-static.selfcheck.ts
 */
import assert from 'node:assert/strict';
import {
  isKeepLocalAssetPath,
  isOffloadedSiteAssetPath,
  publicCdnOrigin,
  siteStaticPublicUrl,
} from './site-static';

assert.equal(isKeepLocalAssetPath('/pvg-emblem.webp'), true);
assert.equal(isKeepLocalAssetPath('/home/hero/pvgheropc1.webp'), true);
assert.equal(isKeepLocalAssetPath('/email/pvg-emblem.png'), true);
assert.equal(isOffloadedSiteAssetPath('/pvg-emblem.webp'), false);
assert.equal(isOffloadedSiteAssetPath('/knowledge'), false);
assert.equal(isOffloadedSiteAssetPath('/knowledge/gemstones'), false);
assert.equal(isOffloadedSiteAssetPath('/knowledge/energized-gems/x.png'), true);
assert.equal(isOffloadedSiteAssetPath('/home/ctas/cta2.webp'), true);
assert.equal(isOffloadedSiteAssetPath("/home/director'spick/vikasmehra.png"), true);

const url = siteStaticPublicUrl('/home/ctas/cta2.webp', 'https://xyz.supabase.co');
assert.equal(url, 'https://xyz.supabase.co/storage/v1/object/public/site-static/home/ctas/cta2.webp');

const spaced = siteStaticPublicUrl('/home/rudrakhshas images/x.webp', 'https://xyz.supabase.co');
assert.ok(spaced?.includes('rudrakhshas%20images'));

assert.equal(siteStaticPublicUrl('/pvg-emblem.webp', 'https://xyz.supabase.co'), null);

assert.equal(publicCdnOrigin('cdn.purevedicgems.com'), 'https://cdn.purevedicgems.com');
assert.equal(publicCdnOrigin('https://cdn.purevedicgems.com/'), 'https://cdn.purevedicgems.com');
assert.equal(publicCdnOrigin('http://insecure.example'), null);

const cdn = siteStaticPublicUrl(
  '/home/ctas/cta2.webp',
  'https://xyz.supabase.co',
  'https://cdn.purevedicgems.com',
);
assert.equal(cdn, 'https://cdn.purevedicgems.com/site-static/home/ctas/cta2.webp');

console.log('site-static.selfcheck: ok');
