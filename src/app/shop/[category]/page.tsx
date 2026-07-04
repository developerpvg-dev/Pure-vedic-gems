import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { resolveShopCategoryPath, staticShopCategoryParams, type ResolvedShopCategory } from '@/lib/categories/shop';
import { productHref } from '@/lib/categories/storefront';
import {
  buildCategoryHubSections,
  getHowToStructuredDataMeta,
} from '@/lib/categories/shop-category-hub-sections';
import {
  categoryPageMetadata,
  fetchShopCategoryPage,
  shopCategoryHref,
  shopCategoryLabel,
} from '@/lib/categories/shop-category-page';
import { productFiltersSchema } from '@/lib/validators/product';
import { getShopFilterOptions } from '@/lib/shop/filters';
import { applyShopAvailabilityFilter, applyShopListingSort, applyShopProductFilters } from '@/lib/shop/listing';
import { applyQuoteOnlyListingFilter } from '@/lib/shop/catalog-scope';
import { FilterBar } from '@/components/shop/FilterBar';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopPagination } from '@/components/shop/ShopPagination';
import { CategoryHubHeader } from '@/components/shop/CategoryHub';
import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  breadcrumbJsonLd,
  buildMetadata,
  collectionPageJsonLd,
  faqJsonLd,
  itemListJsonLd,
  howToJsonLd,
} from '@/lib/utils/seo';
import type { SeoLandingPage } from '@/lib/constants/seo-landing-pages';
import type { ProductCard } from '@/lib/types/product';
import { RudrakshaCategoryGrid } from '@/components/shop/RudrakshaCategoryGrid';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { MessageCircleQuestion } from 'lucide-react';

export const revalidate = 60;

async function resolveCategory(slug: string): Promise<ResolvedShopCategory | null> {
  return resolveShopCategoryPath(slug);
}

export async function generateStaticParams() {
  return staticShopCategoryParams().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const hubPage = await fetchShopCategoryPage(category);
  if (hubPage) {
    const meta = categoryPageMetadata(hubPage);
    return buildMetadata({
      title: meta.title,
      description: meta.description,
      path: meta.path,
      image: meta.image,
    });
  }

  const meta = await resolveCategory(category);
  if (!meta) return {};
  return buildMetadata({
    title: meta.seoLanding?.seoTitle ?? meta.seoTitle ?? `${meta.label} | PureVedicGems`,
    description: meta.desc,
    path: meta.canonicalPath ?? shopCategoryHref(category),
  });
}

const CARD_SELECT = `
  id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, stock_quantity, stock_status, sold_individually, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled,
  product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number
`;

