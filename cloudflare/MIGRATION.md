# Vercel → Cloudflare Workers runbook

Everything needed to move www.purevedicgems.com to Cloudflare Workers, in order.
The domain does not change, so webhook URLs, Supabase auth URLs and payment return URLs stay the same.

## What the code already handles

| Vercel feature | Workers replacement |
| --- | --- |
| `vercel.json` cron (03:00 UTC purge) | `triggers.crons` + `scheduled()` in `cloudflare/worker.ts` |
| Region `bom1` | `placement` pinned to the Supabase host in `wrangler.jsonc` |
| `x-forwarded-for`, `x-vercel-ip-*` headers | set from `cf-connecting-ip` / `request.cf` in `cloudflare/worker.ts` |
| ISR / `revalidatePath` / `revalidateTag` | R2 bucket `pvg-next-cache` + Durable Objects (`open-next.config.ts`) |
| Recommendation PDFs (`@sparticuz/chromium`) | Browser Rendering binding `BROWSER` |
| Admin media uploads (S3 SDK) | R2 binding `PUBLIC_MEDIA` → bucket `pvg-public` |
| Background work after response (`void promise`) | `after()` (mapped to `waitUntil`) |
| Filesystem reads (prompt, email attachment) | inlined / fetched over HTTPS |

Verified locally in `workerd`: pages, auth redirects, legacy redirects, security headers, ISR cache hit, `/api/health`, cron trigger, R2 put/get/delete, node:crypto + jose (PayGlocal JWS/JWE), Razorpay SDK, xlsx. Bundle: ~49 MiB of the 64 MiB limit.

## 1. One-time Cloudflare setup

1. **Workers Paid** plan ($5/mo): Dashboard → Workers & Pages → Plans.
2. **R2 cache buckets** (`pvg-public` already exists):
   `npx wrangler login` then `npm run cf:setup-cache-bucket`
3. **Browser Rendering**: included on Workers Paid; nothing to enable.
4. **Cache purge API token**: My Profile → API Tokens → Create → permission *Zone → Cache Purge → Purge*, zone `purevedicgems.com`. Keep it for `CACHE_PURGE_API_TOKEN`; the zone ID (Zone Overview page, right column) is `CACHE_PURGE_ZONE_ID`.
5. If the first deploy fails on `placement` (targeted placement not available on the account), change it in `wrangler.jsonc` to `"placement": { "mode": "smart" }`.

## 2. Connect GitHub (Workers Builds)

Build in Cloudflare, not from your laptop: a local build bakes `.env.local` values into the bundle.

Create two Workers via Workers & Pages → Create → Import a repository → `purevedicgems`:

| | Preview | Production |
| --- | --- | --- |
| Worker name | `pure-vedic-gems-preview` | `pure-vedic-gems` |
| Production branch | `cloudflare-workers` | `main` |
| Build command | `npm run cf:build` | `npm run cf:build` |
| Deploy command | `npx opennextjs-cloudflare deploy --env preview` | `npx opennextjs-cloudflare deploy` |
| Non-production branch deploy command | `npx opennextjs-cloudflare upload --env preview` | `npx opennextjs-cloudflare upload` |

The deploy command must be `opennextjs-cloudflare deploy` (not the default `wrangler deploy`), because it also uploads prerendered pages to the R2 cache.

## 3. Environment variables

Copy **every** variable from Vercel → Settings → Environment Variables into **both** places on each Worker:

- Settings → Build → **Variables and secrets** (build time: `NEXT_PUBLIC_*` get baked into the browser bundle, and static pages read the server vars while prerendering)
- Settings → **Variables and Secrets** (runtime; mark keys/tokens as *Secret*)

`keep_vars` is on, so deploys never wipe dashboard variables.

Plus, on both Workers (runtime only): `CACHE_PURGE_API_TOKEN`, `CACHE_PURGE_ZONE_ID`.

