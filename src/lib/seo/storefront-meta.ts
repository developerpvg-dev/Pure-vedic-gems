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

/** Add brand only when the full string still fits the 60-char title cap. */
function withBrand(title: string) {
  const branded = `${title} | ${BRAND}`;
  return branded.length <= 60 ? branded : title;
}

/** SERP title like competitors: "Buy 100% Natural & Certified Ruby (Manik Stone) Online" (≤60). */
export function certifiedGemHubTitle(englishName: string, vedicName?: string | null) {
  const name = englishName
    .replace(/^Natural\s+/i, '')
    .replace(/\s+(Gemstone|Stone)$/i, '')
    .trim();
  if (!vedicName) {
    const plain = `Buy 100% Natural & Certified ${name} Online`;
    return plain.length <= 60 ? plain : `Buy Natural & Certified ${name} Online`;
  }
  const hindi = vedicName.replace(/\s+(Stone|Gemstone)$/i, '').trim();
  const candidates = [
    `Buy 100% Natural & Certified ${name} (${hindi} Stone) Online`,
    `Buy 100% Natural & Certified ${name} (${hindi}) Online`,
    `Buy Natural & Certified ${name} (${hindi}) Online`,
    `Buy Natural ${name} (${hindi}) Online`,
    `Buy Certified ${name} (${hindi}) Online`,
    `Buy ${name} (${hindi}) Online`,
  ];
  return candidates.find((title) => title.length <= 60) ?? candidates[candidates.length - 1]!.slice(0, 60);
}

export function navaratnaChildMeta(name: string, vedicName: string | null) {
  const title = certifiedGemHubTitle(name, vedicName);
  const desc = vedicName
    ? `Shop ${name} (${vedicName}) gemstones online in India at ${BRAND}. Explore quality, colour, origin, treatment and Vedic suitability.`
    : `Shop ${name} gemstones online in India at ${BRAND}. Explore quality, colour, origin, treatment and Vedic suitability.`;
  return { seo_title: title, seo_description: desc };
}

export function upratnaChildMeta(name: string, vedicName?: string | null) {
  const core = name.replace(/^Natural\s+/i, '').replace(/\s+Gemstone$/i, '').trim();
  const phrase = `${core} gemstone`.toLowerCase();
  return {
    seo_title: certifiedGemHubTitle(core, vedicName),
    seo_description: `Certified ${phrase} and original ${core.toLowerCase()} stone. ${phrase} price with origin and treatment disclosure.`,
  };
}

/** SERP title for Rudraksha hubs: "Buy 100% Natural & Certified 5 Mukhi Rudraksha Online" (≤60). */
export function certifiedRudrakshaHubTitle(name: string) {
  const candidates = [
    `Buy 100% Natural & Certified ${name} Online`,
    `Buy Natural & Certified ${name} Online`,
    `Buy Certified Original ${name} Online`,
    `Buy Certified ${name} Online`,
    `Buy Original ${name} Online`,
  ];
  return candidates.find((title) => title.length <= 60) ?? `Buy ${name} Online`.slice(0, 60);
}

export function mukhiMeta(n: number) {
  const name = `${n} Mukhi Rudraksha`;
  const phrase = name.toLowerCase();
  return {
    seo_title: certifiedRudrakshaHubTitle(name),
    seo_description: `Certified ${phrase} and original ${phrase}. Nepal ${phrase} price with X-ray on premium beads.`,
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

  const cat = (input.category || '').toLowerCase();
  const natural = supportsNaturalClaim(input.treatment);
  const certified = supportsCertifiedClaim(input.certification, input.certificateLab);

  let tail = '';
  if (cat === 'rudraksha') {
    const bits = [certified ? 'Certified' : null, natural ? 'Original' : null, 'Bead'].filter(Boolean);
    tail = bits.length > 1 ? bits.join(' ') : '';
  } else if (cat === 'upratna' || cat === 'uparatna') {
    tail = natural ? 'Natural Upratna' : 'Upratna';
  } else if (input.vedicName) {
    tail = natural ? `Natural ${input.vedicName}` : input.vedicName;
  }

  const title = withBrand(tail ? `Buy ${core} Online in India | ${tail}` : `Buy ${core} Online in India`);
  return {
    title,
    description: `Shop ${core} online in India at ${BRAND}. Explore quality, colour, origin, treatment and available options.`,
  };
}
