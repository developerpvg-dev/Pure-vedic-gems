import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { productFiltersSchema } from '@/lib/validators/product';
import { FilterBar } from '@/components/shop/FilterBar';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ProductCard } from '@/lib/types/product';

export const revalidate = 60;

// Static base categories (broad product types — not individual gems)
const BASE_CATEGORY_MAP: Record<string, { category: string; label: string; desc: string }> = {
  gemstones: {
    category: 'gemstone',
    label: 'Gemstones',
    desc: 'Certified natural gemstones from premium origins worldwide. Each stone ethically sourced and laboratory verified.',
  },
  navaratna: {
    category: 'navaratna',
    label: 'Navaratna — Sacred Nine Gems',
    desc: 'The nine sacred Navaratna gems aligned with the nine planets. Each carries unique cosmic energy for Vedic healing.',
  },
  upratna: {
    category: 'upratna',
    label: 'Upratna — Semi-Precious Gems',
    desc: 'Semi-precious Vedic gemstones — affordable alternatives with powerful planetary benefits.',
  },
  rudraksha: {
    category: 'rudraksha',
    label: 'Rudraksha',
    desc: 'Sacred Rudraksha beads from Nepal and India. Each bead energized with Vedic mantras for maximum efficacy.',
  },
  jewelry: {
    category: 'jewelry',
    label: 'Jewelry',
    desc: 'Handcrafted gemstone jewelry in gold, silver and Panchdhatu. Custom settings available.',
  },
  malas: {
    category: 'mala',
    label: 'Malas',
    desc: 'Sacred malas of Rudraksha, crystals and gemstones for japa meditation and spiritual practice.',
  },
  idols: {
    category: 'idol',
    label: 'Spiritual Idols',
    desc: 'Handcrafted deities, Shree Yantras and temple accessories blessed by our priests.',
  },
};

interface ResolvedCategory {
  category: string;
  sub_category?: string;
  label: string;
  desc: string;
}

/**
 * Resolve a URL slug to category metadata.
 * First checks static base categories, then looks up gem_categories in DB,
 * finally checks known sub-category slugs for all category types.
 */
