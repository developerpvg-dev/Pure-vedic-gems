/**
 * Catalog listing scope — mirrors legacy WooCommerce category boundaries.
 *
 * Old site: /navratan/ruby/ listed 236 priced rubies only.
 * Exclusive "On-Demand" SKUs lived under Exclusive Gems, not ruby/emerald grids.
 */

export const NAVARATNA_PRICED_SUBCATEGORIES = new Set([
  'ruby',
  'pearl',
  'red-coral',
  'emerald',
  'yellow-sapphire',
  'blue-sapphire',
  'hessonite',
  'cats-eye',
  'white-sapphire',
  'diamond',
  'pitambari',
]);

export const QUOTE_ONLY_PRICE_MODES = ['on_demand', 'quote_required'] as const;

/** Standard navaratna gem grids (ruby, emerald, …) exclude quote-only SKUs. */
export function shouldHideQuoteOnlyFromListing(
  category?: string | null,
  subCategory?: string | null,
): boolean {
  const normalizedCategory = category?.toLowerCase().trim();
  const normalizedSubCategory = subCategory?.toLowerCase().trim();

  if (normalizedCategory !== 'navaratna') return false;
  if (normalizedSubCategory === 'exclusive-gems') return false;

  if (normalizedSubCategory && NAVARATNA_PRICED_SUBCATEGORIES.has(normalizedSubCategory)) {
    return true;
  }

  return !normalizedSubCategory;
}

type FilterableQuery = {
  not(column: string, operator: string, value: string): FilterableQuery;
};

/** True when the shopper explicitly asked for the Exclusive quality bucket. */
export function isExclusiveQualityFilter(qualityLabel?: string | null): boolean {
  return qualityLabel?.trim().toLowerCase() === 'exclusive';
}

/** Hide on-request exclusive gems from priced navaratna collection pages. */
export function applyQuoteOnlyListingFilter<T extends FilterableQuery>(
  query: T,
  category?: string | null,
  subCategory?: string | null,
  // ponytail: Exclusive filter IS the on-request shelf — don't hide the rows it selects.
  qualityLabel?: string | null,
): T {
  if (isExclusiveQualityFilter(qualityLabel)) return query;
  if (!shouldHideQuoteOnlyFromListing(category, subCategory)) {
    return query;
  }
  return query.not('price_mode', 'in', '(on_demand,quote_required)') as T;
}

type OrFilterableQuery = {
  or(filters: string): OrFilterableQuery;
};

/**
 * Exclusive shelf = leftover `sub_category=exclusive-gems` OR remapped gems
 * that still carry `quality_label=Exclusive` (on-demand SKUs move off the
 * exclusive subcategory but must stay visible here).
 */
export function isExclusiveGemsShelf(subCategory?: string | null): boolean {
  return subCategory?.toLowerCase().trim() === 'exclusive-gems';
}

export function applyExclusiveGemsShelfFilter<T extends OrFilterableQuery>(
  query: T,
  subCategory?: string | null,
): T {
  if (!isExclusiveGemsShelf(subCategory)) return query;
  return query.or('sub_category.eq.exclusive-gems,quality_label.eq.Exclusive') as T;
}
