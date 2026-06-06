/**
 * SKU / slug / permalink resolution. Slugs are preserved verbatim from legacy
 * (decision: SEO continuity). Only collisions trigger a `-N` suffix and
 * a warning.
 *
 * PR-3 implements.
 */

export interface IdentifierInputs {
  legacyWooId: number;
  legacySlug: string;
  legacySku?: string | null;
  /** Async predicate that returns true if a slug is already taken by a
   *  different `legacy_woo_id` in stg_navratna_products. */
  isSlugTaken: (slug: string, exceptLegacyId: number) => Promise<boolean>;
}

export interface IdentifierResult {
  sku: string;          // never null; falls back to PVG-LEG-{legacyWooId}
  legacySku: string | null;
  slug: string;         // legacy slug verbatim, with -N suffix only on collision
  warnings: string[];
}

export async function resolveIdentifiers(input: IdentifierInputs): Promise<IdentifierResult> {
  const warnings: string[] = [];

  const legacySku = input.legacySku && input.legacySku.trim() !== '' ? input.legacySku.trim() : null;
  const sku = legacySku ?? `PVG-LEG-${input.legacyWooId}`;
  if (!legacySku) warnings.push(`no legacy SKU; assigned ${sku}`);

  let slug = (input.legacySlug || '').toLowerCase().trim();
  if (!slug) {
    slug = `pvg-leg-${input.legacyWooId}`;
    warnings.push(`empty legacy slug; assigned ${slug}`);
  }

  let candidate = slug;
  let suffix = 2;
  while (await input.isSlugTaken(candidate, input.legacyWooId)) {
    candidate = `${slug}-${suffix}`;
    suffix++;
    if (suffix > 50) {
      warnings.push(`slug collision exhausted (>50 attempts) for ${slug}`);
      break;
    }
  }
  if (candidate !== slug) warnings.push(`slug collision: rewrote ${slug} -> ${candidate}`);

  return { sku, legacySku, slug: candidate, warnings };
}
