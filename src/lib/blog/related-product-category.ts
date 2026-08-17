import { KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';
import { canonicalGroupHref, canonicalSubcategoryHref } from '@/lib/categories/canonical-storefront-path';

export type RelatedProductCategory = {
  relatedProductCategoryHref: string;
  relatedProductCategoryLabel: string;
};

/** Hindi / trade names that don't appear in the category slug itself. */
const EXTRA_ALIASES: Record<string, string[]> = {
  'white-sapphire': ['safed pukhraj', 'safedpukhraj'],
  'yellow-sapphire': ['pukhraj', 'pushkaraj'],
  'blue-sapphire': ['neelam'],
  'red-coral': ['moonga', 'munga'],
  emerald: ['panna'],
  ruby: ['manik', 'manikya'],
  pearl: ['moti'],
  hessonite: ['gomed', 'gomedh'],
  'cats-eye': ["cat's eye", 'cat eye', 'lehsunia', 'lahsuniya'],
  diamond: ['heera'],
  turquoise: ['firoza'],
  iolite: ['neeli'],
};

const GEM_MATCHERS = Object.keys(KNOWN_GEM_SUBCATEGORIES).map((slug) => ({
  slug,
  aliases: [slug.replace(/-/g, ' '), ...(EXTRA_ALIASES[slug] ?? [])],
}));

function haystack(...parts: Array<string | null | undefined>) {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/-/g, ' ');
}

/**
 * Infers a shop category from blog slug/title/category when Sanity fields are empty.
 * ponytail: keyword scan is enough for guide posts; editors can still override in Sanity.
 */
export function inferRelatedProductCategory(input: {
  slug?: string | null;
  title?: string | null;
  categorySlug?: string | null;
  categoryTitle?: string | null;
}): RelatedProductCategory | undefined {
  const text = haystack(input.slug, input.title);

  // Most specific match wins: "white sapphire" beats "pukhraj", "blue topaz" beats "topaz".
  let best: { slug: string; length: number } | undefined;
  for (const { slug, aliases } of GEM_MATCHERS) {
    for (const alias of aliases) {
      if (text.includes(alias) && alias.length > (best?.length ?? 0)) {
        best = { slug, length: alias.length };
      }
    }
  }

  if (best) {
    return {
      relatedProductCategoryHref: canonicalSubcategoryHref(best.slug) ?? `/shop/${best.slug}`,
      relatedProductCategoryLabel: KNOWN_GEM_SUBCATEGORIES[best.slug].label,
    };
  }

  if (/\brudraksha\b/.test(text) || /\bmukhi\b/.test(text)) {
    return {
      relatedProductCategoryHref: canonicalGroupHref('rudraksha'),
      relatedProductCategoryLabel: 'Rudraksha Collection',
    };
  }

  const category = haystack(input.categorySlug, input.categoryTitle);
  if (category.includes('rudraksha')) {
    return {
      relatedProductCategoryHref: canonicalGroupHref('rudraksha'),
      relatedProductCategoryLabel: 'Rudraksha Collection',
    };
  }
  if (category.includes('navratna') || category.includes('navaratna')) {
    return {
      relatedProductCategoryHref: canonicalGroupHref('navaratna'),
      relatedProductCategoryLabel: 'Navaratna Collection',
    };
  }
  if (category.includes('upratna')) {
    return {
      relatedProductCategoryHref: canonicalGroupHref('upratna'),
      relatedProductCategoryLabel: 'Upratna Collection',
    };
  }

  return undefined;
}
