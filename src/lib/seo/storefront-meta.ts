/** SERP-facing brand (spaced) per SEO formula sheet. */
export const SERP_BRAND = 'Pure Vedic Gems';

const BRAND = 'PureVedicGems';

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

function pickTitle(...candidates: string[]) {
  return candidates[0]!;
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
      'Explore original Rudraksha online in India at Pure Vedic Gems. Discover Mukhi-wise beads, authenticity, quality, origin and traditional significance.',
  };
}

/** Main /gemstones/navaratna hub. */
export function navaratnaHubMeta() {
  return {
    seo_title: pickTitle(
      'Buy Navaratna Gems Online in India | Vedic Gemstones | Pure Vedic Gems',
      'Buy Navaratna Gems Online in India | Vedic Gemstones',
      'Buy Navaratna Gems Online in India | Pure Vedic Gems',
    ),
    seo_description:
      'Shop Navaratna gems online in India at Pure Vedic Gems. Explore Ruby, Pearl, Emerald, Pukhraj, Neelam, Coral, Gomed and Cat\'s Eye.',
  };
}

/** Main /gemstones/upratna hub. */
export function upratnaHubMeta() {
  return {
    seo_title: pickTitle(
      'Buy Upratna Gems Online in India | Vedic Gemstones | Pure Vedic Gems',
      'Buy Upratna Gems Online in India | Vedic Gemstones',
      'Buy Upratna Gems Online in India | Pure Vedic Gems',
    ),
    seo_description:
      'Explore Upratna gemstones online in India at Pure Vedic Gems. Browse natural and traditional Vedic gem options by gemstone type, quality, origin and price.',
  };
}

/** Navaratna / Upratna child hub: Buy Ruby Online in India | Natural Manik | Pure Vedic Gems */
export function gemChildHubTitle(englishName: string, vedicName?: string | null) {
  const name = cleanGemName(englishName);
  if (!vedicName) {
    return pickTitle(`Buy ${name} Online in India | ${SERP_BRAND}`, `Buy ${name} Online in India`);
  }
  const hindi = vedicName.replace(/\s+(Stone|Gemstone)$/i, '').trim();
  return pickTitle(
    `Buy ${name} Online in India | Natural ${hindi} | ${SERP_BRAND}`,
    `Buy ${name} Online in India | Natural ${hindi}`,
    `Buy ${name} Online in India | ${hindi} | ${SERP_BRAND}`,
  );
}

/** @deprecated Use gemChildHubTitle — kept for imports that have not been renamed yet. */
export const certifiedGemHubTitle = gemChildHubTitle;

export function gemChildHubDescription(name: string, vedicName?: string | null) {
  const core = cleanGemName(name);
  const hindi = vedicName?.replace(/\s+(Stone|Gemstone)$/i, '').trim();
  if (hindi) {
    return `Shop ${core} (${hindi}) gemstones online in India at ${SERP_BRAND}. Explore quality, colour, origin, treatment and Vedic suitability.`;
  }
  return `Shop ${core} gemstones online in India at ${SERP_BRAND}. Explore quality, colour, origin, treatment and Vedic suitability.`;
}

export function navaratnaChildMeta(name: string, vedicName: string | null) {
  return {
    seo_title: gemChildHubTitle(name, vedicName),
    seo_description: gemChildHubDescription(name, vedicName),
  };
}

export function upratnaChildHubDescription(name: string) {
  const core = cleanGemName(name);
  return `Explore ${core} gemstones online in India at ${SERP_BRAND}. Browse natural and traditional Vedic gem options by gemstone type, quality, origin and price.`;
}

export function upratnaChildMeta(name: string, vedicName?: string | null) {
  return {
    seo_title: gemChildHubTitle(name, vedicName),
    seo_description: upratnaChildHubDescription(name),
  };
}

/** Mukhi / special Rudraksha hub titles. */
export function rudrakshaHubTitle(name: string) {
  return pickTitle(
    `Buy ${name} Online in India | ${SERP_BRAND}`,
    `Buy Original ${name} Online in India | ${SERP_BRAND}`,
    `Buy ${name} Online in India`,
  );
}

/** @deprecated Use rudrakshaHubTitle */
export const certifiedRudrakshaHubTitle = rudrakshaHubTitle;

