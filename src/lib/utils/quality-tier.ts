import { QUALITY_TIERS } from '@/lib/constants/product-taxonomy';

export type QualityTier = (typeof QUALITY_TIERS)[number];

const CANONICAL_LOOKUP = new Map(QUALITY_TIERS.map((tier) => [tier.toLowerCase(), tier]));

/** Legacy import labels and typos mapped to canonical shop grade tiers. */
const RAW_TO_TIER: Record<string, QualityTier> = {
  economy: 'Economy',
  good: 'Good',
  premium: 'Premium',
  best: 'Premium',
  'super premium': 'Super Luxury',
  luxury: 'Luxury',
  laxury: 'Luxury',
  luxary: 'Luxury',
  'super luxury': 'Super Luxury',
  'super laxury': 'Super Luxury',
  'super luxary': 'Super Luxury',
  collector: 'Collector',
};

function titleCaseWords(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeRawTier(raw?: string | null): QualityTier | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return RAW_TO_TIER[key] ?? CANONICAL_LOOKUP.get(key) ?? null;
}

function extractTierFromName(name?: string | null): QualityTier | null {
  if (!name) return null;

  const trailing = name.match(/\(([^)]+)\)\s*$/);
  if (trailing) {
    const resolved = normalizeRawTier(trailing[1]);
    if (resolved) return resolved;
  }

  const inline = name.match(
    /\((Economy|Good|Premium|Best|Luxury|Laxury|Super Luxury|Super Laxury|Super Premium|Collector)\)/i,
  );
  if (inline) return normalizeRawTier(inline[1]);

  return null;
}

/** Resolve the commercial grade tier used for shop filters. */
export function resolveQualityTier(
  qualityLabel?: string | null,
  name?: string | null,
): QualityTier | null {
  return normalizeRawTier(qualityLabel) ?? extractTierFromName(name);
}

/** Raw `quality_label` values that should match a canonical tier filter. */
export function qualityTierFilterLabels(tier: QualityTier): string[] {
  const labels = new Set<string>([tier]);

  for (const [raw, mapped] of Object.entries(RAW_TO_TIER)) {
    if (mapped !== tier) continue;
    labels.add(raw);
    labels.add(titleCaseWords(raw));
  }

  return [...labels];
}

export function isCanonicalQualityTier(value: string): value is QualityTier {
  return CANONICAL_LOOKUP.has(value.toLowerCase());
}

/** Storefront grade labels — includes Super Premium (legacy import tier). */
const GRADE_LABELS = [
  'Economy',
  'Good',
  'Premium',
  'Super Premium',
  'Luxury',
  'Super Luxury',
  'Collector',
] as const;

const GRADE_LABEL_LOOKUP = new Map(GRADE_LABELS.map((label) => [label.toLowerCase(), label]));

const GRADE_ALIASES: Record<string, (typeof GRADE_LABELS)[number]> = {
  economy: 'Economy',
  good: 'Good',
  premium: 'Premium',
  best: 'Premium',
  'super premium': 'Super Premium',
  luxury: 'Luxury',
  laxury: 'Luxury',
  luxary: 'Luxury',
  'super luxury': 'Super Luxury',
  'super laxury': 'Super Luxury',
  'super luxary': 'Super Luxury',
  collector: 'Collector',
};

const GRADE_IN_NAME =
  /\((Economy|Good|Premium|Best|Super Premium|Luxury|Laxury|Luxary|Super Luxury|Super Laxury|Super Luxary|Collector)\)/i;

function normalizeGradeLabel(raw?: string | null): (typeof GRADE_LABELS)[number] | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return GRADE_ALIASES[key] ?? GRADE_LABEL_LOOKUP.get(key) ?? null;
}

/** Resolve the commercial grade shown on product cards (Economy, Premium, Super Premium, etc.). */
export function resolveProductGradeLabel(
  qualityLabel?: string | null,
  name?: string | null,
): (typeof GRADE_LABELS)[number] | null {
  const fromLabel = normalizeGradeLabel(qualityLabel);
  if (fromLabel) return fromLabel;

  if (!name) return null;

  const trailing = name.match(/\(([^)]+)\)\s*$/);
  if (trailing) {
    const resolved = normalizeGradeLabel(trailing[1]);
    if (resolved) return resolved;
  }

  const inline = name.match(GRADE_IN_NAME);
  if (inline) return normalizeGradeLabel(inline[1]);

  return null;
}
