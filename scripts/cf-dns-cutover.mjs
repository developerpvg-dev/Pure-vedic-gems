#!/usr/bin/env node
/**
 * DNS cutover checklist (run after staging UAT). Manual — requires Cloudflare zone access.
 * Run: node scripts/cf-dns-cutover.mjs
 */
const steps = [
  'PRE: Keep Vercel Production live until cutover succeeds (14-day rollback window).',
  '',
  '1. npm run deploy  (production Worker secrets already set)',
  '2. Workers → pure-vedic-gems → Custom Domains → add www.purevedicgems.com + apex',
  '3. DNS: if www still points at cname.vercel-dns.com, switch to Worker custom domain (orange cloud)',
  '4. Update production webhooks to www (same paths, new origin if needed):',
  '   - Razorpay /api/webhooks/razorpay',
  '   - PayGlocal callback /api/payment/payglocal/callback + /api/webhooks/payglocal',
  '   - Sanity /api/webhooks/sanity',
  '   - WhatsApp /api/agent/whatsapp',
  '5. Supabase Auth redirect URLs include production www',
  '6. Watch: Worker metrics, Sentry, first order, PayGlocal + Razorpay callbacks',
  '7. Pause Vercel Production deploys so origins cannot diverge',
  '8. After 14 quiet days: remove Vercel project, drop vercel.json crons',
  '',
  'ROLLBACK: restore www CNAME to Vercel; restore webhook URLs; leave Worker as backup.',
];

console.log('\nDNS cutover checklist (PVG Workers)\n');
for (const s of steps) console.log(s);
console.log('');
