import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { productFiltersSchema } from '@/lib/validators/product';
import { FilterBar } from '@/components/shop/FilterBar';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
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
  id, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled
`;

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ProductResults({ searchParams }: { searchParams: Record<string, string> }) {
  const parsed = productFiltersSchema.safeParse(searchParams);
  const filters = parsed.success ? parsed.data : productFiltersSchema.parse({});

  const supabase = createAdminClient();

  let query = supabase
    .from('products')
    .select(CARD_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .eq('in_stock', true);

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.sub_category) query = query.eq('sub_category', filters.sub_category);
  if (filters.min_price !== undefined) query = query.gte('price', filters.min_price);
  if (filters.max_price !== undefined) query = query.lte('price', filters.max_price);
  if (filters.min_carat !== undefined) query = query.gte('carat_weight', filters.min_carat);
  if (filters.max_carat !== undefined) query = query.lte('carat_weight', filters.max_carat);
  if (filters.origin) query = query.eq('origin', filters.origin);
  if (filters.planet) query = query.eq('planet', filters.planet);
  if (filters.certification) query = query.eq('certification', filters.certification);
  if (filters.treatment) query = query.eq('treatment', filters.treatment);

  const sortColumn =
    filters.sort_by === 'price' ? 'price' :
    filters.sort_by === 'carat' ? 'carat_weight' : 'created_at';
  const ascending = filters.sort_order === 'asc';
  query = query.order(sortColumn, { ascending });

  const perPage = filters.per_page;
  const page = filters.page;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data: products, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.ceil(total / perPage);

  return (
    <>
      <FilterBar total={total} />
      <div className="mt-6">
        <ProductGrid products={(products ?? []) as ProductCard[]} />
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
      )}
    </>
  );
}

function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string>;
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    return `/shop?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          className="rounded-lg border border-[var(--pvg-border)] px-4 py-2 text-[13px] font-medium text-[var(--pvg-primary)] transition hover:bg-[var(--pvg-primary)] hover:text-[var(--pvg-bg)]"
        >
          ← Previous
        </Link>
      )}
      {pages.map((p, i) => {
        const prev = pages[i - 1];
        return (
          <span key={p} className="flex items-center gap-2">
            {prev && p - prev > 1 && (
              <span className="text-[var(--pvg-muted)]">…</span>
            )}
            <Link
              href={buildHref(p)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border text-[13px] font-semibold transition"
              style={{
                borderColor: p === page ? 'var(--pvg-primary)' : 'var(--pvg-border)',
                background: p === page ? 'var(--pvg-primary)' : 'transparent',
                color: p === page ? 'var(--pvg-bg)' : 'var(--pvg-text)',
              }}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < totalPages && (
        <Link
          href={buildHref(page + 1)}
          className="rounded-lg border border-[var(--pvg-border)] px-4 py-2 text-[13px] font-medium text-[var(--pvg-primary)] transition hover:bg-[var(--pvg-primary)] hover:text-[var(--pvg-bg)]"
        >
          Next →
        </Link>
      )}
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-14 w-full animate-pulse rounded-xl bg-[var(--pvg-border)]" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-[var(--pvg-border)]">
            <div className="relative w-full animate-pulse bg-[var(--pvg-border)]" style={{ paddingBottom: '120%' }} />
            <div className="space-y-2 p-3">
              <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--pvg-border)]" />
              <div className="h-4 w-full animate-pulse rounded bg-[var(--pvg-border)]" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--pvg-border)]" />
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

  const categoryName = params.category
    ? params.category.charAt(0).toUpperCase() + params.category.slice(1) + 's'
    : null;

  return (
    <main className="min-h-screen bg-[var(--pvg-bg)] px-4 pb-24 pt-[130px] md:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        {/* ── Breadcrumb ── */}
        <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-[var(--pvg-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-[var(--pvg-accent)]">Home</Link>
          <span>/</span>
          <span className="text-[var(--pvg-primary)]">
            {categoryName ? `Shop → ${categoryName}` : 'Shop'}
          </span>
        </nav>

        {/* ── Page header ── */}
        <div className="mb-8 text-center">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[4px] text-[var(--pvg-accent)]">
            Heritage Collection
          </p>
          <h1 className="font-heading text-[var(--pvg-primary)]" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
            {categoryName ?? 'Our Collections'}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--pvg-muted)]">
            Certified natural gemstones, sacred rudraksha and handcrafted jewelry — sourced
            with integrity and backed by 87+ years of legacy.
          </p>
          <OrnamentalDivider className="mt-4" />
        </div>

        {/* ── Sidebar + Products ── */}
        <div className="flex gap-8">
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
