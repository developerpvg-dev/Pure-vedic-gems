import { createOptionalPublicClient } from '@/lib/supabase/public';
import { productFiltersSchema } from '@/lib/validators/product';
import { getShopFilterOptions } from '@/lib/shop/filters';
import { applyShopAvailabilityFilter, applyShopListingSort, applyShopProductFilters } from '@/lib/shop/listing';
import { applyExclusiveGemsShelfFilter, isExclusiveGemsShelf } from '@/lib/shop/catalog-scope';
import { FilterBar } from '@/components/shop/FilterBar';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopPagination } from '@/components/shop/ShopPagination';
import type { ResolvedShopCategory } from '@/lib/categories/shop';
import type { ProductCard } from '@/lib/types/product';

const CARD_SELECT = `
  id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, stock_quantity, stock_status, sold_individually, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled,
  product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number
`;

function CategoryHeader({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="mb-4 rounded-lg border border-brand-border bg-[linear-gradient(135deg,#fffdf8_0%,#fff5df_52%,#f8eee0_100%)] px-5 py-4">
      <h1 className="font-heading text-xl text-brand-primary md:text-2xl">
        {label}
      </h1>
      <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-amber-700">
        {desc}
      </p>
    </div>
  );
}

export async function CategoryProductListing({
  meta,
  searchParams,
  basePath,
}: {
  meta: ResolvedShopCategory;
  searchParams: Record<string, string>;
  basePath: string;
}) {
  const parsed = productFiltersSchema.safeParse(searchParams);
  const filters = parsed.success ? parsed.data : productFiltersSchema.parse({});
  const supabase = createOptionalPublicClient();
  let products: ProductCard[] = [];
  let total = 0;

  if (supabase) {
    let query = supabase
      .from('products')
      .select(CARD_SELECT, { count: 'exact' })
      .eq('is_active', true);

    if (meta.category && !meta.catalogSubcategories?.length) query = query.eq('category', meta.category);
    if (meta.sub_category && !isExclusiveGemsShelf(meta.sub_category)) {
      query = query.eq('sub_category', meta.sub_category);
    }
    query = applyExclusiveGemsShelfFilter(query, meta.sub_category);
    if (meta.catalogSubcategories?.length) {
      query = query.in('sub_category', meta.catalogSubcategories);
    }
    if (!meta.category && filters.category) query = query.eq('category', filters.category);
    if (!meta.sub_category && filters.sub_category) query = query.eq('sub_category', filters.sub_category);
    if (meta.directorsPick || filters.directors_pick) query = query.eq('is_directors_pick', true);
    if (meta.seoLanding?.primaryGemSlugs.length) query = query.in('sub_category', meta.seoLanding.primaryGemSlugs);
    if (filters.featured) query = query.eq('featured', true);
    if (filters.product_type) query = query.eq('product_type', filters.product_type);
    query = applyShopAvailabilityFilter(query, filters);
    query = applyShopProductFilters(query, filters);
    query = applyShopListingSort(query, filters, { directorsPick: meta.directorsPick });

    const perPage = filters.per_page;
    const page = filters.page;
    query = query.range((page - 1) * perPage, page * perPage - 1);

    const { data, count } = await query;
    products = (data ?? []) as ProductCard[];
    total = count ?? 0;
  }

  const totalPages = Math.ceil(total / filters.per_page);
  const facets = await getShopFilterOptions({
    category: meta.catalogSubcategories?.length ? undefined : meta.category,
    subCategory: meta.catalogSubcategories?.length ? undefined : meta.sub_category,
    subCategories: meta.catalogSubcategories,
    directorsPick: meta.directorsPick,
    primaryGemSlugs: meta.seoLanding?.primaryGemSlugs,
  }, filters);

  return (
    <>
      <CategoryHeader label={meta.label} desc={meta.desc} />
      <FilterBar
        total={total}
        facets={facets}
        showCategoryFilter={!meta.category}
        showSubcategoryFilter={Boolean(meta.category && !meta.sub_category && !meta.seoLanding)}
      />
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
      <ShopPagination page={filters.page} totalPages={totalPages} searchParams={searchParams} basePath={basePath} />
    </>
  );
}
