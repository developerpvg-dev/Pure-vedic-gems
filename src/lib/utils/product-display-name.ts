/** Legacy import titles often embed per-carat pricing, e.g. "@2200 per. ct." */
const LEGACY_PRICE_IN_NAME =
  /@\s*[\d,]+(?:\.\d+)?\s*(?:per\s*\.?\s*ct|perct)\.?\s*/gi;

const GRADE_SUFFIX_IN_NAME =
  /\s*\((Economy|Good|Premium|Best|Super Premium|Luxury|Laxury|Luxary|Super Luxury|Super Laxury|Super Luxary|Collector)\)\s*$/i;

export function formatProductDisplayName(name: string | null | undefined): string {
  if (!name) return '';

  return name
    .replace(LEGACY_PRICE_IN_NAME, '')
    .replace(/([^\s])\(/g, '$1 (')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Remove trailing grade tier from a display name when the tier is shown separately. */
export function stripProductGradeFromName(name: string): string {
  return name.replace(GRADE_SUFFIX_IN_NAME, '').trim();
}
