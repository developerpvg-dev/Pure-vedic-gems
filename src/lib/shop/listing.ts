import type { ProductFilters } from '@/lib/types/product';
import { applyProductTextSearch } from '@/lib/shop/product-search';
import { originFilterClauses } from '@/lib/utils/origin';
import {
  isCanonicalQualityTier,
  qualityTierFilterLabels,
} from '@/lib/utils/quality-tier';

type SortableQuery = {
  eq(column: string, value: unknown): SortableQuery;
  not(column: string, operator: string, value: string): SortableQuery;
  gte(column: string, value: number): SortableQuery;
  lte(column: string, value: number): SortableQuery;
  or(filters: string): SortableQuery;
  textSearch?(column: string, query: string, options?: { type?: string; config?: string }): SortableQuery;
  order(column: string, options: { ascending: boolean }): SortableQuery;
};

/** Apply shared product listing filters (price, weight, origin, grade, etc.). */
export function applyShopProductFilters<T extends SortableQuery>(
  query: T,
  filters: Pick<
    ProductFilters,
    | 'min_price'
    | 'max_price'
    | 'min_carat'
    | 'max_carat'
    | 'min_ratti'
    | 'max_ratti'
    | 'origin'
    | 'shape'
    | 'planet'
    | 'certification'
    | 'certificate_lab'
    | 'quality_label'
    | 'treatment'
    | 'price_mode'
    | 'configurator_enabled'
    | 'q'
  >,
): T {
  if (filters.min_price !== undefined) query = query.gte('price', filters.min_price) as T;
  if (filters.max_price !== undefined) query = query.lte('price', filters.max_price) as T;
  if (filters.min_carat !== undefined) query = query.gte('carat_weight', filters.min_carat) as T;
  if (filters.max_carat !== undefined) query = query.lte('carat_weight', filters.max_carat) as T;
  if (filters.min_ratti !== undefined) query = query.gte('ratti_weight', filters.min_ratti) as T;
  if (filters.max_ratti !== undefined) query = query.lte('ratti_weight', filters.max_ratti) as T;
  if (filters.origin) {
    const clauses = originFilterClauses(filters.origin);
    query = (clauses.length === 1
      ? query.eq('origin', filters.origin)
      : query.or(clauses.join(','))) as T;
  }
  if (filters.shape) query = query.eq('shape', filters.shape) as T;
  if (filters.planet) query = query.eq('planet', filters.planet) as T;
  if (filters.certification) query = query.eq('certification', filters.certification) as T;
  if (filters.certificate_lab) query = query.eq('certificate_lab', filters.certificate_lab) as T;
  if (filters.quality_label) {
    if (isCanonicalQualityTier(filters.quality_label)) {
      const labels = qualityTierFilterLabels(filters.quality_label);
      query = query.or(labels.map((label) => `quality_label.eq.${label}`).join(',')) as T;
    } else {
      query = query.eq('quality_label', filters.quality_label) as T;
    }
  }
  if (filters.treatment) query = query.eq('treatment', filters.treatment) as T;
  if (filters.price_mode) query = query.eq('price_mode', filters.price_mode) as T;
  if (filters.configurator_enabled !== undefined) {
    query = query.eq('configurator_enabled', filters.configurator_enabled) as T;
  }
  if (filters.q) {
    query = applyProductTextSearch(query, filters.q) as T;
  }
  return query;
}

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