async function CategoryProducts({
  categorySlug,
  searchParams,
  label,
  desc,
  hubPage,
}: {
  categorySlug: string;
  searchParams: Record<string, string>;
  label: string;
  desc: string;
  hubPage: Awaited<ReturnType<typeof fetchShopCategoryPage>>;
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

    if (meta?.category && !meta?.catalogSubcategories?.length) query = query.eq('category', meta.category);
    if (meta?.sub_category) query = query.eq('sub_category', meta.sub_category);
    if (meta?.catalogSubcategories?.length) {
      query = query.in('sub_category', meta.catalogSubcategories);
    }
    if (!meta?.category && filters.category) query = query.eq('category', filters.category);
    if (!meta?.sub_category && filters.sub_category) query = query.eq('sub_category', filters.sub_category);
    if (meta?.directorsPick || filters.directors_pick) query = query.eq('is_directors_pick', true);
    if (meta?.seoLanding?.primaryGemSlugs.length) query = query.in('sub_category', meta.seoLanding.primaryGemSlugs);
    if (filters.featured) query = query.eq('featured', true);
    if (filters.product_type) query = query.eq('product_type', filters.product_type);
    query = applyShopAvailabilityFilter(query, filters);
    query = applyQuoteOnlyListingFilter(
      query,
      meta?.category ?? filters.category,
      meta?.sub_category ?? filters.sub_category,
    );
    query = applyShopProductFilters(query, filters);

    query = applyShopListingSort(query, filters, { directorsPick: meta?.directorsPick });

    const perPage = filters.per_page;
    const page = filters.page;
    query = query.range((page - 1) * perPage, page * perPage - 1);

    const { data, count } = await query;
    products = (data ?? []) as ProductCard[];
    total = count ?? 0;
  }

  const facets = await getShopFilterOptions({
    category: meta?.catalogSubcategories?.length ? undefined : meta?.category,
    subCategory: meta?.catalogSubcategories?.length ? undefined : meta?.sub_category,
    subCategories: meta?.catalogSubcategories,
    directorsPick: meta?.directorsPick,
    primaryGemSlugs: meta?.seoLanding?.primaryGemSlugs,
  }, filters);
  const totalPages = Math.ceil(total / filters.per_page);
  const basePath = meta?.canonicalPath ?? shopCategoryHref(categorySlug);
  const displayLabel = hubPage ? shopCategoryLabel(hubPage) : label;
  const displayIntro = hubPage?.intro_text ?? desc;

  const contentSections = hubPage ? buildCategoryHubSections(hubPage, displayLabel) : [];

  const faqs = hubPage?.faqs ?? [];
  const howToSteps = hubPage?.how_to_wear_html
    ? hubPage.how_to_wear_html.replace(/<[^>]+>/g, ' ').split(/\.\s+/).filter((s) => s.trim().length > 20).slice(0, 5)
    : [];

  return (
    <>
      {meta?.seoLanding ? (
        <SeoLandingHeader landing={meta.seoLanding} total={total} />
      ) : hubPage ? (
        <CategoryHubHeader
          label={displayLabel}
          intro={displayIntro}
          imageUrl={hubPage.hero_image_url ?? hubPage.image_url}
          benefits={hubPage.hero_benefits ?? []}
          sections={contentSections}
          faqs={faqs}
        />
      ) : (
        <CategoryHeader label={label} desc={desc} />
      )}

      {meta?.category === 'rudraksha' && !meta?.sub_category && !meta?.catalogSubcategories?.length ? (
        <RudrakshaCategoryGrid />
      ) : null}

      <section id="collection" className="category-hub-collection scroll-mt-40">
        <div className="category-hub-collection__head">
          <div>
            <h2 className="category-hub-collection__title">{displayLabel} Online Collection</h2>
            <p className="category-hub-collection__meta">
              {total} certified products · Expert consultation available
            </p>
          </div>
          <Link href="/consultation" className="category-hub-collection__cta hidden sm:inline-flex">
            <MessageCircleQuestion className="category-hub-collection__cta-icon" aria-hidden />
            Ask an Expert
          </Link>
        </div>

        <FilterBar
          total={total}
          facets={facets}
          showCategoryFilter={!meta?.category}
          showSubcategoryFilter={false}
        />
        <div className="mt-6">
          <ProductGrid products={products} />
        </div>
      </section>

      {meta?.seoLanding ? <SeoLandingFooter landing={meta.seoLanding} products={products} /> : null}

      {hubPage ? (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Shop', href: '/shop' },
              { name: displayLabel, href: basePath },
            ]),
            collectionPageJsonLd({
              title: hubPage.seo_title ?? displayLabel,
              description: hubPage.seo_description ?? displayIntro,
              path: basePath,
            }),
            ...(faqJsonLd(faqs) ? [faqJsonLd(faqs)!] : []),
            ...(itemListJsonLd(
              products.slice(0, 12).map((product, index) => ({
                name: formatProductDisplayName(product.name),
                href: productHref(product),
                position: index + 1,
              })),
            )
              ? [
                  itemListJsonLd(
                    products.slice(0, 12).map((product, index) => ({
                      name: formatProductDisplayName(product.name),
                      href: productHref(product),
                      position: index + 1,
                    })),
                  )!,
                ]
              : []),
            ...(howToSteps.length >= 2 && hubPage
              ? [
                  howToJsonLd({
                    ...getHowToStructuredDataMeta(hubPage, displayLabel),
                    steps: howToSteps,
                    path: `${basePath}#how-to-wear`,
                  }),
                ]
              : []),
          ]}
        />
      ) : null}

      <ShopPagination page={filters.page} totalPages={totalPages} searchParams={searchParams} basePath={basePath} />
    </>
  );
}