async function resolveCategory(slug: string): Promise<ResolvedCategory | null> {
  // Check static base categories first
  const base = BASE_CATEGORY_MAP[slug];
  if (base) return base;

  // Look up in gem_categories table (navaratna / upratna sub-categories)
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('gem_categories')
    .select('name, slug, type, sanskrit_name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (data) {
    const parentCategory = data.type === 'upratna' ? 'upratna' : 'navaratna';
    const label = data.sanskrit_name
      ? `${data.name} (${data.sanskrit_name})`
      : data.name;

    return {
      category: parentCategory,
      sub_category: data.slug,
      label,
      desc: data.description || `Explore our collection of natural ${data.name} gemstones.`,
    };
  }

  // Check known sub-category slugs for non-gem categories
  const KNOWN_SUBCATS: Record<string, { category: string; label: string }> = {
    // Rudraksha
    '1-mukhi': { category: 'rudraksha', label: '1 Mukhi Rudraksha' },
    '2-mukhi': { category: 'rudraksha', label: '2 Mukhi Rudraksha' },
    '3-mukhi': { category: 'rudraksha', label: '3 Mukhi Rudraksha' },
    '4-mukhi': { category: 'rudraksha', label: '4 Mukhi Rudraksha' },
    '5-mukhi': { category: 'rudraksha', label: '5 Mukhi Rudraksha' },
    '6-mukhi': { category: 'rudraksha', label: '6 Mukhi Rudraksha' },
    '7-mukhi': { category: 'rudraksha', label: '7 Mukhi Rudraksha' },
    '8-mukhi': { category: 'rudraksha', label: '8 Mukhi Rudraksha' },
    '9-mukhi': { category: 'rudraksha', label: '9 Mukhi Rudraksha' },
    '10-mukhi': { category: 'rudraksha', label: '10 Mukhi Rudraksha' },
    '11-mukhi': { category: 'rudraksha', label: '11 Mukhi Rudraksha' },
    '12-mukhi': { category: 'rudraksha', label: '12 Mukhi Rudraksha' },
    '13-mukhi': { category: 'rudraksha', label: '13 Mukhi Rudraksha' },
    '14-mukhi': { category: 'rudraksha', label: '14 Mukhi Rudraksha' },
    '15-mukhi': { category: 'rudraksha', label: '15 Mukhi Rudraksha' },
    '16-mukhi': { category: 'rudraksha', label: '16 Mukhi Rudraksha' },
    '17-mukhi': { category: 'rudraksha', label: '17 Mukhi Rudraksha' },
    '18-mukhi': { category: 'rudraksha', label: '18 Mukhi Rudraksha' },
    '19-mukhi': { category: 'rudraksha', label: '19 Mukhi Rudraksha' },
    '20-mukhi': { category: 'rudraksha', label: '20 Mukhi Rudraksha' },
    '21-mukhi': { category: 'rudraksha', label: '21 Mukhi Rudraksha' },
    'gauri-shankar': { category: 'rudraksha', label: 'Gauri Shankar Rudraksha' },
    'ganesh-rudraksha': { category: 'rudraksha', label: 'Ganesh Rudraksha' },
    // Spiritual Idols
    'shree-yantra': { category: 'idol', label: 'Shree Yantra' },
    'durga-devi': { category: 'idol', label: 'Durga Devi' },
    'hanuman': { category: 'idol', label: 'Hanuman' },
    'shiv-ji': { category: 'idol', label: 'Shiv Ji' },
    'shivling': { category: 'idol', label: 'Shivling' },
    'ganesha': { category: 'idol', label: 'Ganesha' },
    'lakshmi': { category: 'idol', label: 'Lakshmi' },
    'nandi': { category: 'idol', label: 'Nandi' },
    // Jewellery
    'bracelets': { category: 'jewelry', label: 'Bracelets' },
    'exclusive-rudraksha-malas': { category: 'jewelry', label: 'Exclusive Rudraksha Malas' },
    'rudraksha-jewelry': { category: 'jewelry', label: 'Ready Rudraksha Jewelry' },
    'diamond-jewellery': { category: 'jewelry', label: 'Diamond Jewellery' },
    'malas': { category: 'jewelry', label: 'Malas' },
    'astro-gems-stock': { category: 'jewelry', label: 'Ready Astro-Gems Stock' },
    'ring': { category: 'jewelry', label: 'Rings' },
    'pendant': { category: 'jewelry', label: 'Pendants' },
    'necklace': { category: 'jewelry', label: 'Necklaces' },
    'earring': { category: 'jewelry', label: 'Earrings' },
  };

  const known = KNOWN_SUBCATS[slug];
  if (known) {
    return {
      category: known.category,
      sub_category: slug,
      label: known.label,
      desc: `Explore our collection of ${known.label}.`,
    };
  }

  return null;
}

export async function generateStaticParams() {
  // Static base categories
  const staticSlugs = Object.keys(BASE_CATEGORY_MAP);

  // Dynamic gem categories from DB
  const supabase = createAdminClient();
  const { data: gemCategories } = await supabase
    .from('gem_categories')
    .select('slug')
    .eq('is_active', true);

  const gemSlugs = (gemCategories ?? []).map(c => c.slug);

  // Known non-gem sub-category slugs
  const nonGemSlugs = [
    '1-mukhi', '2-mukhi', '3-mukhi', '4-mukhi', '5-mukhi', '6-mukhi',
    '7-mukhi', '8-mukhi', '9-mukhi', '10-mukhi', '11-mukhi', '12-mukhi',
    '13-mukhi', '14-mukhi', 'gauri-shankar',
    'shree-yantra', 'durga-devi', 'hanuman', 'shiv-ji', 'shivling', 'ganesha', 'lakshmi', 'nandi',
    'bracelets', 'exclusive-rudraksha-malas', 'rudraksha-jewelry', 'diamond-jewellery', 'malas', 'astro-gems-stock',
    'ring', 'pendant', 'necklace', 'earring',
  ];

  return [...staticSlugs, ...gemSlugs, ...nonGemSlugs].map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = await resolveCategory(category);
  if (!meta) return {};
  return {
    title: `${meta.label} — PureVedicGems`,
    description: meta.desc,
    openGraph: {
      title: `${meta.label} | PureVedicGems`,
      description: meta.desc,
    },
  };
}

