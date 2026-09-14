'use client';

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Star,
  MessageSquare,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import type { Product } from '@/lib/types/product';
import { isNoCertification } from '@/lib/utils/format';
import { demoteBodyH1s, stripHtmlVideos } from '@/lib/utils/html-headings';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { isGemConfiguratorEnabled } from '@/lib/shop/configurator';

interface ProductTabsProps {
  product: Product;
  reviews?: ProductReview[];
  reviewPoolLabel?: string | null;
}

export interface ProductReview {
  id: string;
  customer_name: string;
  customer_location: string | null;
  rating: number | null;
  title: string | null;
  review_text: string | null;
  images?: string[];
  is_verified: boolean;
  created_at: string;
}

const STAR_GOLD = '#C9A84C';
const STAR_EMPTY = 'color-mix(in srgb, var(--pvg-border) 85%, var(--pvg-muted))';
const REVIEW_PREVIEW_CHARS = 160;
const DESC_COLLAPSED_PX = 220;

type StarSize = 'sm' | 'md' | 'lg';
type DetailSpec = { label: string; value: ReactNode };

const STAR_PX: Record<StarSize, number> = { sm: 14, md: 18, lg: 22 };

function ReviewStars({ rating, size = 'md' }: { rating: number; size?: StarSize }) {
  const px = STAR_PX[size];
  return (
    <div
      className="inline-flex items-center gap-[3px]"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <span key={i} className="relative inline-block shrink-0" style={{ width: px, height: px }}>
            <Star
              className="absolute inset-0"
              style={{ width: px, height: px, color: STAR_EMPTY, fill: STAR_EMPTY }}
              strokeWidth={1.25}
              aria-hidden
            />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star
                  style={{
                    width: px,
                    height: px,
                    color: STAR_GOLD,
                    fill: STAR_GOLD,
                    filter: 'drop-shadow(0 1px 1px rgba(138, 100, 0, 0.35))',
                  }}
                  strokeWidth={1.25}
                  aria-hidden
                />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function formatLabel(value?: string | null) {
  if (!value) return null;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDimensions(dimensions: Product['dimensions_mm']) {
  if (!dimensions) return null;
  const parts = [dimensions.length, dimensions.width, dimensions.depth]
    .filter((value): value is number => typeof value === 'number')
    .map((value) => value.toFixed(2));
  if (parts.length === 0) return null;
  return `${parts.join(' x ')} ${dimensions.unit ?? 'mm'}`;
}

function buildDetailSpecs(product: Product): DetailSpec[] {
  const certLab = product.certificate_lab ?? product.certification;
  const certUrl = product.certificate_url || product.certificate_file_url;
  const showCert = !isNoCertification(product.certification);
  const weightGrams =
    product.carat_weight != null ? (product.carat_weight * 0.2).toFixed(2) : null;

  const originPrimary = product.origin_display || product.origin || null;
  const originRegion =
    product.origin_region && product.origin_region !== originPrimary
      ? product.origin_region
      : null;
  const originCountry =
    product.origin_country &&
    product.origin_country !== originPrimary &&
    product.origin_country !== originRegion
      ? product.origin_country
      : null;

  const colour =
    [product.color_grade, product.color_description].filter(Boolean).length > 1 &&
    product.color_grade !== product.color_description
      ? `${product.color_grade} (${product.color_description})`
      : product.color_grade || product.color_description;

  const clarity =
    [product.clarity, product.clarity_description].filter(Boolean).length > 1 &&
    product.clarity !== product.clarity_description
      ? `${product.clarity} (${product.clarity_description})`
      : product.clarity || product.clarity_description;

  const treatment =
    product.treatment_summary ||
    product.treatment_detail ||
    formatLabel(product.treatment);

  const rows: Array<{ label: string; value: ReactNode | null | undefined }> = [
    // Core stone identity
    {
      label: 'Gemstone',
      value: product.gemstone_name || product.vedic_name || formatLabel(product.sub_category),
    },
    { label: 'Colour', value: colour },
    { label: 'Clarity', value: clarity },
    {
      label: 'Weight (carat)',
      value: product.carat_weight != null ? product.carat_weight.toFixed(2) : null,
    },
    {
      label: 'Weight (ratti)',
      value: product.ratti_weight != null ? product.ratti_weight.toFixed(2) : null,
    },
    { label: 'Weight (grams)', value: weightGrams },
    { label: 'Shape', value: product.shape },
    { label: 'Dimensions', value: formatDimensions(product.dimensions_mm) },
    { label: 'Origin', value: originPrimary },
    { label: 'Origin Region', value: originRegion },
    { label: 'Origin Country', value: originCountry },
    { label: 'Treatment', value: treatment },
    {
      label: 'Treatment Detail',
      value:
        product.treatment_detail &&
        product.treatment_detail !== product.treatment_summary
          ? product.treatment_detail
          : null,
    },
    { label: 'Quality', value: product.quality_label ?? product.commercial_quality_grade },
    { label: 'Availability', value: formatLabel(product.availability_status) },
    { label: 'SKU', value: product.sku },
    { label: 'Tag', value: product.tag_number },

    // Certification
    {
      label: 'Certification',
      value: showCert && certLab ? (
        <>
          {certLab}
          {certUrl ? (
            <>
              {' '}
              <a
                href={certUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#7A1515] underline underline-offset-2"
              >
                Verify
              </a>
            </>
          ) : null}
        </>
      ) : null,
    },
    { label: 'Lab', value: showCert ? product.certificate_lab ?? product.certification : null },
    { label: 'Certificate No.', value: showCert ? product.certificate_number : null },
    {
      label: 'Certificate Status',
      value: showCert ? formatLabel(product.certificate_status) : null,
    },
    {
      label: 'X-Ray Certified',
      value: product.xray_certified ? 'Yes' : null,
    },
    {
      label: 'X-Ray Certificate No.',
      value: product.xray_certificate_number,
    },

    // Vedic properties (from product create form)
    { label: 'Vedic Name', value: product.vedic_name },
    { label: 'Hindi Name', value: product.hindi_name },
    { label: 'Planet', value: product.planet },
    { label: 'Rashi', value: product.rashi },
    { label: 'Ruling Deity', value: product.ruling_deity },
    { label: 'Deity', value: product.deity && product.deity !== product.ruling_deity ? product.deity : null },
    { label: 'Chakra', value: product.chakra },
    { label: 'Mantra', value: product.mantra },

    // Wearing guide fields
    { label: 'Wearing Day', value: product.wearing_day },
    { label: 'Wearing Metal', value: product.wearing_metal },
    { label: 'Finger', value: product.finger },
    {
      label: 'Energization',
      value: product.energization_eligible ? 'Eligible' : null,
    },

    // Rudraksha / bead fields when present
    {
      label: 'Mukhi',
      value: product.mukhi_count != null ? String(product.mukhi_count) : null,
    },
    { label: 'Rudraksha Type', value: product.rudraksha_type },
    {
      label: 'Bead Size',
      value: product.bead_size_mm != null ? `${product.bead_size_mm} mm` : null,
    },
    {
      label: 'Bead Weight',
      value: product.bead_weight != null ? String(product.bead_weight) : null,
    },

    // Jewellery fields when present
    { label: 'Composition', value: product.composition },
    { label: 'Jewellery Type', value: product.jewellery_type },
    { label: 'Base Metal', value: product.base_metal },
    { label: 'Metal Purity', value: product.metal_purity },
    {
      label: 'Metal Weight',
      value:
        product.metal_weight_grams != null ? `${product.metal_weight_grams} g` : null,
    },
    { label: 'Size', value: product.size_label },
    { label: 'Ring Size', value: product.ring_size },
    { label: 'Design Code', value: product.design_code },
    {
      label: 'Jewellery',
      value: isGemConfiguratorEnabled(product.category, product.configurator_enabled)
        ? 'Configurable'
        : null,
    },
  ];

  return rows.filter((row): row is DetailSpec => {
    if (row.value == null || row.value === '') return false;
    if (typeof row.value === 'string' && !row.value.trim()) return false;
    return true;
  });
}

export function ProductTabs({ product, reviews = [], reviewPoolLabel = null }: ProductTabsProps) {
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descNeedsToggle, setDescNeedsToggle] = useState(false);
  const reviewScrollerRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);

  const descriptionHtml = useMemo(
    () => (product.description ? demoteBodyH1s(stripHtmlVideos(product.description)) : ''),
    [product.description],
  );

  useLayoutEffect(() => {
    setDescExpanded(false);
    const el = descRef.current;
    if (!el || !descriptionHtml) {
      setDescNeedsToggle(false);
      return;
    }
    setDescNeedsToggle(el.scrollHeight > DESC_COLLAPSED_PX + 8);
  }, [descriptionHtml]);

  const benefits = Array.isArray(product.benefits) ? (product.benefits as string[]) : [];
  const displayName = formatProductDisplayName(product.name);
  const detailHeading =
    product.carat_weight != null
      ? `${displayName} - ${product.carat_weight.toFixed(2)} Carats`
      : displayName;
  const detailSpecs = useMemo(() => buildDetailSpecs(product), [product]);
  const ratedReviews = reviews.filter((review) => typeof review.rating === 'number');
  const averageRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / ratedReviews.length
      : 0;

  const scrollReviews = (direction: -1 | 1) => {
    const el = reviewScrollerRef.current;
    if (!el) return;
    const card = el.querySelector('article');
    const step = card instanceof HTMLElement ? card.offsetWidth + 16 : Math.min(320, el.clientWidth * 0.85);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="product-tabs space-y-10 lg:space-y-14">
      {/* Product Detail — replaces Description / Vedic / Certificate / Wearing tabs */}
      <section className="space-y-5 lg:space-y-7">
        <h2 className="font-heading text-[18px] font-bold uppercase tracking-[0.02em] text-brand-primary sm:text-[20px] lg:text-[22px]">
          <span className="border-b-[3px] border-[#7A1515] pb-0.5">Product Detail</span>
          <span className="font-semibold normal-case tracking-normal"> : {detailHeading}</span>
        </h2>

        {product.short_desc && (
          <p className="max-w-5xl text-[14px] leading-[1.85] text-brand-text lg:text-[15px]">
            {product.short_desc}
          </p>
        )}

        {descriptionHtml && (
          <div className="max-w-5xl">
            <div className="relative">
              <div
                ref={descRef}
                className={`prose prose-sm max-w-none text-[14px] leading-[1.85] text-brand-text [&_a]:text-[#7A1515] [&_a]:underline [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading [&_h4]:font-heading [&_li]:marker:text-[#7A1515] [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 ${
                  descExpanded || !descNeedsToggle ? '' : 'max-h-[220px] overflow-hidden'
                }`}
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
              {descNeedsToggle && !descExpanded && (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"
                  aria-hidden
                />
              )}
            </div>
            {descNeedsToggle && (
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-2 text-[13px] font-semibold text-[#7A1515] underline-offset-2 hover:underline"
              >
                {descExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {product.vedic_significance && (
          <div className="max-w-5xl">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
              Vedic properties
            </p>
            <p className="whitespace-pre-line text-[14px] leading-[1.85] text-brand-text">
              {product.vedic_significance}
            </p>
          </div>
        )}

        {benefits.length > 0 && (
          <ul className="flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-8 lg:gap-x-10">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="inline-flex max-w-full items-start gap-2 text-[13px] font-semibold text-[#1f6b3a] sm:text-[14px]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2e7d32]" strokeWidth={2.25} aria-hidden />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {detailSpecs.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {detailSpecs.map((spec, index) => {
                const desktopZebra = Math.floor(index / 3) % 2 === 1;
                const mobileZebra = index % 2 === 1;
                return (
                  <div
                    key={`${spec.label}-${index}`}
                    className={`min-w-0 break-words border-b border-[#e8e8e8] px-4 py-3 text-[13px] leading-relaxed sm:border-r lg:[&:nth-child(3n)]:border-r-0 ${
                      mobileZebra ? 'bg-[#f7f7f7]' : 'bg-white'
                    } ${desktopZebra ? 'lg:bg-[#f7f7f7]' : 'lg:bg-white'}`}
                  >
                    <span className="text-brand-muted">{spec.label}</span>
                    <span className="text-brand-muted"> : </span>
                    <span className="font-semibold text-brand-primary">{spec.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {product.wearing_guide && (
          <div className="rounded-xl border border-brand-border bg-brand-bg-alt/40 px-4 py-4 lg:px-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
              Wearing guide
            </p>
            <p className="whitespace-pre-line text-[14px] leading-[1.8] text-brand-text">
              {product.wearing_guide}
            </p>
          </div>
        )}
      </section>

      {/* Customer reviews — site section pattern */}
      <section className="product-reviews mt-2 sm:mt-4">
        {reviews.length > 0 ? (
          <>
            <div className="mb-4 text-center lg:mb-6">
              <h2 className="text-xl font-medium text-[#7A1515] lg:text-2xl">
                Customer Reviews
              </h2>
              {reviewPoolLabel && (
                <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-brand-muted">
                  Showing buyer experiences from the {reviewPoolLabel} collection.
                </p>
              )}
              <div className="mt-3 inline-flex max-w-full items-center gap-2.5 rounded-full border border-brand-border bg-white px-3 py-1.5 sm:gap-3 sm:px-3.5 sm:py-2">
                <div className="flex items-center gap-1.5 border-r border-brand-border pr-2.5 sm:gap-2 sm:pr-3">
                  <span className="text-[14px] font-semibold tabular-nums text-[#7A1515] sm:text-[15px]">
                    {averageRating.toFixed(1)}
                  </span>
                  <ReviewStars rating={averageRating} size="sm" />
                </div>
                <p className="whitespace-nowrap text-[11px] font-medium text-brand-muted sm:text-[12px]">
                  {reviews.length}+ review{reviews.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="relative -mx-1 sm:mx-0">
              <button
                type="button"
                onClick={() => scrollReviews(-1)}
                className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-brand-border bg-white/95 text-brand-muted shadow-sm backdrop-blur transition hover:border-[#7A1515]/35 hover:text-[#7A1515] sm:left-1 sm:h-9 sm:w-9 md:left-0"
                aria-label="Previous reviews"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollReviews(1)}
                className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-brand-border bg-white/95 text-brand-muted shadow-sm backdrop-blur transition hover:border-[#7A1515]/35 hover:text-[#7A1515] sm:right-1 sm:h-9 sm:w-9 md:right-0"
                aria-label="Next reviews"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <div
                ref={reviewScrollerRef}
                className="product-reviews-scroller scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-9 pb-1 sm:gap-4 sm:px-11 md:mx-0 md:px-12"
              >
                {reviews.map((review) => {
                  const text = review.review_text?.trim() ?? '';
                  const isExpanded = expandedReviewId === review.id;
                  const needsMore = text.length > REVIEW_PREVIEW_CHARS;
                  const shownText =
                    !needsMore || isExpanded
                      ? text
                      : `${text.slice(0, REVIEW_PREVIEW_CHARS).trimEnd()}…`;
                  const rating = review.rating ?? 0;

                  return (
                    <article
                      key={review.id}
                      className="w-[min(100%,280px)] shrink-0 snap-center rounded-xl border border-brand-border bg-white p-4 sm:w-[300px] sm:snap-start sm:p-5 md:w-[320px]"
                    >
                      <p className="text-[14px] font-semibold leading-snug text-[#7A1515] sm:text-[15px]">
                        {review.title || `Review for ${displayName}`}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[12px] font-semibold tabular-nums text-brand-text">
                          {rating}/5
                        </span>
                        <ReviewStars rating={rating} size="sm" />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-[11px] text-brand-muted">
                          {[review.customer_name, review.customer_location].filter(Boolean).join(', ')}
                        </p>
                        {review.is_verified && (
                          <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2e7d32]">
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                            Verified Buyer
                          </p>
                        )}
                      </div>

                      {text && (
                        <p className="mt-3 text-[13px] leading-relaxed text-brand-text">
                          {shownText}
                          {needsMore && (
                            <>
                              {' '}
                              <button
                                type="button"
                                onClick={() => setExpandedReviewId(isExpanded ? null : review.id)}
                                className="font-semibold text-[#7A1515] underline-offset-2 hover:underline"
                              >
                                {isExpanded ? 'Show less' : 'Read more'}
                              </button>
                            </>
                          )}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-brand-border bg-brand-bg-alt/40 px-6 py-10 text-center">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'var(--pvg-gold-light)' }}
              >
                <MessageSquare className="h-5 w-5 text-brand-accent" />
              </div>
              <p className="text-lg font-medium text-[#7A1515]">No reviews yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-muted">
                Be among the first to share your experience. We only publish moderated customer reviews.
              </p>
            </div>
        )}
      </section>
    </div>
  );
}