function CategoryHeader({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="mb-4 rounded-lg border border-brand-border bg-[linear-gradient(135deg,#fffdf8_0%,#fff5df_52%,#f8eee0_100%)] px-5 py-4">
      <h1 className="font-heading text-xl text-brand-primary md:text-2xl">{label}</h1>
      <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-amber-700">{desc}</p>
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
          <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-muted md:text-base">{landing.intro}</p>
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
      <p className="mt-4 border-l-2 border-brand-accent pl-4 text-sm leading-7 text-brand-primary">{landing.advisory}</p>
    </section>
  );
}

function SeoLandingFooter({ landing, products }: { landing: SeoLandingPage; products: ProductCard[] }) {
  const faq = faqJsonLd(landing.faqs);
  const itemList = itemListJsonLd(
    products.slice(0, 12).map((product, index) => ({
      name: formatProductDisplayName(product.name),
      href: productHref(product),
      position: index + 1,
    })),
  );

  return (
    <section className="mt-10 space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="border border-brand-border bg-brand-surface p-5">
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Supporting Options</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {landing.supportingGemNames.map((gem) => (
              <span key={gem} className="border border-brand-border px-3 py-2 text-xs font-semibold text-brand-muted">
                {gem}
              </span>
            ))}
          </div>
        </div>
        <div className="border border-brand-border bg-brand-surface p-5">
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Related Knowledge</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {landing.relatedKnowledge.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border border-brand-primary px-3 py-2 text-xs font-bold uppercase tracking-[1.2px] text-brand-primary transition hover:bg-brand-primary hover:text-brand-bg"
              >
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

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', href: '/' },
            { name: 'Shop', href: '/shop' },
            { name: landing.title, href: landing.href },
          ]),
          collectionPageJsonLd({
            title: landing.title,
            description: landing.description,
            path: landing.href,
            items: landing.primaryGemNames.map((name, index) => ({
              name,
              href: shopCategoryHref(landing.primaryGemSlugs[index] ?? ''),
            })),
          }),
          ...(faq ? [faq] : []),
          ...(itemList ? [itemList] : []),
        ]}
      />
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

  const hubPage = await fetchShopCategoryPage(category);
  const rawParams = await searchParams;
  const sParams = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? '')]),
  ) as Record<string, string>;
  const currentPath = shopCategoryHref(category);

  if (meta.canonicalPath && meta.canonicalPath !== currentPath) {
    const query = new URLSearchParams(sParams).toString();
    redirect(`${meta.canonicalPath}${query ? `?${query}` : ''}`);
  }

  const displayLabel = hubPage ? shopCategoryLabel(hubPage) : meta.label;

  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-24 pt-28 md:px-6 md:pt-32 lg:px-10">
      <div className="mx-auto max-w-350">
        <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-brand-muted" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-brand-accent">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="transition hover:text-brand-accent">
            Shop
          </Link>
          <span>/</span>
          <span className="text-brand-primary">{displayLabel}</span>
        </nav>

        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="h-48 w-full animate-pulse rounded-2xl bg-brand-border" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-brand-border" />
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-brand-border">
                    <div className="relative animate-pulse bg-brand-border" style={{ paddingBottom: '120%' }} />
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <CategoryProducts
            categorySlug={category}
            searchParams={sParams}
            label={meta.label}
            desc={meta.desc}
            hubPage={hubPage}
          />
        </Suspense>
      </div>
    </main>
  );
}
