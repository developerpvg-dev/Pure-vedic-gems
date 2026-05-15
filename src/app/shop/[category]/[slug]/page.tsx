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
import { buildMetadata } from '@/lib/utils/seo';

export const revalidate = 300;

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractImages(images: Json): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter((img): img is string => typeof img === 'string');
}

function buildSKUMeta(product: Product): string {
  const parts: string[] = [];
  if (product.carat_weight) parts.push(`${product.carat_weight.toFixed(2)} ct`);
  if (product.origin) parts.push(product.origin);
  if (product.shape) parts.push(product.shape);
  if (product.treatment && product.treatment !== 'none') parts.push(product.treatment);
  if (product.certification) parts.push(product.certification);
  return parts.join(' · ');
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
  const unavailable =
    !product.in_stock || ['sold', 'reserved', 'out_of_stock', 'archived'].includes(product.availability_status ?? '');
  const ratedReviews = reviews.filter((review) => typeof review.rating === 'number');
  const averageRating = ratedReviews.length > 0
    ? ratedReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / ratedReviews.length
    : null;

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.short_desc ?? product.meta_description ?? '',
    sku: product.sku,
    image: images.length > 0 ? images : undefined,
    brand: { '@type': 'Brand', name: 'PureVedicGems' },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}${href}`,
      priceCurrency: 'INR',
      price: product.price,
      availability: unavailable ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
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

  return buildMetadata({
    title: product.meta_title ?? `${product.name} | PureVedicGems`,
    description: product.meta_description ?? product.short_desc ?? `Buy ${product.name} at PureVedicGems`,
    path: href,
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
          primary: { label: 'Get Rudraksha Guidance', href: '/configure' },
          secondary: { label: 'See Rudraksha Collection', href: '/shop/rudraksha' },
          imageSide: 'left' as const,
        }
      : variant === 'uparatna'
        ? {
            title: 'Need a practical gemstone alternative?',
            copy: 'Share your birth details with our experts and get a practical Uparatna recommendation for planetary support, comfort, and budget.',
            image: '/home/ctas/cta3.webp',
            imageAlt: 'Vedic astrologer reviewing semi-precious gemstone alternatives',
            primary: { label: 'Get Uparatna Guidance', href: '/configure' },
            secondary: { label: 'See Uparatna Collection', href: '/shop/upratna' },
            imageSide: 'right' as const,
          }
        : {
            title: 'Not sure which gemstone is good for you?',
            copy: 'Share your birth details with our experts and get a clear, horoscope-led gemstone recommendation before you buy.',
            image: '/home/ctas/cta1.webp',
            imageAlt: 'Vedic gemstone consultants preparing a horoscope recommendation',
            primary: { label: 'Get Gem Recommendation', href: '/configure' },
            secondary: { label: 'See Navaratna Collection', href: '/shop/navaratna' },
            imageSide: 'right' as const,
          };
  const isReverse = config.imageSide === 'right';

  return (
    <div className="mt-12">
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
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-brand-border bg-white/80 p-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 rounded-md bg-[#fffaf2] px-3 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#7A1515]/10 text-[#7A1515]">
            <item.icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[12px] font-normal leading-4 text-brand-text">{item.label}</span>
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

  const relatedPromise = supabase
    .from('products')
    .select('id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price, carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url, in_stock, stock_quantity, stock_status, sold_individually, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled, product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number')
    .eq('category', product.category)
    .eq('is_active', true)
    .eq('in_stock', true)
    .neq('slug', slug)
    .limit(6);

  const reviewPromise = supabase
    .from('reviews')
    .select('id, customer_name, customer_location, rating, title, review_text, is_verified, created_at')
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(8);

  const expertPromise = product.expert_id
    ? supabase
        .from('experts')
        .select('id, name, title, photo_url, specialty, personal_quote')
        .eq('id', product.expert_id)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [relatedResult, reviewResult, expertResult] = await Promise.all([
    relatedPromise,
    reviewPromise,
    expertPromise,
  ]);

  const images = extractImages(product.images as Json);
  const skuMeta = buildSKUMeta(product);
  const related = (relatedResult.data ?? []) as unknown as ProductCardType[];
  const reviews = (reviewResult.data ?? []) as unknown as ProductReview[];
  const expert = expertResult.data as {
    id: string; name: string; title: string | null;
    photo_url: string | null; specialty: string | null;
    personal_quote: string | null;
  } | null;
  const parentCategoryHref = href.split('/').slice(0, 3).join('/');
  const categoryListingHref = product.sub_category ? `${parentCategoryHref}/${product.sub_category}` : parentCategoryHref;
  const recentlyViewedProduct: RecentlyViewedProduct = {
    id: product.id,
    name: product.name,
    href,
    imageUrl: product.thumbnail_url ?? images[0] ?? null,
    price: product.price,
    meta: skuMeta || null,
  };

  const categoryLabel =
    product.sub_category
      ? product.sub_category.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')
      : product.category.charAt(0).toUpperCase() + product.category.slice(1) + 's';

  return (
    <>
      <ProductJsonLd product={product} href={href} reviews={reviews} />

      <main className="min-h-screen bg-[#fbf7ef] px-4 pb-24 pt-24 font-body md:px-6 md:pt-29 lg:px-8">
        <div className="mx-auto max-w-340">

          {/* ── Breadcrumb ── */}
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-brand-muted">
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
            <span className="line-clamp-1 text-brand-primary">{product.name}</span>
          </nav>

          {/* ── Main Grid: Gallery | Info — true 50/50 on desktop ── */}
          <div className="grid gap-7 md:gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]">

            {/* ─── Left: Gallery ─── */}
            <div className="lg:sticky lg:top-22.5 lg:self-start">
              <ProductGallery images={images} productName={product.name} />

              {/* Video if available */}
              {product.video_url && (
                <div className="mt-4 overflow-hidden rounded-xl border border-brand-border">
                  <video
                    src={product.video_url}
                    controls
                    className="w-full"
                    preload="metadata"
                  />
                </div>
              )}
            </div>

            {/* ─── Right: Info panel ─── */}
            <div className="space-y-5 rounded-lg border border-brand-border bg-white p-5 shadow-[0_18px_54px_rgba(61,43,31,0.08)] md:p-6">
              {/* Product name + SKU */}
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {product.certification && (
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

                <h1 className="text-[clamp(22px,2.5vw,34px)] font-normal leading-tight text-[#7A1515]">
                  {product.name}
                </h1>

                {skuMeta && (
                  <p className="mt-2 text-[13px] font-normal text-brand-muted">
                    {skuMeta}
                  </p>
                )}

                <p className="mt-2 text-[12px] font-medium tracking-[0.08em] text-brand-muted">
                  SKU: {product.sku}
                </p>
              </div>

              {/* Price */}
              <PriceDisplay
                price={product.price}
                comparePrice={product.compare_price}
                pricePerCarat={product.price_per_carat}
                caratWeight={product.carat_weight}
              />

              <ProductAssuranceStrip />

              {/* Gemstone quick specs */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-brand-border bg-brand-bg p-4 sm:grid-cols-3">
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
                  { label: 'Lab', value: product.certificate_lab ?? product.certification },
                  { label: 'Certificate No.', value: product.certificate_number },
                  { label: 'Planet', value: product.planet },
                  { label: 'Rashi', value: product.rashi },
                  { label: 'Vedic Name', value: product.vedic_name },
                  { label: 'Energization', value: product.energization_eligible ? 'Eligible' : null },
                  { label: 'Jewellery', value: product.configurator_enabled ? 'Configurable' : null },
                ]
                  .filter(({ value }) => !!value)
                  .map(({ label, value }) => (
                    <div key={label} className="min-w-0">
                      <p className="text-[10px] font-normal text-brand-muted">
                        {label}
                      </p>
                      <p className="mt-1 truncate text-[13px] font-normal text-brand-text">{value}</p>
                    </div>
                  ))}
              </div>

              {/* Add to Cart */}
              <AddToCartBar product={product} />

              {/* Expert Note */}
              {(product.expert_note || expert) && (
                <div className="rounded-xl border border-brand-gold-light bg-brand-gold-light p-4">
                  <p className="mb-2.5 text-[12px] font-medium text-brand-accent">
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
          <div className="mt-16">
            <ProductTabs product={product} reviews={reviews} />
          </div>

          {/* ── Expert Guidance CTA — below the tabs ── */}
          <ProductCategoryCta product={product} />

          <RecentlyViewedProducts current={recentlyViewedProduct} />

          {/* ── Related Products ── */}
          {related.length > 0 && (
            <section className="mt-16">
              <OrnamentalDivider className="mb-6" />
              <div className="mb-5 text-center">
                <h2 className="text-2xl font-medium text-[#7A1515]">
                  Related Gemstones
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
