/**
 * Backfill products.certificate_lab from description / certification / cert number
 * when the structured lab field is empty (legacy imports often left it null).
 *
 * Dry-run:  npx tsx scripts/db/backfill-certificate-labs.ts
 * Write:    npx tsx scripts/db/backfill-certificate-labs.ts --write
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inferCertificateLab } from '../../src/lib/constants/trust-credentials';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

function loadEnv() {
  const raw = readFileSync(resolve(repoRoot, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

function isBlankLab(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  return /^(none|n\/a|na|nil|-)$/i.test(value.trim());
}

async function main() {
  loadEnv();
  const write = process.argv.includes('--write');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  const pageSize = 500;
  let offset = 0;
  let scanned = 0;
  let wouldUpdate = 0;
  let updated = 0;
  const counts = new Map<string, number>();
  const samples: Array<{ sku: string; lab: string }> = [];

  for (;;) {
    const res = await fetch(
      `${url}/rest/v1/products?is_active=eq.true&select=id,sku,certificate_lab,certification,certificate_number,description,clean_description&order=id.asc&limit=${pageSize}&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`fetch failed: ${res.status} ${await res.text()}`);
    const rows = (await res.json()) as Array<{
      id: string;
      sku: string | null;
      certificate_lab: string | null;
      certification: string | null;
      certificate_number: string | null;
      description: string | null;
      clean_description: string | null;
    }>;
    if (!rows.length) break;

    for (const row of rows) {
      scanned += 1;
      if (!isBlankLab(row.certificate_lab)) continue;

      const lab = inferCertificateLab(
        row.certification,
        row.certificate_number,
        row.description,
        row.clean_description,
      );
      if (!lab) continue;

      wouldUpdate += 1;
      counts.set(lab, (counts.get(lab) ?? 0) + 1);
      if (samples.length < 12) samples.push({ sku: row.sku ?? row.id, lab });

      if (write) {
        const patch: Record<string, string> = { certificate_lab: lab };
        if (isBlankLab(row.certification)) patch.certification = lab;
        const patchRes = await fetch(`${url}/rest/v1/products?id=eq.${row.id}`, {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify(patch),
        });
        if (!patchRes.ok) {
          throw new Error(`patch ${row.sku}: ${patchRes.status} ${await patchRes.text()}`);
        }
        updated += 1;
      }
    }

    offset += rows.length;
    if (rows.length < pageSize) break;
    process.stdout.write(`scanned ${scanned}…\r`);
  }

  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        scanned,
        wouldUpdate,
        updated,
        counts: Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1])),
        samples,
      },
      null,
      2,
    ),
  );
  if (!write) console.log('\nRe-run with --write to apply.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
