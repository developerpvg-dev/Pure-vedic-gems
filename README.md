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
npm run build
```

The combined CI-equivalent command is:

```bash
npm run ci
```

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
