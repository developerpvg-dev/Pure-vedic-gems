/** Legacy import titles often embed per-carat pricing, e.g. "@2200 per. ct." */
const LEGACY_PRICE_IN_NAME =
  /@\s*[\d,]+(?:\.\d+)?\s*(?:per\s*\.?\s*ct|perct)\.?\s*/gi;

export function formatProductDisplayName(name: string | null | undefined): string {
  if (!name) return '';

  return name
    .replace(LEGACY_PRICE_IN_NAME, '')
    .replace(/([^\s])\(/g, '$1 (')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
