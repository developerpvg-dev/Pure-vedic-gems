/**
 * Legacy WooCommerce pa_pooja-energization option parsing and slug matching.
 */

export const ENERGIZATION_LEGACY_SLUGS = {
  SKIP: 'no-energization',
  PRANA_PRATISHTA: 'prana-pratishta-pooja',
  PRANA_LIVE: 'prana-pratishta-live-streaming',
  PRANA_VIDEO: 'prana-pratishta-with-video',
  VEDIC: 'vedic-pooja',
  VEDIC_VIDEO: 'vedic-pooja-with-video',
} as const;

export type EnergizationLegacySlug =
  (typeof ENERGIZATION_LEGACY_SLUGS)[keyof typeof ENERGIZATION_LEGACY_SLUGS];

export type LegacyEnergizationOptionKind = 'skip' | 'option' | 'unknown';

export interface ParsedLegacyEnergizationOption {
  kind: LegacyEnergizationOptionKind;
  legacySlug: EnergizationLegacySlug | null;
  raw: string;
  priceInr: number | null;
}

export interface LegacyEnergizationOptionDefinition {
  legacy_slug: EnergizationLegacySlug;
  name: string;
  description: string;
  price: number;
  duration: string;
  includes: string[];
  includes_video: boolean;
  sort_order: number;
}

export const LEGACY_ENERGIZATION_OPTIONS: LegacyEnergizationOptionDefinition[] = [
  {
    legacy_slug: ENERGIZATION_LEGACY_SLUGS.PRANA_PRATISHTA,
    name: 'Prana Pratishta Pooja',
    description: 'Traditional Vedic prana pratishta ceremony to activate the gemstone.',
    price: 2100,
    duration: '2 hours',
    includes: ['Prana pratishta ritual', 'Vedic mantra chanting', 'Gemstone energization'],
    includes_video: false,
    sort_order: 1,
  },
  {
    legacy_slug: ENERGIZATION_LEGACY_SLUGS.PRANA_LIVE,
    name: 'Prana Pratishta Pooja (Live Streaming)',
    description: 'Prana pratishta ceremony with live streaming so you can attend remotely.',
    price: 3500,
    duration: '2 hours',
    includes: ['Prana pratishta ritual', 'Live streaming access', 'Vedic mantra chanting'],
    includes_video: false,
    sort_order: 2,
  },
  {
    legacy_slug: ENERGIZATION_LEGACY_SLUGS.PRANA_VIDEO,
    name: 'Prana Pratishta Pooja (With Video)',
    description: 'Prana pratishta ceremony with recorded video documentation.',
    price: 3100,
    duration: '2 hours',
    includes: ['Prana pratishta ritual', 'Recorded video', 'Vedic mantra chanting'],
    includes_video: true,
    sort_order: 3,
  },
  {
    legacy_slug: ENERGIZATION_LEGACY_SLUGS.VEDIC,
    name: 'Vedic Pooja',
    description: 'Classical Vedic pooja for gemstone purification and blessing.',
    price: 1100,
    duration: '1 hour',
    includes: ['Vedic pooja ceremony', 'Mantra chanting', 'Energization blessing'],
    includes_video: false,
    sort_order: 4,
  },
  {
    legacy_slug: ENERGIZATION_LEGACY_SLUGS.VEDIC_VIDEO,
    name: 'Vedic Pooja (With Video)',
    description: 'Vedic pooja with recorded video of the complete ceremony.',
    price: 2100,
    duration: '1 hour',
    includes: ['Vedic pooja ceremony', 'Recorded video', 'Mantra chanting'],
    includes_video: true,
    sort_order: 5,
  },
];

/** Default paid energization options for gemstone configurators when Woo export has no explicit list. */
export const DEFAULT_GEMSTONE_ENERGIZATION_SLUGS: EnergizationLegacySlug[] =
  LEGACY_ENERGIZATION_OPTIONS.map((option) => option.legacy_slug);

function normalizeOptionText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

