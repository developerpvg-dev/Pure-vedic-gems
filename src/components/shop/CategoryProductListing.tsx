import { createOptionalPublicClient } from '@/lib/supabase/public';
import { productFiltersSchema } from '@/lib/validators/product';
import { getShopFilterOptions } from '@/lib/shop/filters';
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

function buildSearchTerm(query: string) {
  return `%${query.replace(/[%,]/g, ' ').trim()}%`;
}

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

    if (meta.category) query = query.eq('category', meta.category);
    if (meta.sub_category) query = query.eq('sub_category', meta.sub_category);
    if (!meta.category && filters.category) query = query.eq('category', filters.category);
    if (!meta.sub_category && filters.sub_category) query = query.eq('sub_category', filters.sub_category);
    if (meta.directorsPick || filters.directors_pick) query = query.eq('is_directors_pick', true);
    if (meta.seoLanding?.primaryGemSlugs.length) query = query.in('sub_category', meta.seoLanding.primaryGemSlugs);
    if (filters.featured) query = query.eq('featured', true);
    if (filters.product_type) query = query.eq('product_type', filters.product_type);
    if (filters.availability_status) {
      query = query.eq('availability_status', filters.availability_status);
    } else {
      query = query.eq('in_stock', true);
    }
    if (filters.min_price !== undefined) query = query.gte('price', filters.min_price);
    if (filters.max_price !== undefined) query = query.lte('price', filters.max_price);
    if (filters.min_carat !== undefined) query = query.gte('carat_weight', filters.min_carat);
    if (filters.max_carat !== undefined) query = query.lte('carat_weight', filters.max_carat);
    if (filters.origin) query = query.eq('origin', filters.origin);
    if (filters.shape) query = query.eq('shape', filters.shape);
    if (filters.planet) query = query.eq('planet', filters.planet);
    if (filters.certification) query = query.eq('certification', filters.certification);
    if (filters.certificate_lab) query = query.eq('certificate_lab', filters.certificate_lab);
    if (filters.quality_label) query = query.eq('quality_label', filters.quality_label);
    if (filters.treatment) query = query.eq('treatment', filters.treatment);
    if (filters.price_mode) query = query.eq('price_mode', filters.price_mode);
    if (filters.configurator_enabled !== undefined) query = query.eq('configurator_enabled', filters.configurator_enabled);
    if (filters.q) {
      const searchTerm = buildSearchTerm(filters.q);
      query = query.or(
        `name.ilike.${searchTerm},sku.ilike.${searchTerm},tag_number.ilike.${searchTerm},vedic_name.ilike.${searchTerm},origin.ilike.${searchTerm},planet.ilike.${searchTerm},short_desc.ilike.${searchTerm}`
      );
    }

    if ((meta.directorsPick || filters.directors_pick) && filters.sort_by === 'newest') {
      query = query.order('display_order', { ascending: true }).order('created_at', { ascending: false });
    } else {
      const sortColumn =
        filters.sort_by === 'price' ? 'price' :
        filters.sort_by === 'carat' ? 'carat_weight' : 'created_at';
      query = query.order(sortColumn, { ascending: filters.sort_order === 'asc' });
    }

    const perPage = filters.per_page;
    const page = filters.page;
    query = query.range((page - 1) * perPage, page * perPage - 1);

    const { data, count } = await query;
    products = (data ?? []) as ProductCard[];
    total = count ?? 0;
  }

  const totalPages = Math.ceil(total / filters.per_page);
  const facets = await getShopFilterOptions({
    category: meta.category,
    subCategory: meta.sub_category,
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
