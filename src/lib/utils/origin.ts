/** Name/origin hints used when `products.origin` is empty (common on imports). */
const NAME_ORIGIN_HINTS: { value: string; nameTokens: string[] }[] = [
  { value: 'Mozambique', nameTokens: ['mozambique'] },
  { value: 'Madagascar', nameTokens: ['madagascar', 'madagascan'] },
  { value: 'Burma', nameTokens: ['burma', 'burmese', 'myanmar'] },
  { value: 'Ceylon', nameTokens: ['ceylon', 'ceylonese', 'sri lanka'] },
  { value: 'Kashmir', nameTokens: ['kashmir'] },
  { value: 'Thailand', nameTokens: ['thailand', 'thai'] },
  { value: 'Colombia', nameTokens: ['colombia', 'colombian'] },
  { value: 'Zambia', nameTokens: ['zambia', 'zambian'] },
  { value: 'Tanzania', nameTokens: ['tanzania', 'tanzanian'] },
  { value: 'Ethiopia', nameTokens: ['ethiopia', 'ethiopian'] },
  { value: 'Brazil', nameTokens: ['brazil', 'brazilian'] },
  { value: 'Nepal', nameTokens: ['nepal', 'nepali'] },
  { value: 'Indonesia', nameTokens: ['indonesia', 'indonesian', 'java'] },
  { value: 'Africa', nameTokens: ['african', 'africa'] },
  { value: 'Australia', nameTokens: ['australia', 'australian'] },
  { value: 'Afghanistan', nameTokens: ['afghanistan', 'afghan'] },
  { value: 'Russia', nameTokens: ['russia', 'russian'] },
];

function extractOriginFromName(name?: string | null): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const hint of NAME_ORIGIN_HINTS) {
    if (hint.nameTokens.some((token) => lower.includes(token))) return hint.value;
  }
  return null;
}

/** Prefer stored origin; fall back to a country/region word in the product name. */
export function resolveOrigin(origin?: string | null, name?: string | null): string | null {
  const stored = origin?.trim();
  if (stored) return stored;
  return extractOriginFromName(name);
}

/** Supabase `.or()` clauses so name-inferred countries still filter. */
export function originFilterClauses(origin: string): string[] {
  const value = origin.trim();
  if (!value) return [];

  const clauses = new Set<string>([`origin.eq.${value}`, `origin.ilike.%${value}%`]);
  const hint = NAME_ORIGIN_HINTS.find((entry) => entry.value.toLowerCase() === value.toLowerCase());
  for (const token of hint?.nameTokens ?? [value.toLowerCase()]) {
    clauses.add(`name.ilike.%${token}%`);
  }
  return [...clauses];
}
