# PureVedicGems

Next.js storefront and operations platform for PureVedicGems.

## Local Setup

1. Install dependencies:

```bash
npm ci
```

2. Create local environment values:

```bash
cp .env.example .env.local
```

3. Fill the required Supabase values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Start the app:

```bash
npm run dev
```

## Foundation Checks

Run these before shipping infrastructure or security changes:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The combined CI-equivalent command is:

```bash
npm run ci
```

## Week 13 QA And Launch Hardening

Fast checks:

```bash
npm run test
npm run test:smoke
npm run test:a11y
npm run test:perf
```

`npm run test:e2e` builds a fresh production app, starts `next start`, and runs Chromium plus mobile-browser route checks. Use `PLAYWRIGHT_PORT=3101` if port `3001` is already busy. In CI, `PLAYWRIGHT_SKIP_BUILD=1` reuses the already-created production build before the Playwright suite starts.

The browser suite currently covers public route smoke checks, `/api/health`, serious/critical axe accessibility issues, and route performance budgets for homepage, shop, checkout, and policy pages.

## Health, Security, And Incident Checks

Use `/api/health` for uptime monitoring. It returns no secret values; it reports whether required and optional service groups are configured and responds with `503` only when launch-critical public Supabase configuration is missing.

Security hardening includes centralized rate-limit tests, search/recommendation rate limits, CSP/permission headers in `next.config.ts`, GitHub dependency review, npm audit reporting, and magic-byte validation for custom-design uploads.

Incident triage flow:

1. Check `/api/health` and the Vercel deployment status.
2. Check Sentry for server/client errors around the incident window.
3. Run `npm run test:smoke` against preview/staging for route regressions.
4. Run `npm run test:a11y` and `npm run test:perf` before approving visual or layout fixes.
5. Roll back to the previous Vercel deployment if checkout, payment, admin login, or product pages are critically broken.

## Supabase Foundation

Run SQL files in this order for a fresh or repaired Supabase project:

1. `supabase/schema.sql`
2. `supabase/fix_team_members_rls.sql`
3. `supabase/migration_gem_categories_metals.sql`
4. `supabase/create_storage_buckets.sql`
5. Remaining additive migration or seed files in `supabase/`

Public storefront reads must use the anon/RLS-aware Supabase client from `src/lib/supabase/public.ts`. The service-role client in `src/lib/supabase/admin.ts` is reserved for authenticated server-side admin, payment, webhook, and trusted backend flows only.

## CI Secrets

The GitHub Actions workflow expects these repository secrets for a production-like build:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SANITY_PROJECT_ID
SANITY_API_TOKEN
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
RESEND_API_KEY
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
```

`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SANITY_DATASET` can be stored as repository variables.

## Security Headers And Monitoring

Security headers are configured in `next.config.ts`, including CSP, frame protection, content-type protection, referrer policy, permissions policy, and production HSTS.

Sentry is wired through `src/instrumentation.ts`, `src/instrumentation-client.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`. It remains disabled unless the corresponding Sentry DSN environment variables are present.
