import { Suspense } from 'react';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { productFiltersSchema } from '@/lib/validators/product';
import { getShopFilterOptions } from '@/lib/shop/filters';
import { FilterBar } from '@/components/shop/FilterBar';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import { ShopPagination } from '@/components/shop/ShopPagination';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ProductCard } from '@/lib/types/product';

export const revalidate = 60; // ISR: 60s

export const metadata: Metadata = {
  title: 'Buy Certified Vedic Gemstones — PureVedicGems',
  description:
    'Browse our complete collection of certified natural gemstones, rudraksha, jewelry and malas. Filter by category, price, origin and planet. Trusted since 1937.',
  openGraph: {
    title: 'Shop — PureVedicGems',
    description: 'Certified natural Vedic gemstones, Rudraksha and jewelry.',
  },
};

const CARD_SELECT = `
  id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, stock_quantity, stock_status, sold_individually, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled,
  product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number
`;

function buildSearchTerm(query: string) {
  return `%${query.replace(/[%,]/g, ' ').trim()}%`;
}

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ProductResults({ searchParams }: { searchParams: Record<string, string> }) {
  const parsed = productFiltersSchema.safeParse(searchParams);
  const filters = parsed.success ? parsed.data : productFiltersSchema.parse({});

  const supabase = createOptionalPublicClient();
  const perPage = filters.per_page;
  const page = filters.page;
  let products: ProductCard[] = [];
  let total = 0;

  if (supabase) {
    let query = supabase
      .from('products')
      .select(CARD_SELECT, { count: 'exact' })
      .eq('is_active', true);

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.featured) query = query.eq('featured', true);
    if (filters.directors_pick) query = query.eq('is_directors_pick', true);
    if (filters.product_type) query = query.eq('product_type', filters.product_type);
    if (filters.availability_status) {
      query = query.eq('availability_status', filters.availability_status);
    } else {
      query = query.eq('in_stock', true);
    }
    if (filters.sub_category) query = query.eq('sub_category', filters.sub_category);
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

    if (filters.directors_pick && filters.sort_by === 'newest') {
      query = query.order('display_order', { ascending: true }).order('created_at', { ascending: false });
    } else {
      const sortColumn =
        filters.sort_by === 'price' ? 'price' :
        filters.sort_by === 'carat' ? 'carat_weight' : 'created_at';
      const ascending = filters.sort_order === 'asc';
      query = query.order(sortColumn, { ascending });
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count } = await query;
    products = (data ?? []) as ProductCard[];
    total = count ?? 0;
  }
  const totalPages = Math.ceil(total / perPage);
  const facets = await getShopFilterOptions({}, filters);

  return (
    <>
      <FilterBar total={total} facets={facets} showCategoryFilter />
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
      <ShopPagination page={page} totalPages={totalPages} searchParams={searchParams} basePath="/shop" />
    </>
  );
}

function ShopSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-14 w-full animate-pulse rounded-xl bg-brand-border" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-brand-border">
            <div className="relative w-full animate-pulse bg-brand-border" style={{ paddingBottom: '120%' }} />
            <div className="space-y-2 p-3">
              <div className="h-3 w-2/3 animate-pulse rounded bg-brand-border" />
              <div className="h-4 w-full animate-pulse rounded bg-brand-border" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-brand-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const rawParams = await searchParams;
  const params = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? '')])
  ) as Record<string, string>;

  const searchQuery = params.q?.trim();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf2_0%,#fbf7ef_42%,#fdf7ee_100%)] px-4 pb-24 pt-28 md:px-6 lg:px-10">
      <div className="mx-auto max-w-350">
        <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-brand-muted" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-brand-accent">Home</Link>
          <span>/</span>
          <span className="text-brand-primary">
            {searchQuery ? `Search: ${searchQuery}` : 'Shop'}
          </span>
        </nav>

        <div className="flex gap-7">
          <ShopSidebar />
          <div className="min-w-0 flex-1">
            <Suspense fallback={<ShopSkeleton />}>
              <ProductResults searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
