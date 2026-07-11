import type { CategoryFaq, HeroBenefit } from '@/lib/types/shop-category-page';

export const BRAND = 'PureVedicGems';

export function p(...paragraphs: string[]) {
  return paragraphs.map((text) => `<p>${text}</p>`).join('\n');
}

export function h3(title: string) {
  return `<h3>${title}</h3>`;
}

export function ul(items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

export function table(rows: Array<[string, string]>) {
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td>${label}</td><td>${value}</td></tr>`,
    )
    .join('');
  return `<table><tbody>${body}</tbody></table>`;
}

export type RichGemSections = {
  intro?: string;
  hero_benefits?: HeroBenefit[];
  seo_description?: string;
  meta_keywords?: string[];
  about_html?: string;
  how_to_wear_html?: string;
  who_should_wear_html?: string;
  benefits_html?: string;
  types_html?: string;
  quality_price_html?: string;
  jewellery_html?: string;
  cleaning_care_html?: string;
  buyer_beware_html?: string;
  faqs?: CategoryFaq[];
};

export function mergeKeywords(base: string[], extra: string[] = []) {
  return [...new Set([...base, ...extra].map((k) => k.trim().toLowerCase()).filter(Boolean))];
}

/** One short sentence for the hero banner (detailed copy lives in About tab). */
export function compactHeroIntro(text: string, maxLen = 140): string {
  const trimmed = text.trim();
  const sentence = trimmed.match(/^(.+?[.!?])(?:\s|$)/)?.[1]?.trim();
  const candidate = sentence && sentence.length <= maxLen ? sentence : trimmed;
  if (candidate.length <= maxLen) return candidate;
  return `${candidate.slice(0, maxLen - 1).trim()}…`;
}

/** Short phrase for hero benefit chips — keeps the hero clean and scannable. */
export function compactHeroBenefit(text: string, maxLen = 34): string {
  const trimmed = text.trim();
  const shortened = trimmed.split(/[,;]| and /i)[0]?.trim() ?? trimmed;
  const candidate = shortened.length <= maxLen ? shortened : trimmed;
  if (candidate.length <= maxLen) return candidate;
  const words = candidate.split(/\s+/);
  let out = '';
  for (const word of words) {
    const next = out ? `${out} ${word}` : word;
    if (next.length > maxLen) break;
    out = next;
  }
  return out || `${trimmed.slice(0, maxLen - 1).trim()}…`;
}

export function compactHeroBenefits(benefits: HeroBenefit[]): HeroBenefit[] {
  return benefits.map((benefit) => ({ text: compactHeroBenefit(benefit.text) }));
}

export function baseGemKeywords(slug: string, name: string, hindi?: string | null, planet?: string | null) {
  return mergeKeywords(
    [
      slug,
      name.toLowerCase(),
      hindi?.toLowerCase() ?? '',
      'buy online',
      'certified',
      'natural',
      'vedic gemstone',
      'astrological gemstone',
      'jyotish',
      'rashi ratna',
      BRAND.toLowerCase(),
      planet?.toLowerCase() ?? '',
      `${name.toLowerCase()} price`,
      `${name.toLowerCase()} benefits`,
      `how to wear ${name.toLowerCase()}`,
    ],
    hindi ? [hindi] : [],
  );
}