Variables the code reads (check none are missing):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_FETCH_TIMEOUT_MS`
- Site: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_ENV`, `NEXT_PUBLIC_CDN_URL`, `GOOGLE_SITE_VERIFICATION`
- Razorpay: `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- PayGlocal: `NEXT_PUBLIC_PAYGLOCAL_ENABLED`, `PAYGLOCAL_ENV`, `PAYGLOCAL_MERCHANT_ID`, `PAYGLOCAL_PRIVATE_KEY_ID`, `PAYGLOCAL_PUBLIC_KEY_ID`, `PAYGLOCAL_PRIVATE_KEY`, `PAYGLOCAL_PUBLIC_KEY`, `PAYGLOCAL_CALLBACK_BASE_URL`, `PAYGLOCAL_RESULT_BASE_URL`
- Sanity: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`, `SANITY_WEBHOOK_SECRET`
- Analytics: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`
- Turnstile: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_HOSTNAMES`
- Contact/UI: `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SUPPORT_PHONE`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SHOW_THEME_SWITCHER`
- Ratna agent: `NEXT_PUBLIC_AGENT_ENABLED`, `AGENT_ENABLED`, `AGENT_SESSION_SECRET`, `OPENAI_API_KEY`, `NEXT_PUBLIC_RATNA_CALL_NUMBERS`, `RATNA_HANDOFF_PHONE`, `RATNA_LEAD_SCORE_THRESHOLD`
- Sentry: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `EMAIL_FROM`, `EMAIL_SITE_URL`, `EMAIL_ASSET_BASE_URL`, `EMAIL_LOGO_URL`, `EMAIL_WORDMARK_URL`, `ADMIN_NOTIFICATION_EMAIL`, `SALES_NOTIFICATION_EMAIL`
- Secrets: `CRON_SECRET`, `ADMIN_MFA_SECRET`, `INVENTORY_ADMIN_OTP_CODES`, `BOOKING_TOKEN_SECRET`, `DELIVERY_PROOF_SECRET`, `PRODUCT_VIDEO_REVIEW_SECRET`, `RING_SIZE_CONFIRM_SECRET`
- R2 (fallback path): `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
- Chatwoot: `CHATWOOT_API_TOKEN`, `CHATWOOT_BASE_URL`, `CHATWOOT_INBOX_ID`
- Voice: `BHARATVOICE_API_BASE_URL`, `BHARATVOICE_API_KEY`, `PIPECAT_SERVICE_URL`
- WhatsApp: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

**Preview Worker overrides** (in both build and runtime):

- `NEXT_PUBLIC_SITE_ENV=preview`
- `NEXT_PUBLIC_SITE_URL=https://pure-vedic-gems-preview.<your-subdomain>.workers.dev`
- `PAYGLOCAL_CALLBACK_BASE_URL` and `PAYGLOCAL_RESULT_BASE_URL` = same preview URL
- `PAYGLOCAL_ENV` and keys = UAT values
- Razorpay = test keys
- `TURNSTILE_HOSTNAMES` = add the preview host; also add it in Cloudflare Turnstile → widget → Hostnames

**Supabase** → Authentication → URL Configuration → Redirect URLs: add `https://pure-vedic-gems-preview.<your-subdomain>.workers.dev/**` (www is already there).

After changing variables, trigger a new build (Deployments → Retry build) so `NEXT_PUBLIC_*` values are rebuilt.

## 4. Preview UAT (on the workers.dev URL)

Check `https://<preview>/api/health` returns `"status":"ok"` first; it lists any missing core variables.

