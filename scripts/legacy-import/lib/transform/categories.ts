/**
 * Navratna category mapping.
 *
 * Single source of truth for: which legacy `wp_terms` slugs belong to Phase 1,
 * what canonical (sub_category, slug, label) they map to in the new platform,
 * and how to derive `quality_label` / `legacy_path` for audit.
 *
 * Decisions encoded here (see NAVRATNAS_MIGRATION_PLAN.md §10):
 *   1. White Sapphire is reclassified to navaratna as "White Sapphire (Shvet Pukhraj)".
 *   2. Rudraksha rows misfiled under NAVRATAN are EXCLUDED from Phase 1 and
 *      deferred to the Rudraksha phase.
 *   3. "Exclusive Gems" is NOT a real subcategory. It is a quality bucket; the
 *      transformer sets `quality_label = 'Exclusive'` and resolves the real
 *      gem subcategory from the product title.
 *   4. Slugs and product names are preserved verbatim from legacy for SEO
 *      continuity. Slug rewrites are not applied here.
 */

/** Canonical navaratna sub-category slug (matches new storefront URLs). */
export type NavratnaSubcategory =
  | 'ruby'
  | 'pearl'
  | 'red-coral'
  | 'emerald'
  | 'yellow-sapphire'
  | 'blue-sapphire'
  | 'hessonite'
  | 'cats-eye'
  | 'white-sapphire'
  | 'diamond';

export interface NavratnaCategoryMap {
  /** Canonical sub-category slug to write into `products.sub_category`. */
  subCategory: NavratnaSubcategory;
  /** Bilingual label for display + meta_title templates. */
  label: string;
  /** Planet for downstream SEO templates. */
  planet: string;
}

/**
 * Legacy `wp_terms.slug` (product_cat taxonomy) → canonical Navratna mapping.
 * Both common legacy spellings are included so the importer never misses a row
 * because of a punctuation difference.
 *
 * IMPORTANT: every key here is a *legacy* slug from `wp_terms`, lower-cased.
 * Do not add canonical slugs here — those are encoded as values.
 */
const LEGACY_NAVRATNA_TERM_MAP: Record<string, NavratnaCategoryMap> = {
  ruby: { subCategory: 'ruby', label: 'Ruby (Manik)', planet: 'Sun' },

  pearl: { subCategory: 'pearl', label: 'Pearl (Moti)', planet: 'Moon' },

  'red-coral': { subCategory: 'red-coral', label: 'Red Coral (Moonga)', planet: 'Mars' },
  'red-corel': { subCategory: 'red-coral', label: 'Red Coral (Moonga)', planet: 'Mars' },

  emerald: { subCategory: 'emerald', label: 'Emerald (Panna)', planet: 'Mercury' },

  'yellow-sapphire': { subCategory: 'yellow-sapphire', label: 'Yellow Sapphire (Pukhraj)', planet: 'Jupiter' },

  diamond: { subCategory: 'diamond', label: 'Diamond (Heera)', planet: 'Venus' },

  'blue-sapphire': { subCategory: 'blue-sapphire', label: 'Blue Sapphire (Neelam)', planet: 'Saturn' },

  hessonite: { subCategory: 'hessonite', label: 'Hessonite (Gomed)', planet: 'Rahu' },

  catseye: { subCategory: 'cats-eye', label: "Cat's Eye (Lehsunia)", planet: 'Ketu' },
  'cats-eye': { subCategory: 'cats-eye', label: "Cat's Eye (Lehsunia)", planet: 'Ketu' },
  'cat-eye': { subCategory: 'cats-eye', label: "Cat's Eye (Lehsunia)", planet: 'Ketu' },

  'white-sapphire': { subCategory: 'white-sapphire', label: 'White Sapphire (Shvet Pukhraj)', planet: 'Venus' },
};

/**
 * Heuristic title → subcategory match for products whose ONLY navratan
 * category was `Exclusive Gems`. Order matters: more specific patterns first.
 */
