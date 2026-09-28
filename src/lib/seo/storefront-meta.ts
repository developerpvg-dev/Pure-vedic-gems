import { stripProductGradeFromName } from '@/lib/utils/product-display-name';

/**
 * Storefront meta templates from "SEO Meta Data Formulas - Pure Vedic Gems.xlsx".
 * Page type → template → dynamic variables. Custom CMS title/description override these at the call site.
 */

/** SERP-facing brand (spaced) per SEO formula sheet. */
export const SERP_BRAND = 'Pure Vedic Gems';

/** ponytail: navaratna slug → hindi, same parens as KNOWN_GEM_SUBCATEGORIES. Upratna SKUs use "Upratna", not this map. */
const VEDIC_BY_SLUG: Record<string, string> = {
  ruby: 'Manik',
  pearl: 'Moti',
  'red-coral': 'Moonga',
  emerald: 'Panna',
  'yellow-sapphire': 'Pukhraj',
  diamond: 'Heera',
  'blue-sapphire': 'Neelam',
  hessonite: 'Gomed',
  'cats-eye': 'Lehsunia',
  'white-sapphire': 'Safed Pukhraj',
  pitambari: 'Pitambari Neelam',
  'padparadscha-sapphire': 'Padmaraga',
};

export function vedicNameFromSlug(slug?: string | null) {
  return (slug && VEDIC_BY_SLUG[slug]) || null;
}

export function vedicNameFromLabel(label: string) {
  return label.match(/\(([^)]+)\)/)?.[1]?.trim() || null;
}

export function gemEnglishName(label: string) {
  return label.split('(')[0].trim();
}

function cleanGemName(englishName: string) {
  return englishName
    .replace(/^Natural\s+/i, '')
    .replace(/\s+(Gemstone|Stone)$/i, '')
    .trim();
}

function cleanVedicName(vedicName?: string | null) {
  return vedicName?.replace(/\s+(Stone|Gemstone)$/i, '').trim() || null;
}

/** Main /gemstones hub. */
export function gemstonesHubMeta() {
  return {
    seo_title: 'Buy Gemstones Online in India | Lab Certified | Pure Vedic Gems',
    seo_description:
      'Explore 100% genuine gemstones online in India at Pure Vedic Gems. Browse gemstones by type, quality, origin and price to find the right stone for your needs.',
  };
}

/** Main /rudraksha hub. */
export function rudrakshaHubMeta() {
  return {
    seo_title: 'Buy Original Rudraksha Online in India | Pure Vedic Gems',
    seo_description:
      'Explore original and certified Rudraksha online in India at Pure Vedic Gems. Discover Mukhi-wise Rudraksha, authenticity, quality, origin and traditional significance.',
  };
}

/** Main /gemstones/navaratna hub. */
export function navaratnaHubMeta() {
  return {
    seo_title: 'Buy Navaratna Gems Online in India | Vedic Gemstones | Pure Vedic Gems',
    seo_description:
      "Shop Navaratna gemstones online in India at Pure Vedic Gems. Explore Ruby, Pearl, Emerald, Pukhraj, Neelam, Coral, Gomed and Cat's Eye with quality details.",
  };
}

/** Main /gemstones/upratna hub. */
export function upratnaHubMeta() {
  return {
    seo_title: 'Buy Upratna Gems Online in India | Vedic Gemstones | Pure Vedic Gems',
    seo_description:
      'Explore Upratna gemstones online in India at Pure Vedic Gems. Browse natural and traditional Vedic gem options by gemstone type, quality, origin and price.',
  };
}

/** Specific gemstone child: Buy Ruby Online in India | Natural Manik | Pure Vedic Gems */
export function gemChildHubTitle(englishName: string, vedicName?: string | null) {
  const name = cleanGemName(englishName);
  const alt = cleanVedicName(vedicName);
  return alt
    ? `Buy ${name} Online in India | Natural ${alt} | ${SERP_BRAND}`
    : `Buy ${name} Online in India | ${SERP_BRAND}`;
}

export function gemChildHubDescription(englishName: string, vedicName?: string | null) {
  const name = cleanGemName(englishName);
  const alt = cleanVedicName(vedicName);
  return `Shop ${name}${alt ? ` (${alt})` : ''} gemstones online in India at ${SERP_BRAND}. Explore ${name} options with information on quality, colour, origin, treatment and Vedic suitability.`;
}

export function navaratnaChildMeta(englishName: string, vedicName: string | null) {
  return {
    seo_title: gemChildHubTitle(englishName, vedicName),
    seo_description: gemChildHubDescription(englishName, vedicName),
  };
}

/** Upratna child: Buy Zircon Gemstone Online in India | Natural Upratna | Pure Vedic Gems */
export function upratnaChildMeta(englishName: string) {
  const name = cleanGemName(englishName);
  return {
    seo_title: `Buy ${name} Gemstone Online in India | Natural Upratna | ${SERP_BRAND}`,
    seo_description: `Buy ${name} gemstone online in India from ${SERP_BRAND}. Explore ${name} as an Upratna with information on quality, colour, origin, treatment and available options.`,
  };
}

/** Rudraksha subcategory (Mukhi or special formation): Buy 1 Mukhi Rudraksha Online in India | Certified Original Bead */
export function rudrakshaSubcategoryMeta(phrase: string) {
  return {
    seo_title: `Buy ${phrase} Online in India | Certified Original Bead`,
    seo_description: `Shop ${phrase} online in India from ${SERP_BRAND}. Explore original Rudraksha with details on authenticity, quality, certification and traditional significance.`,
  };
}

