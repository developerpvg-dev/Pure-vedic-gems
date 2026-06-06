/**
 * Service-role Supabase client for the legacy import pipeline.
 *
 * SECURITY:
 *   - Service-role key MUST never be loaded into a browser bundle. This module
 *     deliberately lives under `scripts/` (Node-only) and is not imported from
 *     any file under `src/`.
 *   - When `--write` is set, the client refuses to start if SUPABASE_URL
 *     resolves to a known production host. The production host list is
 *     configured via PROD_SUPABASE_HOSTS env (comma-separated) so the guard is
 *     enforceable in CI without hard-coding project IDs in the repo.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface LegacyImportClientOptions {
  /** Whether the caller intends to write. Triggers the production-host guard. */
  write: boolean;
}

let cached: SupabaseClient | null = null;

export function getServiceRoleClient(opts: LegacyImportClientOptions): SupabaseClient {
  if (cached) return cached;

  // Use dedicated import-pipeline env vars so the running Next.js app's
  // SUPABASE_SERVICE_ROLE_KEY (which points at production) is never reused
  // by this script. Falls back to the generic names for CI flexibility.
  const url = process.env.LEGACY_IMPORT_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing LEGACY_IMPORT_SUPABASE_URL or LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY in env.',
    );
  }

  if (opts.write) {
    const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    const host = new URL(url).host.toLowerCase();
    if (prodHosts.some((p) => host === p.toLowerCase())) {
      throw new Error(
        `Refusing to run --write against production host "${host}". ` +
          'Point SUPABASE_URL at the staging project, or remove the host from PROD_SUPABASE_HOSTS once promotion is approved.',
      );
    }
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
    global: { headers: { 'x-pvg-legacy-import': '1' } },
  });
  return cached;
}

/** Parse common `--dry-run` / `--write` flags. `--dry-run` is the default. */
export function parseRunMode(argv: string[]): { write: boolean } {
  const hasWrite = argv.includes('--write');
  const hasDryRun = argv.includes('--dry-run');
  if (hasWrite && hasDryRun) {
    throw new Error('Pass either --dry-run or --write, not both.');
  }
  return { write: hasWrite };
}
