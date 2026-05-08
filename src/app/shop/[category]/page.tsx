import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { productFiltersSchema } from '@/lib/validators/product';
import { FilterBar } from '@/components/shop/FilterBar';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { SEO_LANDING_PAGES, getSeoLandingPageBySlug } from '@/lib/constants/seo-landing-pages';
import { breadcrumbJsonLd, buildMetadata, collectionPageJsonLd, faqJsonLd, itemListJsonLd } from '@/lib/utils/seo';
import type { SeoLandingPage } from '@/lib/constants/seo-landing-pages';
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

const KNOWN_GEM_SUBCATEGORIES: Record<string, { category: string; label: string; desc: string }> = {
  ruby: { category: 'navaratna', label: 'Ruby (Manik)', desc: 'Natural Ruby gemstones for Surya, with certified options and expert Jyotish guidance.' },
  pearl: { category: 'navaratna', label: 'Pearl (Moti)', desc: 'Natural Pearl gemstones for Chandra, including traditional Vedic wearing support.' },
  'red-coral': { category: 'navaratna', label: 'Red Coral (Moonga)', desc: 'Natural Red Coral gemstones for Mangal, sourced and disclosed with care.' },
  emerald: { category: 'navaratna', label: 'Emerald (Panna)', desc: 'Certified Emerald gemstones for Budh, with origin and treatment transparency.' },
  'yellow-sapphire': { category: 'navaratna', label: 'Yellow Sapphire (Pukhraj)', desc: 'Certified Yellow Sapphire gemstones for Guru, curated for Jyotish suitability.' },
  diamond: { category: 'navaratna', label: 'Diamond (Heera)', desc: 'Diamond and Venus-aligned gemstone options from PureVedicGems.' },
  'blue-sapphire': { category: 'navaratna', label: 'Blue Sapphire (Neelam)', desc: 'Certified Blue Sapphire gemstones for Shani, with expert consultation recommended.' },
  hessonite: { category: 'navaratna', label: 'Hessonite (Gomed)', desc: 'Natural Hessonite gemstones for Rahu, with lab and origin disclosure where available.' },
  'cats-eye': { category: 'navaratna', label: "Cat's Eye (Lehsunia)", desc: 'Natural Cat Eye gemstones for Ketu, selected with careful Jyotish guidance.' },
  amethyst: { category: 'upratna', label: 'Amethyst', desc: 'Semi-precious Amethyst gemstones and Vedic alternatives.' },
  'lapis-lazuli': { category: 'upratna', label: 'Lapis Lazuli', desc: 'Semi-precious Lapis Lazuli gemstones and spiritual jewellery options.' },
  moonstone: { category: 'upratna', label: 'Moonstone', desc: 'Moonstone gemstones and Chandra-aligned semi-precious alternatives.' },
  peridot: { category: 'upratna', label: 'Peridot', desc: 'Natural Peridot semi-precious gemstones.' },
  'rose-quartz': { category: 'upratna', label: 'Rose Quartz', desc: 'Rose Quartz gemstones for gentle spiritual and jewellery use.' },
  citrine: { category: 'upratna', label: 'Citrine', desc: 'Citrine semi-precious gemstones and Jupiter-aligned alternatives.' },
  garnet: { category: 'upratna', label: 'Garnet', desc: 'Garnet semi-precious gemstones and traditional alternatives.' },
  turquoise: { category: 'upratna', label: 'Turquoise (Firoza)', desc: 'Turquoise semi-precious gemstones and Vedic jewellery options.' },
  aquamarine: { category: 'upratna', label: 'Aquamarine', desc: 'Aquamarine semi-precious gemstones.' },
  'tiger-eye': { category: 'upratna', label: 'Tiger Eye', desc: 'Tiger Eye semi-precious gemstones and bracelets.' },
  malachite: { category: 'upratna', label: 'Malachite', desc: 'Malachite semi-precious gemstones and spiritual accessories.' },
  opal: { category: 'upratna', label: 'Opal', desc: 'Opal semi-precious gemstones and Venus-aligned alternatives.' },
  'white-sapphire': { category: 'upratna', label: 'White Sapphire', desc: 'White Sapphire semi-precious alternatives and certified gemstone options.' },
};

interface ResolvedCategory {
  category?: string;
  sub_category?: string;
  label: string;
  desc: string;
  seoLanding?: SeoLandingPage;
}

/**
 * Resolve a URL slug to category metadata.
 * First checks static base categories, then looks up gem_categories in DB,
 * finally checks known sub-category slugs for all category types.
 */
