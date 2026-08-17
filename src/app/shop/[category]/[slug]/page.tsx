import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import { resolveShopCategoryPath } from '@/lib/categories/shop';
import { productHref } from '@/lib/categories/storefront';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { CategoryProductListing } from '@/components/shop/CategoryProductListing';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { ProductTabs, type ProductReview } from '@/components/shop/ProductTabs';
import { PriceDisplay } from '@/components/shop/PriceDisplay';
import { AddToCartBar } from '@/components/shop/AddToCartBar';
import { ProductCard } from '@/components/shop/ProductCard';
import { RecentlyViewedProducts, type RecentlyViewedProduct } from '@/components/shop/RecentlyViewedProducts';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import type { Product, ProductCard as ProductCardType } from '@/lib/types/product';
import type { Json } from '@/lib/types/database';
import { buildMetadata, productMetadata } from '@/lib/utils/seo';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { getDisplayReviewsForProduct, usesCategoryReviewPool } from '@/lib/reviews/category-pool';
import { isGemConfiguratorEnabled } from '@/lib/shop/configurator';
import {
  productOfferAvailability,
  productStructuredOfferPrice,
} from '@/lib/shop/product-pricing';
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

const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  return data ? (data as unknown as Product) : null;
});

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

function ProductJsonLd({
  product,
  href,
  reviews,
}: {
  product: Product;
  href: string;
  reviews: ProductReview[];
}) {
  const images = extractImages(product.images);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://purevedicgems.com';
  const pricing = {
    price: product.price,
    price_per_carat: product.price_per_carat,
    carat_weight: product.carat_weight,
    price_mode: product.price_mode,
    in_stock: product.in_stock,
    stock_quantity: product.stock_quantity,
    availability_status: product.availability_status,
    sold_individually: product.sold_individually,
  };
  const structuredPrice = productStructuredOfferPrice(pricing);
  const offerAvailability = productOfferAvailability(pricing);
  const displayName = productHeading(product);
  const ratedReviews = reviews.filter((review) => typeof review.rating === 'number');
  const averageRating = ratedReviews.length > 0
    ? ratedReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / ratedReviews.length
    : null;

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: displayName,
    description: product.short_desc ?? product.meta_description ?? '',
    sku: product.sku,
    image: images.length > 0 ? images : undefined,
    brand: { '@type': 'Brand', name: 'PureVedicGems' },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}${href}`,
      priceCurrency: 'INR',
      price: structuredPrice,
      availability: offerAvailability,
      seller: { '@type': 'Organization', name: 'PureVedicGems' },
    },
    ...(averageRating != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Math.round(averageRating * 10) / 10,
            reviewCount: reviews.length,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

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

function ProductCategoryCta({ product }: { product: Product }) {
  const category = product.category?.toLowerCase() ?? '';
  const variant =
    category === 'rudraksha'
      ? 'rudraksha'
      : category === 'upratna' || category === 'uparatna'
        ? 'uparatna'
        : 'navaratna';
  const config =
    variant === 'rudraksha'
      ? {
          title: 'Not sure which Rudraksha is right for you?',
          copy: 'Share your birth details or spiritual goal with our experts and get a clear, mukhi-led Rudraksha recommendation before you buy.',
          image: '/home/ctas/cta2.webp',
          imageAlt: 'Rudraksha expert offering personalised guidance',
          primary: { label: 'Get Rudraksha Guidance', href: '/consultation' },
          secondary: { label: 'See Rudraksha Collection', href: '/shop/rudraksha' },
          imageSide: 'left' as const,
        }
      : variant === 'uparatna'
        ? {
            title: 'Need a practical gemstone alternative?',
            copy: 'Share your birth details with our experts and get a practical Uparatna recommendation for planetary support, comfort, and budget.',
            image: '/home/ctas/cta3.webp',
            imageAlt: 'Vedic astrologer reviewing semi-precious gemstone alternatives',
            primary: { label: 'Get Uparatna Guidance', href: '/consultation' },
            secondary: { label: 'See Uparatna Collection', href: '/shop/upratna' },
            imageSide: 'right' as const,
          }
        : {
            title: 'Not sure which gemstone is good for you?',
            copy: 'Share your birth details with our experts and get a clear, horoscope-led gemstone recommendation before you buy.',
            image: '/home/ctas/cta1.webp',
            imageAlt: 'Vedic gemstone consultants preparing a horoscope recommendation',
            primary: { label: 'Get Gem Recommendation', href: '/consultation' },
            secondary: { label: 'See Navaratna Collection', href: '/shop/navaratna' },
            imageSide: 'right' as const,
          };
  const isReverse = config.imageSide === 'right';

  return (
    <div className="pvg-react-home-root mt-12 overflow-x-clip">
      <section
        className={`pvg-rcta-v2 pvg-rcta-v2-${variant}${isReverse ? ' pvg-rcta-v2-reverse' : ''}`}
        aria-label={config.title}
      >
        <div className="pvg-rcta-v2-circle" aria-hidden="true" />

        <div className="pvg-rcta-v2-layout">
          <div className="pvg-rcta-v2-person-col" aria-hidden="true">
            <div className="pvg-rcta-v2-person-wrap">
              <Image
                fill
                className="pvg-rcta-v2-person-img"
                src={config.image}
                alt={config.imageAlt}
                loading="lazy"
                sizes="(max-width: 768px) 300px, 500px"
              />
            </div>
          </div>

          <div className="pvg-rcta-v2-card">
            <div className="pvg-rcta-v2-top">
              <h2 className="pvg-rcta-v2-heading">{config.title}</h2>
            </div>

            <div className="pvg-rcta-v2-bottom">
              <p className="pvg-rcta-v2-copy">{config.copy}</p>

              <div className="pvg-rcta-v2-btns">
                <Link href={config.primary.href} className="pvg-rcta-v2-btn-chat">{config.primary.label}</Link>
                <Link href={config.secondary.href} className="pvg-rcta-v2-btn-call">{config.secondary.label}</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="pvg-rcta-v2-mobile-actions">
          <Link href={config.primary.href} className="pvg-rcta-v2-btn-mobile pvg-rcta-v2-btn-mobile-primary">{config.primary.label}</Link>
          <Link href={config.secondary.href} className="pvg-rcta-v2-btn-mobile pvg-rcta-v2-btn-mobile-secondary">{config.secondary.label}</Link>
        </div>
      </section>
    </div>
  );
}

function ProductAssuranceStrip() {
  const items = [
    { icon: ShieldCheck, label: 'Lab Certified' },
    { icon: BadgeCheck, label: 'Natural & Genuine' },
    { icon: Sparkles, label: 'Vedic Energization' },
    { icon: Truck, label: 'Insured Delivery' },
  ];

  return (
    <div className="product-assurance-strip grid grid-cols-2 gap-1.5 rounded-lg border border-brand-border bg-white/80 p-2 lg:grid-cols-4 lg:gap-2 lg:p-3">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 items-center gap-1.5 rounded-md bg-[#fffaf2] px-2 py-1.5 lg:gap-2 lg:px-3 lg:py-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#7A1515]/10 text-[#7A1515] lg:h-7 lg:w-7">
            <item.icon className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          </span>
          <span className="min-w-0 text-[10px] font-normal leading-tight text-brand-text lg:text-[12px] lg:leading-4">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { category, slug } = await params;
  const rawSearchParams = await searchParams;
  const nestedCategoryMeta = await resolveShopCategoryPath(category, slug);
  const sParams = Object.fromEntries(
    Object.entries(rawSearchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : (value ?? '')])
  ) as Record<string, string>;

  if (nestedCategoryMeta) {
    const currentPath = `/shop/${category}/${slug}`;
    if (nestedCategoryMeta.canonicalPath !== currentPath) {
      const query = new URLSearchParams(sParams).toString();
      redirect(`${nestedCategoryMeta.canonicalPath}${query ? `?${query}` : ''}`);
    }

    return (
      <main className="min-h-screen bg-brand-bg px-4 pb-24 pt-32.5 md:px-6 lg:px-10">
        <div className="mx-auto max-w-350">
          <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-brand-muted">
            <Link href="/" className="transition hover:text-brand-accent">Home</Link>
            <span>/</span>
            <Link href="/shop" className="transition hover:text-brand-accent">Shop</Link>
            <span>/</span>
            <span className="text-brand-primary">{nestedCategoryMeta.label}</span>
          </nav>

          <div className="flex gap-7">
            <ShopSidebar />
            <div className="min-w-0 flex-1">
              <CategoryProductListing meta={nestedCategoryMeta} searchParams={sParams} basePath={nestedCategoryMeta.canonicalPath} />
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
  const currentPath = `/shop/${category}/${slug}`;
  if (href !== currentPath) {
    redirect(href);
  }

  const relatedSelect = 'id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price, carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url, in_stock, stock_quantity, stock_status, sold_individually, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled, product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number';
  const relatedPromise = product.sub_category
    ? supabase
        .from('products')
        .select(relatedSelect)
        .eq('category', product.category)
        .eq('sub_category', product.sub_category)
        .eq('is_active', true)
        .neq('slug', slug)
        .order('in_stock', { ascending: false })
        .limit(8)
    : supabase
        .from('products')
        .select(relatedSelect)
        .eq('category', product.category)
        .eq('is_active', true)
        .neq('slug', slug)
        .order('in_stock', { ascending: false })
        .limit(8);

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
  const parentCategoryHref = href.split('/').slice(0, 3).join('/');
  const categoryListingHref = product.sub_category ? `${parentCategoryHref}/${product.sub_category}` : parentCategoryHref;
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

  return (
    <>
      <ProductJsonLd product={product} href={href} reviews={reviews} />

      <main className="pvg-product-page min-h-screen overflow-x-clip bg-[#fbf7ef] px-3 pb-24 pt-28 font-body lg:px-8 lg:pt-32">
        <div className="mx-auto min-w-0 max-w-340">

          {/* ── Breadcrumb ── */}
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-[11px] font-medium text-brand-muted lg:mb-6 lg:gap-1.5 lg:text-[13px]">
            <Link href="/" className="transition hover:text-brand-accent">Home</Link>
            <span>/</span>
            <Link href="/shop" className="transition hover:text-brand-accent">Shop</Link>
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
              <ProductGallery images={galleryImages} productName={displayName} videoUrl={product.video_url} />
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

              {/* Gemstone quick specs */}
              <div className="product-spec-grid grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-lg border border-brand-border bg-brand-bg p-2 md:gap-x-2.5 md:gap-y-2 md:p-2.5 lg:grid-cols-3 lg:gap-3 lg:p-4">
                {[
                  { label: 'Tag', value: product.tag_number },
                  { label: 'Availability', value: formatLabel(product.availability_status) },
                  { label: 'Weight', value: product.carat_weight ? `${product.carat_weight.toFixed(2)} ct` : null },
                  { label: 'Ratti', value: product.ratti_weight ? `${product.ratti_weight.toFixed(2)} rt` : null },
                  { label: 'Origin', value: product.origin },
                  { label: 'Origin Region', value: product.origin_region ?? product.origin_display },
                  { label: 'Shape', value: product.shape },
                  { label: 'Colour', value: product.color_grade },
                  { label: 'Clarity', value: product.clarity },
                  { label: 'Quality', value: product.quality_label ?? product.commercial_quality_grade },
                  { label: 'Treatment', value: product.treatment_summary ?? formatLabel(product.treatment) },
                  { label: 'Dimensions', value: formatDimensions(product.dimensions_mm) },
                  ...(!isNoCertification(product.certification)
                    ? [
                        { label: 'Lab', value: product.certificate_lab ?? product.certification },
                        { label: 'Certificate No.', value: product.certificate_number },
                      ]
                    : []),
                  { label: 'Planet', value: product.planet },
                  { label: 'Rashi', value: product.rashi },
                  { label: 'Vedic Name', value: product.vedic_name },
                  { label: 'Energization', value: product.energization_eligible ? 'Eligible' : null },
                  { label: 'Jewellery', value: isGemConfiguratorEnabled(product.category, product.configurator_enabled) ? 'Configurable' : null },
                ]
                  .filter(({ value }) => !!value)
                  .map(({ label, value }) => (
                    <div key={label} className="min-w-0">
                      <p className="text-[9px] font-normal text-brand-muted lg:text-[10px]">
                        {label}
                      </p>
                      <p className="product-spec-value mt-0.5 break-words text-[11px] font-normal leading-snug text-brand-text lg:mt-1 lg:text-[13px]">{value}</p>
                    </div>
                  ))}
              </div>

              {/* Add to Cart */}
              <AddToCartBar product={product} />

              <ProductAssuranceStrip />

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

          {/* ── Tabs: Description, Vedic, Certificate, Wearing, Reviews ── */}
          <div className="product-tabs-section mt-8 lg:mt-16">
            <ProductTabs
              product={product}
              reviews={reviews}
              reviewPoolLabel={
                usesCategoryReviewPool(product.category, product.sub_category) ? categoryLabel : null
              }
            />
          </div>

          {/* ── Expert Guidance CTA — below the tabs ── */}
          <ProductCategoryCta product={product} />

          <RecentlyViewedProducts current={recentlyViewedProduct} />

          {/* ── Related Products ── */}
          {related.length > 0 && (
            <section className="mt-10 lg:mt-16">
              <OrnamentalDivider className="mb-4 lg:mb-6" />
              <div className="mb-3 text-center lg:mb-5">
                <h2 className="text-xl font-medium text-[#7A1515] lg:text-2xl">
                  Related Gemstones
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
