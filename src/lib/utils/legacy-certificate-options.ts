/**
 * Legacy WooCommerce pa_certificate option parsing and lab slug matching.
 */

export const CERT_LAB_LEGACY_SLUGS = {
  FREE: 'free-lab-certificate',
  GTL_JAIPUR: 'gtl-jaipur',
  IGI: 'igi',
  IGI_GTL_DELHI: 'igi-gtl-delhi',
  IGI_INTERNATIONAL: 'igi-international',
} as const;

export type CertLabLegacySlug = (typeof CERT_LAB_LEGACY_SLUGS)[keyof typeof CERT_LAB_LEGACY_SLUGS];

export type LegacyCertificateOptionKind =
  | 'skip'
  | 'already_certified'
  | 'lab'
  | 'unknown';

export interface ParsedLegacyCertificateOption {
  kind: LegacyCertificateOptionKind;
  legacySlug: CertLabLegacySlug | null;
  raw: string;
  priceInr: number | null;
  turnaroundDays: number | null;
}

export interface LegacyCertificateLabDefinition {
  legacy_slug: CertLabLegacySlug;
  name: string;
  full_name: string;
  extra_charge: number;
  turnaround_days: number;
  is_default: boolean;
  sort_order: number;
}

export const LEGACY_CERTIFICATION_LABS: LegacyCertificateLabDefinition[] = [
  {
    legacy_slug: CERT_LAB_LEGACY_SLUGS.FREE,
    name: 'Free Lab',
    full_name: 'Free Lab Certificate',
    extra_charge: 0,
    turnaround_days: 3,
    is_default: false,
    sort_order: 1,
  },
  {
    legacy_slug: CERT_LAB_LEGACY_SLUGS.GTL_JAIPUR,
    name: 'GTL Jaipur',
    full_name: 'Lab Certificate - GTL Jaipur (+3 Days)',
    extra_charge: 1200,
    turnaround_days: 3,
    is_default: true,
    sort_order: 2,
  },
  {
    legacy_slug: CERT_LAB_LEGACY_SLUGS.IGI,
    name: 'IGI',
    full_name: 'Lab Certificate - IGI (+2 Days)',
    extra_charge: 4000,
    turnaround_days: 2,
    is_default: false,
    sort_order: 3,
  },
  {
    legacy_slug: CERT_LAB_LEGACY_SLUGS.IGI_GTL_DELHI,
    name: 'IGI-GTL Delhi',
    full_name: 'Certificate From IGI-GTL (DELHI) +20 DAYS+700 RS',
    extra_charge: 700,
    turnaround_days: 20,
    is_default: false,
    sort_order: 4,
  },
  {
    legacy_slug: CERT_LAB_LEGACY_SLUGS.IGI_INTERNATIONAL,
    name: 'IGI Intl',
    full_name: 'Certificate From IGI (International) +25 Days +3500 Rs',
    extra_charge: 3500,
    turnaround_days: 25,
    is_default: false,
    sort_order: 5,
  },
];

/** Default paid labs for gemstone configurators when Woo export has no explicit list. */
export const DEFAULT_GEMSTONE_CERT_LAB_SLUGS: CertLabLegacySlug[] = [
  CERT_LAB_LEGACY_SLUGS.FREE,
  CERT_LAB_LEGACY_SLUGS.GTL_JAIPUR,
  CERT_LAB_LEGACY_SLUGS.IGI,
  CERT_LAB_LEGACY_SLUGS.IGI_GTL_DELHI,
];

function normalizeOptionText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