export function mukhiHubDescription(n: number) {
  const name = `${n} Mukhi Rudraksha`;
  return `Shop ${name} online in India at ${SERP_BRAND}. Explore quality, authenticity, origin and Vedic suitability.`;
}

export function mukhiMeta(n: number) {
  const name = `${n} Mukhi Rudraksha`;
  return {
    seo_title: rudrakshaHubTitle(name),
    seo_description: mukhiHubDescription(n),
  };
}

export function supportsNaturalClaim(treatment?: string | null) {
  const t = treatment?.trim() ?? '';
  if (!t) return true;
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

/** Legacy WP/marketing CMS titles that should not override the dynamic formula. */
export function isStaleMarketingTitle(title: string) {
  const t = title.trim();
  if (!t) return true;
  if (/[@₹$£€]|\b(?:rs\.?|inr)\s*[\d,]+/i.test(t)) return true;
  if (/\b(?:per\s*\.?\s*ct|per\s*carat|total\s*price)\b/i.test(t)) return true;
  if (/\bat\s*$/i.test(t)) return true;
  if (
    /\b(?:premium|luxury redefined|captivating|radiant|shop for elegance|unlock the power|elevate your|experience opulent|harness the power|embrace the power|discover the natural beauty|exceptional quality)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}

export function stripPriceFromTitle(title: string) {
  return title
    .replace(/@\s*[\d,]+(?:\.\d+)?\s*(?:per\s*\.?\s*ct|perct)?\.?/gi, ' ')
    .replace(/[₹$£€]\s*[\d,]+(?:\.\d+)?/g, ' ')
    .replace(/\b(?:rs\.?|inr)\s*[\d,]+(?:\.\d+)?/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\|\s+/g, ' | ')
    .trim();
}

function formatCarat(n: number) {
  return `${n}ct.`;
}

function productDescriptionTail(input: {
  category?: string | null;
  vedicName?: string | null;
  treatment?: string | null;
  certification?: string | null;
  certificateLab?: string | null;
}) {
  const cat = (input.category || '').toLowerCase();
  const natural = supportsNaturalClaim(input.treatment);
  const certified = supportsCertifiedClaim(input.certification, input.certificateLab);

  if (cat === 'rudraksha') {
    const bits = [certified ? 'Certified' : null, natural ? 'Original' : null, 'Bead'].filter(Boolean);
    return bits.join(' ');
  }
  if (cat === 'upratna' || cat === 'uparatna') {
    if (natural && certified) return '100% Natural & Certified Gemstone';
    if (natural) return 'Natural Upratna';
    return 'Upratna';
  }
  if (input.vedicName) {
    if (natural && certified) return `100% Natural & Genuine ${input.vedicName}`;
    if (natural) return `Natural ${input.vedicName}`;
    return input.vedicName;
  }
  if (natural && certified) return '100% Natural & Certified Gemstone';
  return '';
}

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
}) {
  const origin = input.origin?.trim() || '';
  const carat = input.carat != null && input.carat > 0 ? formatCarat(input.carat) : '';
  const size = !carat && input.sizeMm ? `${input.sizeMm}mm` : '';
  let core = input.name.trim();
  if (origin && !core.toLowerCase().includes(origin.toLowerCase())) core = `${origin} ${core}`;
  if (carat && !/\d+(?:\.\d+)?\s*ct\.?/i.test(core)) core = `${core} ${carat}`;
  else if (size && !/\d+(?:\.\d+)?\s*mm/i.test(core)) core = `${core} ${size}`;

  const tail = productDescriptionTail(input);
  const title = pickTitle(
    tail ? `Buy ${core} Online in India | ${tail}` : `Buy ${core} Online in India`,
    tail ? `Buy ${core} Online in India | ${tail} | ${BRAND}` : `Buy ${core} Online in India | ${BRAND}`,
  );

  const descCore = cleanGemName(core);
  const description =
    (input.category || '').toLowerCase() === 'rudraksha'
      ? `Shop ${descCore} online in India at ${SERP_BRAND}. Explore quality, authenticity, origin and Vedic suitability.`
      : `Shop ${descCore} gemstones online in India at ${SERP_BRAND}. Explore quality, colour, origin, treatment and Vedic suitability.`;
  return { title, description };
}
