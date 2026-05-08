import { getSeoLandingPageBySlug, RASHI_SEO_PAGES, PURPOSE_SEO_PAGES } from '@/lib/constants/seo-landing-pages';

export type RecommendationInput = {
  birthDate?: string;
  rashi?: string;
  purpose?: string;
  budgetMin?: number;
  budgetMax?: number;
};

export type GemRecommendation = {
  rashi: string | null;
  primaryGemNames: string[];
  supportingGemNames: string[];
  landingHref: string;
  advisory: string;
  notes: string[];
};

type DateRange = {
  slug: string;
  name: string;
  start: [number, number];
  end: [number, number];
};

export const SOLAR_RASHI_RANGES: DateRange[] = [
  { slug: 'aries', name: 'Aries / Mesha', start: [3, 21], end: [4, 19] },
  { slug: 'taurus', name: 'Taurus / Vrishabha', start: [4, 20], end: [5, 20] },
  { slug: 'gemini', name: 'Gemini / Mithuna', start: [5, 21], end: [6, 20] },
  { slug: 'cancer', name: 'Cancer / Karka', start: [6, 21], end: [7, 22] },
  { slug: 'leo', name: 'Leo / Simha', start: [7, 23], end: [8, 22] },
  { slug: 'virgo', name: 'Virgo / Kanya', start: [8, 23], end: [9, 22] },
  { slug: 'libra', name: 'Libra / Tula', start: [9, 23], end: [10, 22] },
  { slug: 'scorpio', name: 'Scorpio / Vrishchika', start: [10, 23], end: [11, 21] },
  { slug: 'sagittarius', name: 'Sagittarius / Dhanu', start: [11, 22], end: [12, 21] },
  { slug: 'capricorn', name: 'Capricorn / Makara', start: [12, 22], end: [1, 19] },
  { slug: 'aquarius', name: 'Aquarius / Kumbha', start: [1, 20], end: [2, 18] },
  { slug: 'pisces', name: 'Pisces / Meena', start: [2, 19], end: [3, 20] },
];

function isDateWithin(month: number, day: number, range: DateRange) {
  const current = month * 100 + day;
  const start = range.start[0] * 100 + range.start[1];
  const end = range.end[0] * 100 + range.end[1];

  if (start <= end) return current >= start && current <= end;
  return current >= start || current <= end;
}

export function getSolarRashiFromDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return SOLAR_RASHI_RANGES.find((range) => isDateWithin(month, day, range)) ?? null;
}

function findRashiPage(input: RecommendationInput) {
  const explicitRashi = input.rashi?.trim().toLowerCase();
  if (explicitRashi) {
    const match = RASHI_SEO_PAGES.find((page) =>
      page.slug.endsWith(explicitRashi) || page.rashiName?.toLowerCase().includes(explicitRashi)
    );
    if (match) return match;
  }

  const calculated = input.birthDate ? getSolarRashiFromDate(input.birthDate) : null;
  return calculated ? getSeoLandingPageBySlug(`gemstones-for-${calculated.slug}`) : null;
}

function findPurposePage(purpose?: string) {
  const normalized = purpose?.trim().toLowerCase();
  if (!normalized) return null;
  return PURPOSE_SEO_PAGES.find((page) =>
    page.slug.includes(normalized.replace(/\s+/g, '-')) || page.purpose?.toLowerCase().includes(normalized)
  ) ?? null;
}

export function buildGemRecommendation(input: RecommendationInput): GemRecommendation {
  const rashiPage = findRashiPage(input);
  const purposePage = findPurposePage(input.purpose);
  const source = purposePage ?? rashiPage ?? getSeoLandingPageBySlug('gemstones-for-career-growth');
  const primaryGemNames = Array.from(new Set([...(source?.primaryGemNames ?? []), ...(rashiPage?.primaryGemNames ?? [])])).slice(0, 4);
  const supportingGemNames = Array.from(new Set([...(source?.supportingGemNames ?? []), ...(rashiPage?.supportingGemNames ?? [])])).slice(0, 4);
  const budgetNote = input.budgetMax
    ? `Keep certification, treatment disclosure, and total setting cost within the approved budget ceiling of INR ${input.budgetMax.toLocaleString('en-IN')}.`
    : 'Set a budget range before shortlisting so quality, certification, and setting cost stay realistic.';

  return {
    rashi: rashiPage?.rashiName ?? null,
    primaryGemNames,
    supportingGemNames,
    landingHref: source?.href ?? '/shop',
    advisory: source?.advisory ?? 'Use this as a preliminary shortlist and confirm final wearing guidance with an expert.',
    notes: [
      source?.intro ?? 'This recommendation is a preliminary shortlist based on the details provided.',
      budgetNote,
      'Birth time and place are needed for a proper Vedic chart reading; date-only matching is only a lightweight starting point.',
    ],
  };
}