export function parseLegacyCertificatePrice(raw: string): number | null {
  const lakhMatch = raw.match(/(\d+(?:\.\d+)?)\s*lakh/i);
  if (lakhMatch) {
    const value = Number(lakhMatch[1]) * 100_000;
    return Number.isFinite(value) ? Math.round(value) : null;
  }

  const rsMatch =
    raw.match(/\+?\s*Rs\.?\s*([\d,]+(?:\.\d+)?)/i) ??
    raw.match(/\+\s*([\d,]+(?:\.\d+)?)\s*RS\b/i) ??
    raw.match(/\+\s*([\d,]+(?:\.\d+)?)\s*Rs/i);
  if (!rsMatch) return null;
  const value = Number(rsMatch[1].replace(/,/g, ''));
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function parseLegacyCertificateTurnaroundDays(raw: string): number | null {
  const parenMatch = raw.match(/\(\s*\+?\s*(\d+)\s*Days?\s*\)/i);
  if (parenMatch) {
    const value = Number(parenMatch[1]);
    return Number.isFinite(value) ? value : null;
  }

  const compactMatch = raw.match(/\+?\s*(\d+)\s*DAYS?/i);
  if (compactMatch) {
    const value = Number(compactMatch[1]);
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

export function classifyLegacyCertificateOption(raw: string): ParsedLegacyCertificateOption {
  const text = normalizeOptionText(raw);
  const lower = text.toLowerCase();

  const priceInr = parseLegacyCertificatePrice(text);
  const turnaroundDays = parseLegacyCertificateTurnaroundDays(text);

  if (!text) {
    return { kind: 'unknown', legacySlug: null, raw, priceInr, turnaroundDays };
  }

  if (/without\s*certificate/.test(lower)) {
    return { kind: 'skip', legacySlug: null, raw: text, priceInr: 0, turnaroundDays };
  }

  if (/already\s*certif|allready\s*certif/.test(lower)) {
    return { kind: 'already_certified', legacySlug: null, raw: text, priceInr: 0, turnaroundDays };
  }

  if (/free\s*lab\s*certificate/.test(lower)) {
    return {
      kind: 'lab',
      legacySlug: CERT_LAB_LEGACY_SLUGS.FREE,
      raw: text,
      priceInr: 0,
      turnaroundDays,
    };
  }

  if (/gtl\s*jaipur|lab certificate - gtl/.test(lower)) {
    return {
      kind: 'lab',
      legacySlug: CERT_LAB_LEGACY_SLUGS.GTL_JAIPUR,
      raw: text,
      priceInr,
      turnaroundDays,
    };
  }

  if (/international|internayional/.test(lower)) {
    return {
      kind: 'lab',
      legacySlug: CERT_LAB_LEGACY_SLUGS.IGI_INTERNATIONAL,
      raw: text,
      priceInr,
      turnaroundDays,
    };
  }

  if (/igi-gtl|igi\s*-\s*gtl|igi gtl|\bby igi - gtl\b/.test(lower)) {
    return {
      kind: 'lab',
      legacySlug: CERT_LAB_LEGACY_SLUGS.IGI_GTL_DELHI,
      raw: text,
      priceInr,
      turnaroundDays,
    };
  }

  if (/\bigi\b/.test(lower)) {
    return {
      kind: 'lab',
      legacySlug: CERT_LAB_LEGACY_SLUGS.IGI,
      raw: text,
      priceInr,
      turnaroundDays,
    };
  }

  return { kind: 'unknown', legacySlug: null, raw: text, priceInr, turnaroundDays };
}

export function splitLegacyCertificateValues(raw: string | null | undefined): string[] {
  if (!raw) return [];

  const normalized = raw.replace(/\|/g, ',');
  const parts = normalized.split(
    /,\s*(?=(?:Free Lab|Lab Certificate|Certificate From|WITHOUT|Already|Allready)\b)/i
  );

  return parts
    .map((part) => normalizeOptionText(part))
    .filter(Boolean);
}

export function parseLegacyCertificateOptions(raw: string | null | undefined): ParsedLegacyCertificateOption[] {
  return splitLegacyCertificateValues(raw).map(classifyLegacyCertificateOption);
}

export function legacySlugsFromParsedOptions(
  options: ParsedLegacyCertificateOption[]
): CertLabLegacySlug[] {
  const slugs = new Set<CertLabLegacySlug>();
  for (const option of options) {
    if (option.kind === 'lab' && option.legacySlug) {
      slugs.add(option.legacySlug);
    }
  }
  return [...slugs];
}

export function productLooksPrecertified(args: {
  certificate_number?: string | null;
  certificate_lab?: string | null;
  certification?: string | null;
}): boolean {
  return Boolean(
    args.certificate_number?.trim() ||
      args.certificate_lab?.trim() ||
      args.certification?.trim()
  );
}

export function shouldDisableCertificateAddons(args: {
  category?: string | null;
  product_type?: string | null;
  configurator_enabled?: boolean | null;
  display_certificate_option?: string | null;
}): boolean {
  const category = (args.category ?? '').toLowerCase();
  const productType = (args.product_type ?? '').toLowerCase();

  if (['idols', 'jewellery', 'spiritual', 'spiritual-idols'].includes(category)) {
    return true;
  }
  if (['jewellery', 'jewelry', 'idol', 'mala'].includes(productType)) {
    return true;
  }
  if (args.configurator_enabled === false) {
    return true;
  }
  if ((args.display_certificate_option ?? '').toLowerCase() === 'no') {
    return true;
  }
  return false;
}