export function parseLegacyEnergizationPrice(raw: string): number | null {
  const text = raw.replace(/\\/g, '');
  const rsMatch =
    text.match(/\+?\s*Rs\.?\s*([\d,]+(?:\.\d+)?)/i) ??
    text.match(/\+\s*([\d,]+(?:\.\d+)?)\s*RS\b/i);
  if (!rsMatch) return null;
  const value = Number(rsMatch[1].replace(/,/g, ''));
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function classifyLegacyEnergizationOption(raw: string): ParsedLegacyEnergizationOption {
  const text = normalizeOptionText(raw);
  const lower = text.toLowerCase();
  const priceInr = parseLegacyEnergizationPrice(text);

  if (!text) {
    return { kind: 'unknown', legacySlug: null, raw, priceInr };
  }

  if (/^no\s*energiz/i.test(lower)) {
    return { kind: 'skip', legacySlug: ENERGIZATION_LEGACY_SLUGS.SKIP, raw: text, priceInr: 0 };
  }

  if (/prana\s*pratishta.*live\s*stream/i.test(lower)) {
    return {
      kind: 'option',
      legacySlug: ENERGIZATION_LEGACY_SLUGS.PRANA_LIVE,
      raw: text,
      priceInr,
    };
  }

  if (/prana\s*pratishta.*with\s*video/i.test(lower)) {
    return {
      kind: 'option',
      legacySlug: ENERGIZATION_LEGACY_SLUGS.PRANA_VIDEO,
      raw: text,
      priceInr,
    };
  }

  if (/prana\s*pratishta/i.test(lower)) {
    return {
      kind: 'option',
      legacySlug: ENERGIZATION_LEGACY_SLUGS.PRANA_PRATISHTA,
      raw: text,
      priceInr,
    };
  }

  if (/vedic\s*pooja.*with\s*video/i.test(lower)) {
    return {
      kind: 'option',
      legacySlug: ENERGIZATION_LEGACY_SLUGS.VEDIC_VIDEO,
      raw: text,
      priceInr,
    };
  }

  if (/vedic\s*pooja/i.test(lower)) {
    return {
      kind: 'option',
      legacySlug: ENERGIZATION_LEGACY_SLUGS.VEDIC,
      raw: text,
      priceInr,
    };
  }

  return { kind: 'unknown', legacySlug: null, raw: text, priceInr };
}

export function splitLegacyEnergizationValues(raw: string | null | undefined): string[] {
  if (!raw) return [];

  const normalized = raw.replace(/\|/g, ',');
  const parts = normalized.split(
    /,\s*(?=(?:No Energization|Prana Pratishta|Vedic Pooja)\b)/i
  );

  return parts.map((part) => normalizeOptionText(part)).filter(Boolean);
}

export function parseLegacyEnergizationOptions(raw: string | null | undefined): ParsedLegacyEnergizationOption[] {
  return splitLegacyEnergizationValues(raw).map(classifyLegacyEnergizationOption);
}

export function legacySlugsFromParsedEnergizationOptions(
  options: ParsedLegacyEnergizationOption[]
): EnergizationLegacySlug[] {
  const slugs = new Set<EnergizationLegacySlug>();
  for (const option of options) {
    if (option.kind === 'option' && option.legacySlug) {
      slugs.add(option.legacySlug);
    }
  }
  return [...slugs];
}

export function shouldDisableEnergizationAddons(args: {
  category?: string | null;
  product_type?: string | null;
  configurator_enabled?: boolean | null;
  energization_eligible?: boolean | null;
}): boolean {
  const category = (args.category ?? '').toLowerCase();
  const productType = (args.product_type ?? '').toLowerCase();

  if (['jewellery', 'jewelry', 'idols', 'idol'].includes(category)) {
    return true;
  }
  if (['jewellery', 'jewelry', 'idol'].includes(productType)) {
    return true;
  }
  if (args.configurator_enabled === false) {
    return true;
  }
  if (
    ['idols', 'idol', 'rudraksha', 'spiritual', 'spiritual-idols'].includes(category) &&
    args.energization_eligible === false
  ) {
    return true;
  }
  return false;
}