const CARD_SELECT = `
  id, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled
`;

async function CategoryProducts({
  categorySlug,
  searchParams,
  label,
  desc,
}: {
  categorySlug: string;
  searchParams: Record<string, string>;
  label: string;
  desc: string;
}) {
  const meta = await resolveCategory(categorySlug);
  const parsed = productFiltersSchema.safeParse(searchParams);
  const filters = parsed.success ? parsed.data : productFiltersSchema.parse({});

  const supabase = createAdminClient();

  let query = supabase
    .from('products')
    .select(CARD_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .eq('in_stock', true);

  if (meta?.category) query = query.eq('category', meta.category);
  if (meta?.sub_category) query = query.eq('sub_category', meta.sub_category);

  // Additional user-applied filters
  if (filters.min_price !== undefined) query = query.gte('price', filters.min_price);
  if (filters.max_price !== undefined) query = query.lte('price', filters.max_price);
  if (filters.origin) query = query.eq('origin', filters.origin);
  if (filters.planet) query = query.eq('planet', filters.planet);
  if (filters.certification) query = query.eq('certification', filters.certification);

  const sortColumn =
    filters.sort_by === 'price' ? 'price' :
    filters.sort_by === 'carat' ? 'carat_weight' : 'created_at';
  query = query.order(sortColumn, { ascending: filters.sort_order === 'asc' });

  const perPage = filters.per_page;
  const page = filters.page;
  query = query.range((page - 1) * perPage, page * perPage - 1);

  const { data: products, count } = await query;
  const total = count ?? 0;

  return (
    <>
      <FilterBar total={total} />
      {/* Category Header */}
      <div className="mt-5 mb-4 rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)] px-5 py-4">
        <h1 className="font-heading text-xl text-[var(--pvg-primary)] md:text-2xl">
          {label}
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--pvg-muted)]">
          {desc}
        </p>
      </div>
      <div>
        <ProductGrid products={(products ?? []) as ProductCard[]} />
      </div>
    </>
  );
}

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;

  const meta = await resolveCategory(category);
  if (!meta) {
    notFound();
  }
  const rawParams = await searchParams;
  const sParams = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? '')])
  ) as Record<string, string>;

  return (
    <main className="min-h-screen bg-[var(--pvg-bg)] px-4 pb-24 pt-[130px] md:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-[var(--pvg-muted)]">
          <Link href="/" className="transition hover:text-[var(--pvg-accent)]">Home</Link>
          <span>/</span>
          <Link href="/shop" className="transition hover:text-[var(--pvg-accent)]">Shop</Link>
          <span>/</span>
          <span className="text-[var(--pvg-primary)]">{meta.label}</span>
        </nav>

        {/* Sidebar + Grid layout */}
        <div className="flex gap-8">
          <ShopSidebar />
          <div className="min-w-0 flex-1">
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--pvg-border)]" />
                  <div className="rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)] p-5">
                    <div className="h-6 w-48 animate-pulse rounded bg-[var(--pvg-border)]" />
                    <div className="mt-2 h-4 w-80 animate-pulse rounded bg-[var(--pvg-border)]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="overflow-hidden rounded-xl border border-[var(--pvg-border)]">
                        <div className="relative animate-pulse bg-[var(--pvg-border)]" style={{ paddingBottom: '120%' }} />
                        <div className="space-y-2 p-3">
                          <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--pvg-border)]" />
                          <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--pvg-border)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <CategoryProducts categorySlug={category} searchParams={sParams} label={meta.label} desc={meta.desc} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
