'use client';

import { useState } from 'react';
import { Star, Shield, Book, Gem, MessageSquare } from 'lucide-react';
import type { Product } from '@/lib/types/product';

interface ProductTabsProps {
  product: Product;
  reviews?: ProductReview[];
}

export interface ProductReview {
  id: string;
  customer_name: string;
  customer_location: string | null;
  rating: number | null;
  title: string | null;
  review_text: string | null;
  is_verified: boolean;
  created_at: string;
}

type TabKey = 'description' | 'vedic' | 'certificate' | 'wearing' | 'reviews';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'description', label: 'Description', icon: <Book className="h-3.5 w-3.5" /> },
  { key: 'vedic', label: 'Vedic Properties', icon: <Gem className="h-3.5 w-3.5" /> },
  { key: 'certificate', label: 'Certificate', icon: <Shield className="h-3.5 w-3.5" /> },
  { key: 'wearing', label: 'Wearing Guide', icon: <Star className="h-3.5 w-3.5" /> },
  { key: 'reviews', label: 'Reviews', icon: <MessageSquare className="h-3.5 w-3.5" /> },
];

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i < Math.round(rating) ? 'var(--pvg-accent)' : 'none'}
          stroke={i < Math.round(rating) ? 'var(--pvg-accent)' : 'var(--pvg-border)'}
        />
      ))}
    </div>
  );
}

function VedicRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 border-b border-brand-border py-3 last:border-0">
      <span className="min-w-35 text-[12px] font-normal text-brand-muted">
        {label}
      </span>
      <span className="text-[14px] text-brand-text">{value}</span>
    </div>
  );
}

