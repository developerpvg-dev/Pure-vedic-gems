import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { ProductTabs, type ProductReview } from '@/components/shop/ProductTabs';
import { PriceDisplay } from '@/components/shop/PriceDisplay';
import { AddToCartBar } from '@/components/shop/AddToCartBar';
import { ProductCard } from '@/components/shop/ProductCard';
import { EmiCalculator } from '@/components/shop/EmiCalculator';
import { RecentlyViewedProducts, type RecentlyViewedProduct } from '@/components/shop/RecentlyViewedProducts';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import type { Product, ProductCard as ProductCardType } from '@/lib/types/product';
import type { Json } from '@/lib/types/database';
import { buildMetadata } from '@/lib/utils/seo';

export const revalidate = 60;

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

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

function ProductJsonLd({
  product,
  slug,
  category,
  reviews,
}: {
  product: Product;
  slug: string;
  category: string;
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
      url: `${siteUrl}/shop/${category}/${slug}`,
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
  const supabase = createOptionalPublicClient();
  if (!supabase) return {};

  const { data: productMeta } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!productMeta) return {};

  const product = productMeta as unknown as Product;
  const images = extractImages((product.images as Json) ?? []);
  const imageUrl = product.thumbnail_url ?? images[0];

  return buildMetadata({
    title: product.meta_title ?? `${product.name} | PureVedicGems`,
    description: product.meta_description ?? product.short_desc ?? `Buy ${product.name} at PureVedicGems`,
    path: `/shop/${category}/${slug}`,
    image: imageUrl,
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface ProductDetailPageProps {
  params: Promise<{ category: string; slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { category, slug } = await params;
  const supabase = createOptionalPublicClient();
  if (!supabase) {
    notFound();
  }

  // Fetch primary product (by slug)
  const { data: productData, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !productData) {
    notFound();
  }

  const product = productData as unknown as Product;

  // Fetch related products (same category, different slug, limit 4)
  const { data: relatedData } = await supabase
    .from('products')
    .select('id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price, carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url, in_stock, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled, product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number')
    .eq('category', product.category)
    .eq('is_active', true)
    .eq('in_stock', true)
    .neq('slug', slug)
    .limit(6);

  const { data: reviewData } = await supabase
    .from('reviews')
    .select('id, customer_name, customer_location, rating, title, review_text, is_verified, created_at')
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch expert if set
  let expert: {
    id: string; name: string; title: string | null;
    photo_url: string | null; specialty: string | null;
    personal_quote: string | null;
  } | null = null;

  if (product.expert_id) {
    const { data } = await supabase
      .from('experts')
      .select('*')
      .eq('id', product.expert_id)
      .single();
    if (data) {
      const row = data as unknown as {
        id: string; name: string; title: string | null;
        photo_url: string | null; specialty: string | null;
        personal_quote: string | null;
      };
      expert = {
        id: row.id,
        name: row.name,
        title: row.title,
        photo_url: row.photo_url,
        specialty: row.specialty,
        personal_quote: row.personal_quote,
      };
    }
  }

  const images = extractImages(product.images as Json);
  const skuMeta = buildSKUMeta(product);
  const related = (relatedData ?? []) as unknown as ProductCardType[];
  const reviews = (reviewData ?? []) as unknown as ProductReview[];
  const recentlyViewedProduct: RecentlyViewedProduct = {
    id: product.id,
    name: product.name,
    href: `/shop/${product.category}/${product.slug}`,
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
      <ProductJsonLd product={product} slug={slug} category={category} reviews={reviews} />

      <main className="min-h-screen bg-brand-bg px-4 pb-24 pt-[88px] md:px-6 md:pt-[110px] lg:px-8">
        <div className="mx-auto max-w-[1280px]">

          {/* ── Breadcrumb ── */}
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--pvg-muted)]">
            <Link href="/" className="transition hover:text-[var(--pvg-accent)]">Home</Link>
            <span>/</span>
            <Link href="/shop" className="transition hover:text-[var(--pvg-accent)]">Shop</Link>
            <span>/</span>
            <Link
              href={`/shop/${category}`}
              className="transition hover:text-[var(--pvg-accent)]"
            >
              {categoryLabel}
            </Link>
            <span>/</span>
            <span className="line-clamp-1 text-[var(--pvg-primary)]">{product.name}</span>
          </nav>

          {/* ── Main Grid: Gallery | Info — true 50/50 on desktop ── */}
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2">

            {/* ─── Left: Gallery ─── */}
            <div className="lg:sticky lg:top-[90px] lg:self-start">
              <ProductGallery images={images} productName={product.name} />

              {/* Video if available */}
              {product.video_url && (
                <div className="mt-4 overflow-hidden rounded-xl border border-[var(--pvg-border)]">
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
            <div className="space-y-5">
              {/* Product name + SKU */}
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {product.certification && (
                    <span className="rounded border border-[var(--pvg-accent)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--pvg-accent)]">
                      {product.certification} Certified
                    </span>
                  )}
                  {product.treatment && product.treatment !== 'none' && (
                    <span className="rounded bg-brand-gold-light px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--pvg-muted)]">
                      {product.treatment}
                    </span>
                  )}
                </div>

                <h1
                  className="font-heading font-bold leading-tight text-[var(--pvg-primary)]"
                  style={{ fontSize: 'clamp(20px, 2.6vw, 32px)' }}
                >
                  {product.name}
                </h1>

                {skuMeta && (
                  <p className="mt-1 text-[12px] font-medium text-[var(--pvg-muted)]">
                    {skuMeta}
                  </p>
                )}

                <p className="mt-0.5 text-[10px] uppercase tracking-[2px] text-[var(--pvg-border)]">
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

              <EmiCalculator amount={product.price} compact />

              {/* Gemstone quick specs */}
              <div className="grid grid-cols-3 gap-x-3 gap-y-3 rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-3 sm:grid-cols-3">
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
                      <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-[var(--pvg-muted)]">
                        {label}
                      </p>
                      <p className="truncate text-[12px] font-semibold text-[var(--pvg-text)]">{value}</p>
                    </div>
                  ))}
              </div>

              {/* Add to Cart */}
              <AddToCartBar product={product} />

              {/* Expert Note */}
              {(product.expert_note || expert) && (
                <div className="rounded-xl border border-[var(--pvg-gold-light)] bg-brand-gold-light p-4">
                  <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[2px] text-[var(--pvg-accent)]">
                    Expert Note
                  </p>
                  {expert && (
                    <div className="mb-2.5 flex items-start gap-3">
                      {expert.photo_url && (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[var(--pvg-accent)]">
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
                        <p className="text-[13px] font-semibold text-[var(--pvg-primary)]">{expert.name}</p>
                        <p className="text-[11px] text-[var(--pvg-muted)]">{expert.specialty ?? expert.title}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-[12px] italic leading-relaxed text-[var(--pvg-text)]">
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

          <RecentlyViewedProducts current={recentlyViewedProduct} />

          {/* ── Related Products ── */}
          {related.length > 0 && (
            <section className="mt-16">
              <OrnamentalDivider className="mb-6" />
              <div className="mb-5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[4px] text-[var(--pvg-accent)]">
                  You May Also Like
                </p>
                <h2 className="font-heading mt-1.5 text-xl font-semibold text-[var(--pvg-primary)]">
                  Related Gemstones
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-3">
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
