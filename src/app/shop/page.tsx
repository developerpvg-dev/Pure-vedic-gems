import Link from 'next/link';
import { Suspense } from 'react';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { productFiltersSchema } from '@/lib/validators/product';
import { getShopFilterOptions } from '@/lib/shop/filters';
import { applyShopAvailabilityFilter, applyShopListingSort, applyShopProductFilters } from '@/lib/shop/listing';
import { FilterBar } from '@/components/shop/FilterBar';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopCategoryBrowse } from '@/components/shop/ShopCategoryBrowse';
import { ShopPagination } from '@/components/shop/ShopPagination';
import { KnowledgePageHero } from '@/components/knowledge/KnowledgePageHero';
import type { Metadata } from 'next';
import type { ProductCard } from '@/lib/types/product';

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

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
    try {
      // 'estimated' avoids a full count scan on every filter combination;
      // PostgREST returns exact counts for small result sets anyway.
      let query = supabase
        .from('products')
        .select(CARD_SELECT, { count: 'estimated' })
        .eq('is_active', true);

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.featured) query = query.eq('featured', true);
      if (filters.directors_pick) query = query.eq('is_directors_pick', true);
      if (filters.product_type) query = query.eq('product_type', filters.product_type);
      query = applyShopAvailabilityFilter(query, filters);
      if (filters.sub_category) query = query.eq('sub_category', filters.sub_category);
      query = applyShopProductFilters(query, filters);

      query = applyShopListingSort(query, filters);

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) {
        console.warn('[shop] product query failed:', error.message);
      } else {
        products = (data ?? []) as ProductCard[];
        total = count ?? 0;
      }
    } catch (error) {
      console.warn('[shop] product query timed out:', error);
    }
  }
  const totalPages = Math.ceil(total / perPage);
  const facets = await getShopFilterOptions({}, filters);
  const isSearch = Boolean(filters.q?.trim());

  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-10" aria-labelledby={isSearch ? undefined : 'shop-catalog-heading'}>
      <div className="mx-auto max-w-350">
        {!isSearch ? (
          <div className="section-head mb-8">
            <h2 className="section-title" id="shop-catalog-heading">
              All Products
            </h2>
            <p className="navratna-subtitle">Filter and browse our full certified catalog</p>
            <div className="section-rule-center" />
          </div>
        ) : null}
        <FilterBar
          total={total}
          facets={facets}
          showCategoryFilter={isSearch}
          showSubcategoryFilter={isSearch}
        />
        <div className="mt-6">
          <ProductGrid products={products} />
        </div>
        <ShopPagination page={page} totalPages={totalPages} searchParams={searchParams} basePath="/shop" />
      </div>
    </section>
  );
}

function ShopSkeleton() {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-350 space-y-6">
        <div className="h-14 w-full animate-pulse rounded-xl bg-brand-border" />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
    </section>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const rawParams = await searchParams;
  const params = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? '')])
  ) as Record<string, string>;

  const searchQuery = params.q?.trim();

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 font-body text-[#15110d]">
      {searchQuery ? (
        <div className="px-4 pt-[calc(var(--pvg-site-header-offset)+0.35rem)] pb-2 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px] text-[#6B5B4E]"
            >
              <Link href="/" className="transition hover:text-[#7A1515]">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/shop" className="transition hover:text-[#7A1515]">Shop</Link>
              <span aria-hidden="true">/</span>
              <span className="text-[#4D0A0A]">Search: {searchQuery}</span>
            </nav>
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="section-title">Search: {searchQuery}</h1>
              <p className="navratna-subtitle !mt-2 !text-[#5a5043] !text-sm">
                Refine your results with filters and sorting below.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <KnowledgePageHero
          title="Shop"
          subtitle="Browse certified Vedic gemstones, Rudraksha, idols, and jewellery — the same collections featured on our homepage, with full catalog filters below."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Shop' },
          ]}
        />
      )}

      {!searchQuery ? <ShopCategoryBrowse /> : null}

      <Suspense fallback={<ShopSkeleton />}>
        <ProductResults searchParams={params} />
      </Suspense>
    </main>
  );
}