const TITLE_FALLBACK_PATTERNS: Array<[RegExp, NavratnaSubcategory, string, string]> = [
  [/\byellow\s*sapphire\b|\bpukhraj\b/i, 'yellow-sapphire', 'Yellow Sapphire (Pukhraj)', 'Jupiter'],
  [/\bblue\s*sapphire\b|\bneelam\b/i, 'blue-sapphire', 'Blue Sapphire (Neelam)', 'Saturn'],
  [/\bwhite\s*sapphire\b|\bshvet\s*pukhraj\b|\bsafed\s*pukhraj\b/i, 'white-sapphire', 'White Sapphire (Shvet Pukhraj)', 'Venus'],
  [/\bpink\s*sapphire\b/i, 'white-sapphire', 'Pink Sapphire', 'Venus'],
  [/\bred\s*coral\b|\bmoonga\b|\bmunga\b/i, 'red-coral', 'Red Coral (Moonga)', 'Mars'],
  [/\bcat'?s?\s*eye\b|\blehsunia\b|\blasunia\b/i, 'cats-eye', "Cat's Eye (Lehsunia)", 'Ketu'],
  [/\bemerald\b|\bpanna\b/i, 'emerald', 'Emerald (Panna)', 'Mercury'],
  [/\bhessonite\b|\bgomed\b/i, 'hessonite', 'Hessonite (Gomed)', 'Rahu'],
  [/\bdiamond\b|\bheera\b|\bhira\b/i, 'diamond', 'Diamond (Heera)', 'Venus'],
  [/\bpearl\b|\bmoti\b/i, 'pearl', 'Pearl (Moti)', 'Moon'],
  [/\bruby\b|\bmanik\b|\bmanikya\b/i, 'ruby', 'Ruby (Manik)', 'Sun'],
];

/** Lower-cased legacy term slugs that indicate the product is misfiled
 *  Rudraksha and must be excluded from Phase 1. */
const LEGACY_RUDRAKSHA_TERM_PREFIXES = ['rudraksha', '-mukhi', 'mukhi-rudraksha', 'gauri-shankar', 'ganesh-rudraksha'];

/** Legacy term slug that triggers `quality_label = 'Exclusive'`. */
const EXCLUSIVE_GEMS_TERM_SLUG = 'exclusive-gems';

export interface NavratnaClassification {
  /** True if the row belongs in Phase 1; false rows are skipped with a reason. */
  include: boolean;
  reason?: string;
  subCategory?: NavratnaSubcategory;
  label?: string;
  planet?: string;
  /** Set to 'Exclusive' when the product was tagged `Exclusive Gems` in legacy. */
  qualityLabel?: string;
  /** Raw legacy taxonomy path captured for `product_category_assignments.legacy_path`. */
  legacyPath?: string;
}

export interface LegacyTermRef {
  /** wp_terms.slug, lower-cased. */
  slug: string;
  /** wp_terms.name as it appears in the dump, e.g. "Yellow Sapphire". */
  name: string;
  /** Full path captured from CSV "Categories" column or rebuilt from term parents, e.g. "NAVRATAN > Yellow Sapphire". */
  path?: string;
}

/**
 * Classify a product's legacy term set into a Phase-1 Navratna decision.
 *
 * Inputs are the product's full set of legacy `product_cat` term slugs.
 * The function applies, in order:
 *   1. Exclude if any term marks the product as Rudraksha.
 *   2. Take the first direct Navratna term match.
 *   3. If only `exclusive-gems` matched, fall back to title parsing and set
 *      `qualityLabel = 'Exclusive'`.
 *   4. Otherwise exclude with a clear reason for the dry-run report.
 */
export function classifyNavratna(args: {
  legacyTerms: LegacyTermRef[];
  productTitle: string;
}): NavratnaClassification {
  const terms = args.legacyTerms.map((t) => ({ ...t, slug: t.slug.toLowerCase() }));

  if (terms.some((t) => LEGACY_RUDRAKSHA_TERM_PREFIXES.some((p) => t.slug.includes(p)))) {
    return { include: false, reason: 'rudraksha-deferred-to-phase-2' };
  }

  const direct = terms.find((t) => LEGACY_NAVRATNA_TERM_MAP[t.slug]);
  const hasExclusive = terms.some((t) => t.slug === EXCLUSIVE_GEMS_TERM_SLUG);
  const legacyPath = terms.find((t) => t.path)?.path;

  if (direct) {
    const map = LEGACY_NAVRATNA_TERM_MAP[direct.slug];
    return {
      include: true,
      subCategory: map.subCategory,
      label: map.label,
      planet: map.planet,
      qualityLabel: hasExclusive ? 'Exclusive' : undefined,
      legacyPath,
    };
  }

  if (hasExclusive) {
    const fallback = TITLE_FALLBACK_PATTERNS.find(([re]) => re.test(args.productTitle));
    if (fallback) {
      const [, subCategory, label, planet] = fallback;
      return {
        include: true,
        subCategory,
        label,
        planet,
        qualityLabel: 'Exclusive',
        legacyPath,
      };
    }
    return {
      include: false,
      reason: 'exclusive-gems-only-and-title-unresolved',
      legacyPath,
    };
  }

  return { include: false, reason: 'no-navratna-term-matched' };
}

/**
 * Build the canonical storefront path for a Navratna product.
 * Slug is preserved verbatim — see decision (4).
 */
export function navratnaStorefrontPath(subCategory: NavratnaSubcategory, slug: string): string {
  return `/shop/${subCategory}/${slug}`;
}

/**
 * Legacy URL shapes that should 301 to the canonical storefront path.
 * Both `purevedicgems.com` and `purevedicgems.in` used the same patterns.
 */
export function legacyRedirectPaths(args: {
  legacySubcatSlug: string; // raw legacy term slug, e.g. "yellow-sapphire" or "catseye"
  legacyProductSlug: string;
}): Array<{ legacyPath: string; sourceLabel: string }> {
  const sub = args.legacySubcatSlug.toLowerCase();
  const slug = args.legacyProductSlug;
  return [
    { legacyPath: `/shop/navratan/${sub}/${slug}/`, sourceLabel: 'shop_navratan' },
    { legacyPath: `/shop/navratan/${sub}/${slug}`, sourceLabel: 'shop_navratan' },
    { legacyPath: `/product-category/navratan/${sub}/${slug}/`, sourceLabel: 'product_category_navratan' },
    { legacyPath: `/product/${slug}/`, sourceLabel: 'product_root' },
    { legacyPath: `/product/${slug}`, sourceLabel: 'product_root' },
  ];
}
