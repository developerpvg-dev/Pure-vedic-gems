/**
 * Catalog listing scope.
 * On-demand gems stay in their own category (ruby, emerald, …).
 * The price-mode filter still narrows the grid when a shopper asks for them only.
 */

/** Kept so older callers can ask; category grids no longer drop on-demand rows. */
export function shouldHideQuoteOnlyFromListing(
  _category?: string | null,
  _subCategory?: string | null,
): boolean {
  return false;
}

/** No-op. On-demand and quote-required products belong on the category page. */
export function applyQuoteOnlyListingFilter<T>(
  query: T,
  _category?: string | null,
  _subCategory?: string | null,
  _qualityLabel?: string | null,
  _priceMode?: string | null,
): T {
  return query;
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
