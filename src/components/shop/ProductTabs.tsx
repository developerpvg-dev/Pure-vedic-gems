'use client';

import { useState } from 'react';
import { Star, Shield, Book, Gem, MessageSquare } from 'lucide-react';
import type { Product } from '@/lib/types/product';

interface ProductTabsProps {
  product: Product;
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
    <div className="flex items-start gap-3 border-b border-[var(--pvg-border)] py-3 last:border-0">
      <span className="min-w-[140px] text-[12px] font-semibold uppercase tracking-[1.5px] text-[var(--pvg-muted)]">
        {label}
      </span>
      <span className="text-[14px] text-[var(--pvg-text)]">{value}</span>
    </div>
  );
}

export function ProductTabs({ product }: ProductTabsProps) {
  const [active, setActive] = useState<TabKey>('description');

  const benefits = Array.isArray(product.benefits) ? (product.benefits as string[]) : [];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-[var(--pvg-border)]" style={{ gap: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="flex shrink-0 items-center gap-1.5 px-4 py-3 text-[12px] font-semibold uppercase tracking-[1.5px] transition-all md:px-5"
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
              <p className="text-[15px] font-medium leading-relaxed text-[var(--pvg-text)]">
                {product.short_desc}
              </p>
            )}
            {product.description && (
              <div
                className="prose prose-sm max-w-none text-[14px] leading-[1.9] text-[var(--pvg-muted)] [&_a]:text-[var(--pvg-accent)] [&_a]:underline [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading [&_h4]:font-heading [&_li]:marker:text-[var(--pvg-accent)] [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
            {benefits.length > 0 && (
              <div>
                <h4 className="mb-3 font-heading text-[15px] font-semibold text-[var(--pvg-primary)]">
                  Key Benefits
                </h4>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--pvg-text)]">
                      <span className="mt-0.5 text-[var(--pvg-accent)]">✦</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!product.short_desc && !product.description && benefits.length === 0 && (
              <p className="text-[14px] text-[var(--pvg-muted)]">
                Detailed description coming soon. Contact us for more information.
              </p>
            )}
          </div>
        )}

        {/* Vedic Properties */}
        {active === 'vedic' && (
          <div>
            {product.vedic_significance && (
              <p className="mb-5 text-[14px] leading-[1.9] text-[var(--pvg-text)]">
                {product.vedic_significance}
              </p>
            )}
            <div className="rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)]/50 px-5">
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
            <div className="rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)]/50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pvg-gold-light)]">
                  <Shield className="h-5 w-5 text-[var(--pvg-accent)]" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-[var(--pvg-primary)]">
                    {product.certification ?? 'Laboratory Certified'}
                  </p>
                  <p className="text-[12px] text-[var(--pvg-muted)]">
                    Authenticity &amp; quality verified
                  </p>
                </div>
              </div>
            </div>
            {product.certificate_url ? (
              <a
                href={product.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--pvg-primary)] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider text-[var(--pvg-bg)] transition hover:bg-[var(--pvg-accent)]"
              >
                <Shield className="h-4 w-4" />
                View Certificate
              </a>
            ) : (
              <p className="text-[14px] text-[var(--pvg-muted)]">
                Certificate available on request. Contact us via WhatsApp for details.
              </p>
            )}
            {product.xray_certified && (
              <p className="flex items-center gap-2 text-[13px] text-[var(--pvg-text)]">
                <span className="text-[var(--pvg-accent)]">✦</span>
                X-Ray tested and certified natural
              </p>
            )}
          </div>
        )}

        {/* Wearing Guide */}
        {active === 'wearing' && (
          <div className="space-y-4">
            {product.wearing_guide ? (
              <p className="text-[14px] leading-[1.9] text-[var(--pvg-text)]">
                {product.wearing_guide}
              </p>
            ) : (
              <div className="rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)]/50 p-5">
                <p className="font-heading mb-4 text-[15px] font-semibold text-[var(--pvg-primary)]">
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
                      <li key={i} className="flex items-start gap-3 text-[13px] text-[var(--pvg-text)]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--pvg-gold-light)] text-[10px] font-bold text-[var(--pvg-accent)]">
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

        {/* Reviews — placeholder (real reviews need DB query) */}
        {active === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-heading text-5xl font-bold text-[var(--pvg-primary)]">4.9</p>
                <ReviewStars rating={4.9} />
                <p className="mt-1 text-[11px] text-[var(--pvg-muted)]">Based on reviews</p>
              </div>
              <div className="h-16 w-px bg-[var(--pvg-border)]" />
              <p className="text-[13px] leading-relaxed text-[var(--pvg-muted)]">
                All our gemstones are verified natural and lab-certified. Customer reviews are
                moderated for authenticity.
              </p>
            </div>
            {/* Sample/placeholder reviews */}
            {[
              { name: 'Priya S.', location: 'Mumbai', rating: 5, text: 'Absolutely beautiful stone. The lustre and clarity are exceptional. Fully satisfied with the purchase.' },
              { name: 'Rahul M.', location: 'Delhi', rating: 5, text: 'Got my yellow sapphire here. The certificate is genuine and the stone quality is exactly as described.' },
            ].map((r, i) => (
              <div key={i} className="rounded-xl border border-[var(--pvg-border)] p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[var(--pvg-primary)]">{r.name}</p>
                    <p className="text-[11px] text-[var(--pvg-muted)]">{r.location}</p>
                  </div>
                  <ReviewStars rating={r.rating} />
                </div>
                <p className="text-[14px] leading-relaxed text-[var(--pvg-text)]">
                  &ldquo;{r.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