function formatLabel(value?: string | null) {
  if (!value) return null;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ProductTabs({ product, reviews = [] }: ProductTabsProps) {
  const [active, setActive] = useState<TabKey>('description');
  const [reviewFilter, setReviewFilter] = useState<number | null>(null);

  const benefits = Array.isArray(product.benefits) ? (product.benefits as string[]) : [];
  const ratedReviews = reviews.filter((review) => typeof review.rating === 'number');
  const averageRating = ratedReviews.length > 0
    ? ratedReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / ratedReviews.length
    : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: ratedReviews.filter((review) => Math.round(review.rating ?? 0) === rating).length,
  }));
  const visibleReviews = reviewFilter
    ? reviews.filter((review) => Math.round(review.rating ?? 0) === reviewFilter)
    : reviews;

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-brand-border" style={{ gap: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="flex shrink-0 items-center gap-1.5 px-4 py-3 text-[12px] font-medium transition-all md:px-5"
            style={{
              color: active === tab.key ? 'var(--pvg-primary)' : 'var(--pvg-muted)',
              borderBottom:
                active === tab.key
                  ? '2px solid var(--pvg-accent)'
                  : '2px solid transparent',
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {/* Description */}
        {active === 'description' && (
          <div className="space-y-4">
            {product.short_desc && (
              <p className="text-[15px] font-medium leading-relaxed text-brand-text">
                {product.short_desc}
              </p>
            )}
            {product.description && (
              <div
                className="prose prose-sm max-w-none text-[14px] leading-[1.9] text-brand-muted [&_a]:text-brand-accent [&_a]:underline [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading [&_h4]:font-heading [&_li]:marker:text-brand-accent [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
            {benefits.length > 0 && (
              <div>
                <h4 className="mb-3 font-heading text-[15px] font-semibold text-brand-primary">
                  Key Benefits
                </h4>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-brand-text">
                      <span className="mt-0.5 text-brand-accent">✦</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!product.short_desc && !product.description && benefits.length === 0 && (
              <p className="text-[14px] text-brand-muted">
                Detailed description coming soon. Contact us for more information.
              </p>
            )}
          </div>
        )}

        {/* Vedic Properties */}
        {active === 'vedic' && (
          <div>
            {product.vedic_significance && (
              <p className="mb-5 text-[14px] leading-[1.9] text-brand-text">
                {product.vedic_significance}
              </p>
            )}
            <div className="rounded-xl border border-brand-border bg-brand-bg-alt/50 px-5">
              <VedicRow label="Vedic Name" value={product.vedic_name} />
              <VedicRow label="Hindi Name" value={product.hindi_name} />
              <VedicRow label="Ruling Planet" value={product.planet} />
              <VedicRow label="Ruling Deity" value={product.ruling_deity} />
              <VedicRow label="Chakra" value={product.chakra} />
              <VedicRow label="Rashi (Zodiac)" value={product.rashi} />
              <VedicRow label="Wearing Finger" value={product.finger} />
              <VedicRow label="Wearing Day" value={product.wearing_day} />
              <VedicRow label="Wearing Metal" value={product.wearing_metal} />
            </div>
          </div>
        )}

        {/* Certificate */}
        {active === 'certificate' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-border bg-brand-bg-alt/50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold-light">
                  <Shield className="h-5 w-5 text-brand-accent" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-brand-primary">
                    {product.certification ?? 'Laboratory Certified'}
                  </p>
                  <p className="text-[12px] text-brand-muted">
                    Authenticity &amp; quality verified
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg-alt/50 px-5">
              <VedicRow label="Product Tag" value={product.tag_number} />
              <VedicRow label="Certificate Lab" value={product.certificate_lab ?? product.certification} />
              <VedicRow label="Certificate No." value={product.certificate_number} />
              <VedicRow label="Certificate Status" value={formatLabel(product.certificate_status)} />
              <VedicRow label="Treatment" value={product.treatment_summary ?? formatLabel(product.treatment)} />
              <VedicRow label="Quality" value={product.quality_label ?? product.commercial_quality_grade} />
            </div>
            {product.certificate_url ? (
              <a
                href={product.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#7A1515] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#5f1010]"
              >
                <Shield className="h-4 w-4" />
                View Certificate
              </a>
            ) : (
              <p className="text-[14px] text-brand-muted">
                Certificate available on request. Contact us via WhatsApp for details.
              </p>
            )}
            {product.xray_certified && (
              <p className="flex items-center gap-2 text-[13px] text-brand-text">
                <span className="text-brand-accent">✦</span>
                X-Ray tested and certified natural
              </p>
            )}
          </div>
        )}

        {/* Wearing Guide */}
        {active === 'wearing' && (
          <div className="space-y-4">
            {product.wearing_guide ? (
              <p className="text-[14px] leading-[1.9] text-brand-text">
                {product.wearing_guide}
              </p>
            ) : (
              <div className="rounded-xl border border-brand-border bg-brand-bg-alt/50 p-5">
                <p className="font-heading mb-4 text-[15px] font-semibold text-brand-primary">
                  General Wearing Guide
                </p>
                <ul className="space-y-3">
                  {[
                    product.wearing_day && `Best worn on ${product.wearing_day}`,
                    product.wearing_metal &&
                      `Set in ${product.wearing_metal} for maximum efficacy`,
                    product.finger && `Wear on the ${product.finger}`,
                    'Purify the stone in Ganges water or raw milk before wearing',
                    'Energize with the ruling planet mantra 108 times',
                  ]
                    .filter(Boolean)
                    .map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-[13px] text-brand-text">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold-light text-[10px] font-bold text-brand-accent">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {active === 'reviews' && (
          <div className="space-y-6">
            {reviews.length > 0 ? (
              <>
                <div className="grid gap-5 rounded-xl border border-brand-border bg-brand-bg-alt/50 p-5 md:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="text-center">
                    <p className="font-heading text-4xl font-bold text-brand-primary">
                      {averageRating.toFixed(1)}
                    </p>
                    <ReviewStars rating={averageRating} />
                    <p className="mt-1 text-[11px] text-brand-muted">
                      {reviews.length} approved review{reviews.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {ratingCounts.map(({ rating, count }) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewFilter(reviewFilter === rating ? null : rating)}
                        className="grid w-full grid-cols-[48px_minmax(0,1fr)_32px] items-center gap-3 text-left text-xs text-brand-muted"
                      >
                        <span>{rating} star</span>
                        <span className="h-2 overflow-hidden rounded-full bg-brand-border">
                          <span
                            className="block h-full rounded-full bg-brand-accent"
                            style={{ width: `${ratedReviews.length > 0 ? (count / ratedReviews.length) * 100 : 0}%` }}
                          />
                        </span>
                        <span className="text-right">{count}</span>
                      </button>
                    ))}
                    <p className="pt-2 text-[13px] leading-relaxed text-brand-muted">
                      Reviews shown here are approved customer submissions. Verified purchase badges appear only when linked to an order.
                    </p>
                  </div>
                </div>

                {reviewFilter && (
                  <button
                    type="button"
                    onClick={() => setReviewFilter(null)}
                    className="rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary transition hover:border-brand-accent"
                  >
                    Clear {reviewFilter}-star filter
                  </button>
                )}

                {visibleReviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-brand-border p-5">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-brand-primary">{review.customer_name}</p>
                        <p className="text-[11px] text-brand-muted">
                          {[review.customer_location, review.is_verified ? 'Verified purchase' : null].filter(Boolean).join(' | ')}
                        </p>
                      </div>
                      {review.rating != null && <ReviewStars rating={review.rating} />}
                    </div>
                    {review.title && (
                      <p className="mb-2 text-[14px] font-semibold text-brand-primary">{review.title}</p>
                    )}
                    {review.review_text && (
                      <p className="text-[14px] leading-relaxed text-brand-text">
                        &ldquo;{review.review_text}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="rounded-xl border border-brand-border bg-brand-bg-alt/50 p-6 text-center">
                <MessageSquare className="mx-auto mb-3 h-7 w-7 text-brand-accent" />
                <p className="font-heading text-lg text-brand-primary">No approved reviews yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-muted">
                  We only show moderated customer reviews. Contact us for product-specific references, certificates, or inspection videos.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
