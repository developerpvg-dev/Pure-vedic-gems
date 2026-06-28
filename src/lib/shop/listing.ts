import type { ProductFilters } from '@/lib/types/product';

type SortableQuery = {
  eq(column: string, value: unknown): SortableQuery;
  not(column: string, operator: string, value: string): SortableQuery;
  order(column: string, options: { ascending: boolean }): SortableQuery;
};

/** Show all active products unless a specific availability filter or configurator mode applies. */
export function applyShopAvailabilityFilter<T extends SortableQuery>(
  query: T,
  filters: Pick<ProductFilters, 'availability_status' | 'configurator_enabled'>,
  options?: { inStockOnly?: boolean },
): T {
  if (filters.availability_status) {
    return query.eq('availability_status', filters.availability_status) as T;
  }
  if (options?.inStockOnly || filters.configurator_enabled) {
    return query
      .eq('in_stock', true)
      .not('price_mode', 'in', '(on_demand,quote_required)') as T;
  }
  return query;
}

/**
 * Legacy WooCommerce catalog order (menu_order / scraped category sequence).
 * In-stock items appear first; within each stock group, display_order is preserved.
 */
export function applyShopListingSort<T extends SortableQuery>(
  query: T,
  filters: Pick<ProductFilters, 'sort_by' | 'sort_order' | 'directors_pick'>,
  options?: { directorsPick?: boolean },
): T {
  const directorsPick = options?.directorsPick || filters.directors_pick;

  if (directorsPick && (filters.sort_by === 'catalog' || filters.sort_by === 'newest')) {
    return query
      .order('in_stock', { ascending: false })
      .order('display_order', { ascending: true })
      .order('legacy_woo_id', { ascending: true }) as T;
  }

  if (filters.sort_by === 'catalog') {
    return query
      .order('in_stock', { ascending: false })
      .order('display_order', { ascending: true })
      .order('legacy_woo_id', { ascending: true }) as T;
  }

  const sortColumn =
    filters.sort_by === 'price' ? 'price' :
    filters.sort_by === 'carat' ? 'carat_weight' : 'created_at';

  return query
    .order('in_stock', { ascending: false })
    .order(sortColumn, { ascending: filters.sort_order === 'asc' }) as T;
}
