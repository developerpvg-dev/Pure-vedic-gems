#!/usr/bin/env node
/**
 * Prints Cloudflare account setup checklist for PVG Workers migration.
 * Run: node scripts/cf-account-setup.mjs
 * Then: npm run cf:setup-cache-bucket (requires wrangler login)
 */
const steps = [
  '1. Cloudflare Dashboard → Workers & Pages → enable Workers Paid ($5/mo), CPU 30s+',
  '2. Confirm zone purevedicgems.com is on this account (CDN already used for cdn.purevedicgems.com)',
  '3. R2 → create bucket pvg-next-cache (or: npm run cf:setup-cache-bucket)',
  '4. Enable Durable Objects (included on Workers Paid)',
  '5. Optional: Browser Rendering (for admin recommendation PDFs)',
  '6. Create API token: Workers Scripts Edit + R2 Edit + Cache Purge + Account Settings Read',
  '7. npx wrangler login',
  '8. Copy every Vercel env var into Worker Settings → Variables (prod + preview env)',
  '9. Preview vars: NEXT_PUBLIC_SITE_ENV=preview, PAYGLOCAL_CALLBACK_BASE_URL=<preview host>, TURNSTILE_HOSTNAMES+=preview',
  '10. Secrets for cache purge: CACHE_PURGE_API_TOKEN, CACHE_PURGE_ZONE_ID',
  '11. After main Worker deploy: npm run cf:cron-deploy + secret put CRON_SECRET + PURGE_URL',
  '12. Do NOT attach www DNS until staging UAT passes (see plan Phase 6–7)',
];

console.log('\nCloudflare account setup (PVG → Workers)\n');
for (const s of steps) console.log(s);
console.log('\nCode is ready: npm run preview  |  npm run deploy:preview  |  npm run deploy\n');
