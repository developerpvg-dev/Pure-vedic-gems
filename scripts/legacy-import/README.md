# Legacy Import — PureVedicGems

Read this **before** running anything in this folder.

## What lives here

A self-contained, idempotent pipeline that migrates data from the legacy
WordPress / WooCommerce databases into the current Supabase + Next.js platform.
Phase 1 covers **Navratna products only** (`scripts/legacy-import/navratna/`).
Future phases (Upratna, Rudraksha, Jewellery, Idols, Mala, Orders, Customers,
Content) will land as sibling folders and reuse `lib/`.

The plan and decisions for this work are in
[NAVRATNAS_MIGRATION_PLAN.md](../../../NAVRATNAS_MIGRATION_PLAN.md) at the repo
root. **Do not run any `--write` step until the plan's "Decisions Needed"
section is fully resolved.**

## Folder layout

```
scripts/legacy-import/
  README.md                  ← you are here
  lib/
    supabase.ts              ← service-role Supabase client (env-gated)
    wp-sql.ts                ← streaming reader for selected tables from the WP SQL dump
    transform/
      categories.ts          ← legacy category → canonical mapping (Navratna)
      attributes.ts          ← option-string parser (Certificate / Energization / Metal / Size / …)
      seo.ts                 ← AIOSEO / Yoast → meta_title / meta_description / canonical_url
      content.ts             ← legacy HTML → sanitised clean_description
      pricing.ts             ← regular / sale / per-carat / quote normalisation
      identifiers.ts         ← SKU, slug, permalink, tag_number resolution
  navratna/
    01-extract.ts            ← SQL dump → /scripts/legacy-import/_raw/navratna/*.json
    02-stage.ts              ← JSON → Supabase  legacy_import.stg_wp_*
    03-transform.ts          ← stg_wp_* → legacy_import.stg_navratna_products
    04-media.ts              ← download → WebP → upload → stg_media_url_map
    05-dryrun.ts             ← diff + warning report → stg_dryrun_reports
    06-upsert.ts             ← idempotent upsert into public.products etc.
    07-verify.ts             ← post-write verification gates G1..G8
  _raw/                      ← gitignored. Local cache only. Never committed.
```

## Hard rules

These are non-negotiable. CI lints will eventually enforce them.

1. **Staging schema is `legacy_import`.** Never write to `public.*` from any
   script except `06-upsert.ts`, and only after `05-dryrun.ts` has run cleanly
   for the same batch label.
2. **Every script supports `--dry-run` and `--write`.** `--dry-run` is the
   default. `--write` requires `IMPORT_BATCH_ID` set in the environment.
3. **Idempotent.** Re-running any step with the same input must converge to the
   same output. Upserts key on `legacy_woo_id`. No script ever does a blind
   `INSERT` that can duplicate a row.
4. **Raw legacy payload is preserved.** Every transformed row carries the
   original meta in `legacy_data` / `legacy_seo`. We never throw source data
   away.
5. **No CSV → final table shortcut.** The Woo CSV is for reconciliation only,
   not the source of truth. Source of truth is the SQL dump.
6. **No live-site hot-linking.** Images and certificates are downloaded to the
   local cache, hashed, deduped, converted to WebP, and uploaded to Supabase
   Storage before any product row points at them.
7. **No PII in product `legacy_data`.** Woo product meta should be PII-free;
   the transform asserts this and refuses to write rows that fail the check.
8. **Rollback is one query per table.** Every written row carries
   `import_batch_id`. See `06-upsert.ts` for the matching `DELETE` block.

## Environment

The runnable scripts use TypeScript and execute via [tsx][tsx]. Install it as a
dev dependency before PR-2 lands:

```bash
npm i -D tsx
```

Required environment variables (loaded from `.env.local` by default — the same
file Next.js uses):

| Var                                | Required by         | Notes                                                                 |
| ---------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `SUPABASE_URL`                     | every step except 01 | Staging project URL. **Never** point at production during PR-2…PR-6. |
| `SUPABASE_SERVICE_ROLE_KEY`        | every step except 01 | Service-role key. Treat as secret. Not loaded into the browser bundle. |
| `LEGACY_SQL_DUMP_PATH`             | 01                  | Absolute path to `pugemved_indb.sql`.                                  |
| `LEGACY_MEDIA_BASE_URL`            | 04                  | e.g. `https://www.purevedicgems.com/wp-content/uploads/`               |
| `IMPORT_BATCH_ID`                  | every `--write` run | UUID. Generated once per batch, recorded in `import_batches`.          |

The scripts must never log secrets and must refuse to start if
`SUPABASE_URL` resolves to the production project while `--write` is set.
That guard lives in `lib/supabase.ts`.

## Standard run sequence (Phase 1)

```bash
# 1. apply the staging schema (one-time per environment)
psql "$SUPABASE_DB_URL" -f supabase/navratna_phase1_staging.sql

# 2. extract Navratna slice from the SQL dump to local JSON
npx tsx scripts/legacy-import/navratna/01-extract.ts

# 3. stage into Supabase legacy_import schema
npx tsx scripts/legacy-import/navratna/02-stage.ts --write

# 4. transform into stg_navratna_products
npx tsx scripts/legacy-import/navratna/03-transform.ts --write

# 5. download + upload media
npx tsx scripts/legacy-import/navratna/04-media.ts --write

# 6. dry-run report. Review before promoting.
npx tsx scripts/legacy-import/navratna/05-dryrun.ts

# 7. promote to public schema (requires sign-off + IMPORT_BATCH_ID)
IMPORT_BATCH_ID=$(uuidgen) npx tsx scripts/legacy-import/navratna/06-upsert.ts --write

# 8. verify
npx tsx scripts/legacy-import/navratna/07-verify.ts
```

## Rollback

```sql
-- replace :batch with the UUID from import_batches
DELETE FROM product_redirect_sources         WHERE import_batch_id = :batch;
DELETE FROM product_option_rules             WHERE import_batch_id = :batch;
DELETE FROM product_category_assignments
       WHERE product_id IN (SELECT id FROM products WHERE import_batch_id = :batch);
DELETE FROM products                         WHERE import_batch_id = :batch;
UPDATE import_batches SET rolled_back_at = NOW(), rolled_back_reason = :reason
       WHERE id = :batch;
```

Storage objects under `navratna/` are left in place for forensic review; a
separate cleanup script will remove them only after a successful re-run.

[tsx]: https://github.com/privatenumber/tsx