- [ ] Home, `/gemstones`, a product page, `/blog`, `/knowledge`, cart
- [ ] Legacy URL: one `/product-category/...` and one `/shop/<slug>` → 301
- [ ] Customer sign-in (`/?auth=login`) → `/account`; email link / OAuth callback (`/auth/callback`)
- [ ] Admin sign-in + MFA → `/admin`
- [ ] Checkout: shipping form country/state dropdowns load
- [ ] Razorpay test payment → order confirmation page + order email (with ring-size guide attachment)
- [ ] PayGlocal UAT card payment → callback lands on preview, order marked paid
- [ ] Admin: upload a product image (goes to `cdn.purevedicgems.com`, the same bucket as production), then delete it; Excel import
- [ ] Admin: generate + send a recommendation PDF (Browser Rendering)
- [ ] Sanity: publish a change → page updates within a minute
- [ ] `/studio` loads
- [ ] Enquiry / contact form (Turnstile) → admin email arrives
- [ ] Ratna chat reply streams (if agent enabled)
- [ ] Sentry receives an event (Issues tab) from the preview env
- [ ] Workers → preview → Logs: no repeated errors

The cron runs only on production. To test the route by hand:
`curl -H "Authorization: Bearer <CRON_SECRET>" https://<preview>/api/cron/purge-product-trash`

## 5. Production go-live

1. Merge `cloudflare-workers` into `main` and push. Vercel keeps serving www and still builds fine.
2. The production Worker builds from `main`. Smoke-test `https://pure-vedic-gems.<your-subdomain>.workers.dev/api/health` and a few pages.
3. **Cutover (zero downtime, instant rollback)**, zone `purevedicgems.com`:
   1. SSL/TLS → Overview: mode **Full (strict)**.
   2. Worker `pure-vedic-gems` → Settings → Domains & Routes → Add **Route**: `www.purevedicgems.com/*`. (Inactive until the record is proxied.)
   3. Rules → Redirect Rules → create: when hostname equals `purevedicgems.com`, dynamic redirect to `concat("https://www.purevedicgems.com", http.request.uri.path)`, 301, preserve query string. (Vercel did this in its domain settings; there is no code for it.)
   4. DNS: switch the `www` and apex `@` records to **Proxied** (orange cloud). Keep their Vercel targets. This is the switch: www traffic now hits the Worker.
4. Verify on www: `curl -sI https://www.purevedicgems.com/ | findstr /i "x-opennext cf-ray"` shows both headers.
5. Webhooks keep their URLs (same domain). Confirm one of each arrives: Razorpay (`/api/webhooks/razorpay`), PayGlocal (`/api/webhooks/payglocal`, `/api/payment/payglocal/callback`), Sanity (`/api/webhooks/sanity`), WhatsApp (`/api/agent/whatsapp`).
6. Watch the first real order, Workers metrics/logs, and Sentry for 24h.
7. Next morning: Workers → `pure-vedic-gems` → Settings → Trigger events shows the 03:00 UTC cron ran (Logs show `GET /api/cron/purge-product-trash 200`).
8. Vercel → Settings → Cron Jobs → **Disable**, and Settings → Git → **Disconnect** (stops new Vercel builds). Do not delete the project yet.

## 6. Rollback (any time in the first 14 days)

1. DNS: switch `www` and `@` back to **DNS only** (grey cloud), or delete the Route. Traffic returns to Vercel within seconds.
2. Re-enable the Vercel cron and reconnect Git if you changed them.

## 7. After 14 quiet days

- Delete the Vercel project.
- Delete `vercel.json` from the repo.
- Optionally switch `www` from Route to a Worker Custom Domain and remove the Vercel DNS targets.

## Known differences from Vercel

- Rate limiting stays in-memory per isolate, the same limitation as on Vercel.
- Sentry source maps are not uploaded for Workers builds; errors still report, with minified stack traces.
- Next.js middleware (`src/proxy.ts`) runs on OpenNext's Node middleware support, which OpenNext marks experimental. It passed local tests; watch logs after go-live.
- Request bodies up to 100 MB (Vercel capped at 4.5 MB), so large uploads now work.
- `/api/health` reports `version: local` because no commit SHA is exposed at runtime; use Workers → Deployments to see the version.