async function resolveCategory(slug: string): Promise<ResolvedCategory | null> {
  const seoLanding = getSeoLandingPageBySlug(slug);
  if (seoLanding) {
    return {
      label: seoLanding.title,
      desc: seoLanding.description,
      seoLanding,
    };
  }

  // Check static base categories first
  const base = BASE_CATEGORY_MAP[slug];
  if (base) return base;

  // Look up in gem_categories table (navaratna / upratna sub-categories)
  const supabase = createOptionalPublicClient();
  if (supabase) {
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
  }

  const knownGem = KNOWN_GEM_SUBCATEGORIES[slug];
  if (knownGem) {
    return {
      category: knownGem.category,
      sub_category: slug,
      label: knownGem.label,
      desc: knownGem.desc,
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
    'saraswati': { category: 'idol', label: 'Saraswati' },
    'vishnu': { category: 'idol', label: 'Vishnu' },
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
  const gemSlugs = Object.keys(KNOWN_GEM_SUBCATEGORIES);

  // Known non-gem sub-category slugs
  const nonGemSlugs = [
    '1-mukhi', '2-mukhi', '3-mukhi', '4-mukhi', '5-mukhi', '6-mukhi',
    '7-mukhi', '8-mukhi', '9-mukhi', '10-mukhi', '11-mukhi', '12-mukhi',
    '13-mukhi', '14-mukhi', '15-mukhi', '16-mukhi', '17-mukhi', '18-mukhi', '19-mukhi', '20-mukhi', '21-mukhi', 'gauri-shankar',
    'shree-yantra', 'durga-devi', 'hanuman', 'shiv-ji', 'shivling', 'ganesha', 'lakshmi', 'nandi', 'saraswati', 'vishnu',
    'bracelets', 'exclusive-rudraksha-malas', 'rudraksha-jewelry', 'diamond-jewellery', 'malas', 'astro-gems-stock',
    'ring', 'pendant', 'necklace', 'earring',
  ];

  return [...staticSlugs, ...gemSlugs, ...nonGemSlugs, ...SEO_LANDING_PAGES.map((page) => page.slug)].map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = await resolveCategory(category);
  if (!meta) return {};
  return buildMetadata({
    title: meta.seoLanding?.seoTitle ?? `${meta.label} | PureVedicGems`,
    description: meta.desc,
    path: `/shop/${category}`,
  });
}

const CARD_SELECT = `
  id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled,
  product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number
`;

function buildSearchTerm(query: string) {
  return `%${query.replace(/[%,]/g, ' ').trim()}%`;
}

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

  const supabase = createOptionalPublicClient();
  let products: ProductCard[] = [];
  let total = 0;

  if (supabase) {
    let query = supabase
      .from('products')
      .select(CARD_SELECT, { count: 'exact' })
      .eq('is_active', true);

    if (meta?.category) query = query.eq('category', meta.category);
    if (meta?.sub_category) query = query.eq('sub_category', meta.sub_category);
    if (meta?.seoLanding?.primaryGemSlugs.length) query = query.in('sub_category', meta.seoLanding.primaryGemSlugs);
    if (filters.featured) query = query.eq('featured', true);
    if (filters.product_type) query = query.eq('product_type', filters.product_type);
    if (filters.availability_status) {
      query = query.eq('availability_status', filters.availability_status);
    } else {
      query = query.eq('in_stock', true);
    }

    // Additional user-applied filters
    if (filters.min_price !== undefined) query = query.gte('price', filters.min_price);
    if (filters.max_price !== undefined) query = query.lte('price', filters.max_price);
    if (filters.min_carat !== undefined) query = query.gte('carat_weight', filters.min_carat);
    if (filters.max_carat !== undefined) query = query.lte('carat_weight', filters.max_carat);
    if (filters.origin) query = query.eq('origin', filters.origin);
    if (filters.planet) query = query.eq('planet', filters.planet);
    if (filters.certification) query = query.eq('certification', filters.certification);
    if (filters.treatment) query = query.eq('treatment', filters.treatment);
    if (filters.q) {
      const searchTerm = buildSearchTerm(filters.q);
      query = query.or(
        `name.ilike.${searchTerm},sku.ilike.${searchTerm},tag_number.ilike.${searchTerm},vedic_name.ilike.${searchTerm},origin.ilike.${searchTerm},planet.ilike.${searchTerm},short_desc.ilike.${searchTerm}`
      );
    }

    const sortColumn =
      filters.sort_by === 'price' ? 'price' :
      filters.sort_by === 'carat' ? 'carat_weight' : 'created_at';
    query = query.order(sortColumn, { ascending: filters.sort_order === 'asc' });

    const perPage = filters.per_page;
    const page = filters.page;
    query = query.range((page - 1) * perPage, page * perPage - 1);

    const { data, count } = await query;
    products = (data ?? []) as ProductCard[];
    total = count ?? 0;
  }

  return (
    <>
      <FilterBar total={total} />
      {meta?.seoLanding ? <SeoLandingHeader landing={meta.seoLanding} total={total} /> : <CategoryHeader label={label} desc={desc} />}
      <div>
        <ProductGrid products={products} />
      </div>
      {meta?.seoLanding ? <SeoLandingFooter landing={meta.seoLanding} products={products} /> : null}
    </>
  );
}

function CategoryHeader({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="mt-5 mb-4 rounded-xl border border-brand-border bg-brand-surface px-5 py-4">
      <h1 className="font-heading text-xl text-brand-primary md:text-2xl">
        {label}
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">
        {desc}
      </p>
    </div>
  );
}

function SeoLandingHeader({ landing, total }: { landing: SeoLandingPage; total: number }) {
  return (
    <section className="mt-5 mb-6 border border-brand-border bg-brand-surface p-5 md:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-brand-accent">{landing.eyebrow}</p>
          <h1 className="font-heading text-brand-primary" style={{ fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.05 }}>
            {landing.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-muted md:text-base">
            {landing.intro}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-bg-alt p-4">
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Available Matches</p>
          <p className="mt-2 font-heading text-4xl text-brand-primary">{total}</p>
          <p className="mt-2 text-xs leading-6 text-brand-muted">Filtered from currently active catalog records.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {landing.primaryGemNames.map((gem) => (
          <span key={gem} className="border border-brand-border bg-brand-bg px-3 py-2 text-xs font-semibold text-brand-primary">
            {gem}
          </span>
        ))}
      </div>
      <p className="mt-4 border-l-2 border-brand-accent pl-4 text-sm leading-7 text-brand-primary">
        {landing.advisory}
      </p>
    </section>
  );
}

function SeoLandingFooter({ landing, products }: { landing: SeoLandingPage; products: ProductCard[] }) {
  const faq = faqJsonLd(landing.faqs);
  const itemList = itemListJsonLd(products.slice(0, 12).map((product, index) => ({
    name: product.name,
    href: `/shop/${product.category}/${product.slug}`,
    position: index + 1,
  })));

  return (
    <section className="mt-10 space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="border border-brand-border bg-brand-surface p-5">
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Supporting Options</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {landing.supportingGemNames.map((gem) => (
              <span key={gem} className="border border-brand-border px-3 py-2 text-xs font-semibold text-brand-muted">{gem}</span>
            ))}
          </div>
        </div>
        <div className="border border-brand-border bg-brand-surface p-5">
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Related Knowledge</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {landing.relatedKnowledge.map((item) => (
              <Link key={item.href} href={item.href} className="border border-brand-primary px-3 py-2 text-xs font-bold uppercase tracking-[1.2px] text-brand-primary transition hover:bg-brand-primary hover:text-brand-bg">
                {item.label}
              </Link>
            ))}
            <Link href="/consultation" className="bg-brand-primary px-3 py-2 text-xs font-bold uppercase tracking-[1.2px] text-brand-bg">
              Ask an Expert
            </Link>
          </div>
        </div>
      </div>

      <div className="border border-brand-border bg-brand-surface p-5">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Common Questions</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {landing.faqs.map((faqItem) => (
            <div key={faqItem.question} className="border border-brand-border bg-brand-bg-alt p-4">
              <h2 className="font-heading text-lg text-brand-primary">{faqItem.question}</h2>
              <p className="mt-2 text-sm leading-7 text-brand-muted">{faqItem.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <JsonLd data={[
        breadcrumbJsonLd([{ name: 'Home', href: '/' }, { name: 'Shop', href: '/shop' }, { name: landing.title, href: landing.href }]),
        collectionPageJsonLd({
          title: landing.title,
          description: landing.description,
          path: landing.href,
          items: landing.primaryGemNames.map((name, index) => ({ name, href: `/shop/${landing.primaryGemSlugs[index] ?? ''}` })),
        }),
        ...(faq ? [faq] : []),
        ...(itemList ? [itemList] : []),
      ]} />
    </section>
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
    <main className="min-h-screen bg-brand-bg px-4 pb-24 pt-32.5 md:px-6 lg:px-10">
      <div className="mx-auto max-w-350">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-brand-muted">
          <Link href="/" className="transition hover:text-brand-accent">Home</Link>
          <span>/</span>
          <Link href="/shop" className="transition hover:text-brand-accent">Shop</Link>
          <span>/</span>
          <span className="text-brand-primary">{meta.label}</span>
        </nav>

        {/* Sidebar + Grid layout */}
        <div className="flex gap-8">
          <ShopSidebar />
          <div className="min-w-0 flex-1">
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="h-12 w-full animate-pulse rounded-xl bg-brand-border" />
                  <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <div className="h-6 w-48 animate-pulse rounded bg-brand-border" />
                    <div className="mt-2 h-4 w-80 animate-pulse rounded bg-brand-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="overflow-hidden rounded-xl border border-brand-border">
                        <div className="relative animate-pulse bg-brand-border" style={{ paddingBottom: '120%' }} />
                        <div className="space-y-2 p-3">
                          <div className="h-3 w-2/3 animate-pulse rounded bg-brand-border" />
                          <div className="h-5 w-1/3 animate-pulse rounded bg-brand-border" />
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