export function mukhiMeta(n: number) {
  return rudrakshaSubcategoryMeta(`${n} Mukhi Rudraksha`);
}

/** Picks the child template by page type (navaratna / upratna / rudraksha); null for other catalog families. */
export function categoryTemplateMeta(category: string | null | undefined, label: string) {
  const name = gemEnglishName(label);
  if (category === 'navaratna') return navaratnaChildMeta(name, vedicNameFromLabel(label));
  if (category === 'upratna') return upratnaChildMeta(name);
  if (category === 'rudraksha') return rudrakshaSubcategoryMeta(name);
  return null;
}

export function supportsNaturalClaim(treatment?: string | null) {
  const t = treatment?.trim() ?? '';
  if (!t) return false;
  if (/\b(heat(?:ed)?|fill|glass|synth|diffuse|irradiat|coated|treated)\b/i.test(t) && !/\b(unheated|untreated|no\s*heat)\b/i.test(t)) {
    return false;
  }
  return /^(none|n\/a|-|untreated|unheated|no\s*heat|natural|not\s*treated)/i.test(t) || /\b(untreated|unheated|natural)\b/i.test(t);
}

export function supportsCertifiedClaim(certification?: string | null, lab?: string | null) {
  const c = `${certification ?? ''} ${lab ?? ''}`.trim();
  if (!c) return false;
  return !/^(none|n\/a|not\s*certified|unverified)$/i.test(c);
}

/** Sheet rule: no prices in titles. Also catches legacy import names like "7.58ct.@2200 per. ct." */
export function stripPriceFromTitle(title: string) {
  return title
    .replace(/@\s*[\d,]+(?:\.\d+)?\s*(?:per\s*\.?\s*(?:ct|carat)|perct)?\.?/gi, ' ')
    .replace(/(?:[₹₨$£€]\s*|\b(?:rs\.?|inr)\s*)?[\d,]+(?:\.\d+)?\s*per\s*\.?\s*(?:ct|carat)\b\.?/gi, ' ')
    .replace(/[₹₨$£€]\s*[\d,]+(?:\.\d+)?/g, ' ')
    .replace(/\b(?:rs\.?|inr)\s*[\d,]+(?:\.\d+)?/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\|\s+/g, ' | ')
    .trim();
}

const ON_DEMAND_IN_NAME = /[\s-]*\bOn[\s-]?Demand\b/gi;

function productTail(category: string, vedicName: string | null | undefined, natural: boolean, certified: boolean) {
  if (category === 'rudraksha') return [certified && 'Certified', natural && 'Original', 'Bead'].filter(Boolean).join(' ');
  if (category === 'upratna' || category === 'uparatna') return natural ? 'Natural Upratna' : 'Upratna';
  if (vedicName) return natural ? `Natural ${vedicName}` : vedicName;
  return natural ? 'Natural Gemstone' : 'Gemstone';
}

/**
 * Individual product: product name + unique attribute (origin, carat / weight) + category.
 * Pass `sku` only when a sibling shares the same name + carat, so every product URL keeps a unique title.
 */
export function gemProductMeta(input: {
  name: string;
  origin?: string | null;
  carat?: number | null;
  sizeMm?: number | null;
  vedicName?: string | null;
  category?: string | null;
  treatment?: string | null;
  certification?: string | null;
  certificateLab?: string | null;
  sku?: string | null;
}) {
  const category = (input.category || '').toLowerCase();
  const origin = input.origin?.trim() || '';
  const carat = input.carat != null && input.carat > 0 ? `${input.carat}ct.` : '';
  const size = !carat && input.sizeMm ? `${input.sizeMm}mm` : '';
  let core = stripProductGradeFromName(stripPriceFromTitle(input.name).replace(ON_DEMAND_IN_NAME, '')).trim();
  if (origin && !core.toLowerCase().includes(origin.toLowerCase())) core = `${origin} ${core}`;
  if (carat && !/\d+(?:\.\d+)?\s*ct\.?/i.test(core)) core = `${core} ${carat}`;
  else if (size && !/\d+(?:\.\d+)?\s*mm/i.test(core)) core = `${core} ${size}`;

  const natural = supportsNaturalClaim(input.treatment);
  const certified = supportsCertifiedClaim(input.certification, input.certificateLab);
  const sku = input.sku?.replace(/\.+$/, '').trim();
  const title = `Buy ${core} Online in India | ${productTail(category, input.vedicName, natural, certified)}${sku ? ` | SKU ${sku}` : ''}`;

  let description: string;
  if (category === 'rudraksha') {
    description = `Shop ${core} online in India from ${SERP_BRAND}. Explore this Rudraksha with details on authenticity, quality, certification and traditional significance.`;
  } else if (category === 'upratna' || category === 'uparatna') {
    const noun = /\bgem(?:stone)?\b/i.test(core) ? '' : ' gemstone';
    description = `Buy ${core}${noun} online in India from ${SERP_BRAND}. Explore this Upratna with information on quality, colour, origin, treatment and available options.`;
  } else {
    description = `Shop ${core}${input.vedicName ? ` (${input.vedicName})` : ''} online in India at ${SERP_BRAND}. Explore this gemstone with information on quality, colour, origin, treatment and Vedic suitability.`;
  }
  return { title, description: sku ? `${description} SKU ${sku}.` : description };
}
