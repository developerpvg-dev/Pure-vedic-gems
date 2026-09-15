import { notFound, permanentRedirect } from 'next/navigation';
import { cache, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { resolveShopCategoryPath, type ResolvedShopCategory } from '@/lib/categories/shop';
import { productHref } from '@/lib/categories/storefront';
import { toInternalShopPath } from '@/lib/categories/canonical-storefront-path';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { CategoryProductListing } from '@/components/shop/CategoryProductListing';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { ProductAssuranceStrip } from '@/components/shop/ProductAssuranceStrip';
import { ProductTabs } from '@/components/shop/ProductTabs';
import { PriceDisplay } from '@/components/shop/PriceDisplay';
import { AddToCartBar } from '@/components/shop/AddToCartBar';
import { ShopCollectionCta } from '@/components/shop/ShopCollectionCta';
import { ProductPurchasePolicies } from '@/components/shop/ProductPurchasePolicies';
import { ProductVisitStores } from '@/components/shop/ProductVisitStores';
import { RelatedProductsCarousel } from '@/components/shop/RelatedProductsCarousel';
import { RecentlyViewedProducts, type RecentlyViewedProduct } from '@/components/shop/RecentlyViewedProducts';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Product, ProductCard as ProductCardType } from '@/lib/types/product';
import type { Json } from '@/lib/types/database';
import { breadcrumbJsonLd, buildMetadata, productJsonLd, productMetadata } from '@/lib/utils/seo';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { getDisplayReviewsForProduct, usesCategoryReviewPool } from '@/lib/reviews/category-pool';
import { isGemConfiguratorEnabled } from '@/lib/shop/configurator';
import { buildProductGalleryImages } from '@/lib/shop/gallery-media';
import { isNoCertification } from '@/lib/utils/format';

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

function extractImages(images: Json): string[] {
  if (!Array.isArray(images)) return [];
  const urls: string[] = [];
  for (const item of images) {
    if (typeof item === 'string') {
      urls.push(item);
    } else if (item && typeof item === 'object' && 'url' in item && typeof (item as { url: unknown }).url === 'string') {
      urls.push((item as { url: string }).url);
    }
  }
  return urls;
}

function buildSKUMeta(product: Product): string {
  const parts: string[] = [];
  if (product.carat_weight) parts.push(`${product.carat_weight.toFixed(2)} ct`);
  if (product.origin) parts.push(product.origin);
  if (product.shape) parts.push(product.shape);
  if (product.treatment && product.treatment !== 'none') parts.push(product.treatment);
  if (product.certification && !isNoCertification(product.certification)) parts.push(product.certification);
  return parts.join(' · ');
}

function productHeading(product: Product): string {
  return formatProductDisplayName(product.name) || product.sku || product.sub_category || 'Certified Natural Gemstone';
}

function formatLabel(value?: string | null) {
  if (!value) return null;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDimensions(dimensions: Product['dimensions_mm']) {
  if (!dimensions) return null;
  const parts = [dimensions.length, dimensions.width, dimensions.depth]
    .filter((value): value is number => typeof value === 'number')
    .map((value) => value.toFixed(1));
  if (parts.length === 0) return null;
  return `${parts.join(' x ')} ${dimensions.unit ?? 'mm'}`;
}

const getProductBySlug = cache(async (slug: string): Promise<(Product & { lab_logo?: { name: string; image_url: string } | null }) | null> => {
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('products')
    .select('*, lab_logo:storefront_lab_logos!lab_logo_id(name, image_url)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  return data ? (data as unknown as Product & { lab_logo?: { name: string; image_url: string } | null }) : null;
});

// ─── generateMetadata ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const categoryMeta = await resolveShopCategoryPath(category, slug);
  if (categoryMeta) {
    return buildMetadata({
      title: `${categoryMeta.label} | PureVedicGems`,
      description: categoryMeta.desc,
      path: categoryMeta.canonicalPath,
    });
  }

  const product = await getProductBySlug(slug);
  if (!product) return {};
  const images = extractImages((product.images as Json) ?? []);
  const imageUrl = product.thumbnail_url ?? images[0];
  const href = productHref(product);

  return productMetadata(product, href, {
    title: product.meta_title,
    description: product.meta_description,
    image: imageUrl,
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface ProductDetailPageProps {
  params: Promise<{ category: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function NestedCategoryListing({
  meta,
  searchParams,
}: {
  meta: ResolvedShopCategory;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const rawSearchParams = await searchParams;
  const sParams = Object.fromEntries(
    Object.entries(rawSearchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : (value ?? '')]),
  ) as Record<string, string>;
  return (
    <CategoryProductListing meta={meta} searchParams={sParams} basePath={meta.canonicalPath} />
  );
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { category, slug } = await params;
  const nestedCategoryMeta = await resolveShopCategoryPath(category, slug);

  if (nestedCategoryMeta) {
    const requestPath = `/shop/${category}/${slug}`;
    const internal = toInternalShopPath(nestedCategoryMeta.canonicalPath) ?? nestedCategoryMeta.canonicalPath;
    if (requestPath !== internal) {
      permanentRedirect(nestedCategoryMeta.canonicalPath);
    }

    return (
      <main className="min-h-screen bg-brand-bg px-4 pb-24 pt-32.5 md:px-6 lg:px-10">
        <div className="mx-auto max-w-350">
          <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-brand-muted">
            <Link href="/" className="transition hover:text-brand-accent">Home</Link>
            <span>/</span>
            <Link href="/gemstones" className="transition hover:text-brand-accent">Gemstones</Link>
            <span>/</span>
            <span className="text-brand-primary">{nestedCategoryMeta.label}</span>
          </nav>

          <div className="flex gap-7">
            <ShopSidebar />
            <div className="min-w-0 flex-1">
              <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-brand-border" />}>
                <NestedCategoryListing meta={nestedCategoryMeta} searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const supabase = createOptionalPublicClient();
  if (!supabase) {
    notFound();
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }
  const href = productHref(product);
  const requestPath = `/shop/${category}/${slug}`;
  const internal = toInternalShopPath(href) ?? href;
  if (requestPath !== internal) {
    permanentRedirect(href);
  }

  const relatedSelect = 'id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price, carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url, in_stock, stock_quantity, stock_status, sold_individually, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled, product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number, lab_logo:storefront_lab_logos!lab_logo_id(name, image_url)';
  const relatedPromise = product.sub_category
    ? supabase
        .from('products')
        .select(relatedSelect)
        .eq('category', product.category)
        .eq('sub_category', product.sub_category)
        .eq('is_active', true)
        .neq('slug', slug)
        .order('in_stock', { ascending: false })
        .limit(10)
    : supabase
        .from('products')
        .select(relatedSelect)
        .eq('category', product.category)
        .eq('is_active', true)
        .neq('slug', slug)
        .order('in_stock', { ascending: false })
        .limit(10);

  const reviewPromise = getDisplayReviewsForProduct(supabase, product);

  const expertPromise = product.expert_id
    ? supabase
        .from('experts')
        .select('id, name, title, photo_url, specialty, personal_quote')
        .eq('id', product.expert_id)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [relatedResult, reviews, expertResult] = await Promise.all([
    relatedPromise,
    reviewPromise,
    expertPromise,
  ]);

  const images = extractImages(product.images as Json);
  const galleryImages = buildProductGalleryImages(
    images,
    product.certificate_url || product.certificate_file_url,
  );
  const skuMeta = buildSKUMeta(product);
  const displayName = productHeading(product);
  const related = (relatedResult.data ?? []) as unknown as ProductCardType[];
  const expert = expertResult.data as {
    id: string; name: string; title: string | null;
    photo_url: string | null; specialty: string | null;
    personal_quote: string | null;
  } | null;
  const categoryListingHref = href.split('/').slice(0, -1).join('/') || '/shop';
  const recentlyViewedProduct: RecentlyViewedProduct = {
    id: product.id,
    name: displayName,
    href,
    imageUrl: product.thumbnail_url ?? images[0] ?? null,
    price: product.price,
    meta: skuMeta || null,
  };

  const categoryLabel =
    product.sub_category
      ? product.sub_category
          .split('-')
          .filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : product.category
        ? product.category.charAt(0).toUpperCase() + product.category.slice(1) + 's'
        : 'Shop';

  const productSpecs = [
    { label: 'Availability', value: formatLabel(product.availability_status) },
    { label: 'Weight', value: product.carat_weight ? `${product.carat_weight.toFixed(2)} ct` : null },
    { label: 'Ratti', value: product.ratti_weight ? `${product.ratti_weight.toFixed(2)} rt` : null },
    { label: 'Origin Region', value: product.origin_region ?? product.origin_display ?? product.origin },
    { label: 'Shape', value: product.shape },
    { label: 'Quality', value: product.quality_label ?? product.commercial_quality_grade },
    { label: 'Treatment', value: product.treatment_summary ?? formatLabel(product.treatment) },
    { label: 'Colour', value: product.color_grade },
    { label: 'Clarity', value: product.clarity },
    { label: 'Dimensions', value: formatDimensions(product.dimensions_mm) },
    ...(!isNoCertification(product.certification)
      ? [{ label: 'Lab', value: product.certificate_lab ?? product.certification }]
      : []),
    {
      label: 'Jewellery',
      value: isGemConfiguratorEnabled(product.category, product.configurator_enabled)
        ? 'Configurable'
        : null,
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product, href, {
            images: images.length > 0 ? images : product.thumbnail_url ? [product.thumbnail_url] : [],
            displayName,
            reviews,
          }),
          breadcrumbJsonLd([
            { name: 'Home', href: '/' },
            { name: 'Gemstones', href: '/gemstones' },
            { name: categoryLabel, href: categoryListingHref },
            { name: displayName, href },
          ]),
        ]}
      />

      <main className="pvg-product-page min-h-screen overflow-x-clip bg-[#fbf7ef] px-3 pb-24 pt-28 font-body lg:px-8 lg:pt-32">
        <div className="mx-auto min-w-0 max-w-340">

          {/* ── Breadcrumb ── */}
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-[11px] font-medium text-brand-muted lg:mb-6 lg:gap-1.5 lg:text-[13px]">
            <Link href="/" className="transition hover:text-brand-accent">Home</Link>
            <span>/</span>
            <Link href="/gemstones" className="transition hover:text-brand-accent">Gemstones</Link>
            <span>/</span>
            <Link
              href={categoryListingHref}
              className="transition hover:text-brand-accent"
            >
              {categoryLabel}
            </Link>
            <span>/</span>
            <span className="line-clamp-1 text-brand-primary">{displayName}</span>
          </nav>

          {/* ── Main Grid: Gallery | Info — true 50/50 on desktop ── */}
          <div className="product-detail-main-grid grid min-w-0 gap-3 md:grid-cols-2 md:items-start md:gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]">

            {/* ─── Left: Gallery ─── */}
            <div className="min-w-0 md:sticky md:top-24 md:self-start lg:top-22.5">
              <ProductGallery
                images={galleryImages}
                productName={displayName}
                videoUrl={product.video_url}
                certificateUrl={product.certificate_url || product.certificate_file_url}
                labLogo={
                  product.lab_logo?.image_url && product.lab_logo.name
                    ? { name: product.lab_logo.name, logo: product.lab_logo.image_url }
                    : null
                }
              />
            </div>

            {/* ─── Right: Info panel ─── */}
            <div className="product-info-panel min-w-0 space-y-2 rounded-lg border-0 bg-transparent p-0 shadow-none md:space-y-2.5 lg:space-y-5 lg:border lg:border-brand-border lg:bg-white lg:p-5 lg:shadow-[0_18px_54px_rgba(61,43,31,0.08)] xl:p-6">
              {/* Product name + SKU */}
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-1 lg:mb-2 lg:gap-1.5">
                  {product.certification && !isNoCertification(product.certification) && (
                    <span className="rounded border border-[#7A1515]/25 px-2 py-0.5 text-[10px] font-medium text-[#7A1515]">
                      {product.certification} Certified
                    </span>
                  )}
                  {product.treatment && product.treatment !== 'none' && (
                    <span className="rounded bg-brand-gold-light px-2 py-0.5 text-[10px] font-medium text-brand-muted">
                      {formatLabel(product.treatment)}
                    </span>
                  )}
                </div>

                <h1 className="product-detail-title break-words text-[clamp(18px,4.8vw,34px)] font-normal leading-snug text-[#7A1515] lg:leading-tight">
                  {displayName}
                </h1>

                {skuMeta && (
                  <p className="mt-1 text-[12px] font-normal text-brand-muted lg:mt-2 lg:text-[13px]">
                    {skuMeta}
                  </p>
                )}

                <p className="mt-1 text-[11px] font-medium tracking-[0.06em] text-brand-muted lg:mt-2 lg:text-[12px] lg:tracking-[0.08em]">
                  SKU: {product.sku}
                </p>
              </div>

              {/* Price */}
              <PriceDisplay
                price={product.price}
                comparePrice={product.compare_price}
                pricePerCarat={product.price_per_carat}
                caratWeight={product.carat_weight}
                priceMode={product.price_mode}
              />

              {productSpecs.length > 0 && (
                <div className="product-spec-grid grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-lg border border-brand-border bg-brand-bg p-3 md:gap-x-4 md:p-3.5 lg:grid-cols-3 lg:gap-3 lg:p-4">
                  {productSpecs.map(({ label, value }) => (
                    <div key={label} className="min-w-0">
                      <p className="text-[9px] font-normal text-brand-muted lg:text-[10px]">{label}</p>
                      <p className="product-spec-value mt-0.5 break-words text-[12px] font-medium leading-snug text-brand-text lg:mt-1 lg:text-[13px]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <AddToCartBar product={product} />

              {/* Expert Note */}
              {(product.expert_note || expert) && (
                <div className="rounded-lg border border-brand-gold-light bg-brand-gold-light p-3 lg:rounded-xl lg:p-4">
                  <p className="mb-2 text-[11px] font-medium text-brand-accent lg:mb-2.5 lg:text-[12px]">
                    Expert Note
                  </p>
                  {expert && (
                    <div className="mb-2.5 flex items-start gap-3">
                      {expert.photo_url && (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-brand-accent">
                          <Image
                            src={expert.photo_url}
                            alt={expert.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-semibold text-brand-primary">{expert.name}</p>
                        <p className="text-[11px] text-brand-muted">{expert.specialty ?? expert.title}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-[12px] italic leading-relaxed text-brand-text">
                    &ldquo;{product.expert_note ?? expert?.personal_quote}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Product detail + reviews (no tabs) ── */}
          <div className="product-tabs-section mt-8 lg:mt-16">
            <ProductTabs
              product={product}
              reviews={reviews}
              reviewPoolLabel={
                usesCategoryReviewPool(product.category, product.sub_category) ? categoryLabel : null
              }
            />
          </div>

          {/* ── Expert Guidance CTA ── */}
          <ShopCollectionCta categorySlug={product.category} />

          <ProductPurchasePolicies />

          <ProductAssuranceStrip />

          <RecentlyViewedProducts current={recentlyViewedProduct} />

          {related.length > 0 && <RelatedProductsCarousel products={related} />}

          <ProductVisitStores />
        </div>
      </main>
    </>
  );
}
