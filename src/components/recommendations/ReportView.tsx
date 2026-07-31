'use client';

import type { ReactNode } from 'react';
import type { ReportBlock, ReportCustomer, StoneCard } from '@/lib/recommendations/blocks';
import { STONE_ROLE_LABELS } from '@/lib/recommendations/blocks';
import {
  BENEFIT_LUCIDE,
  DEFAULT_REPORT_LOGO,
  DEFAULT_REPORT_WORDMARK,
  type BenefitOption,
} from '@/lib/recommendations/benefit-icons';

function ProductImage({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex min-h-[140px] items-center justify-center border border-dashed border-neutral-300 bg-neutral-100 text-xs text-neutral-500">
        {alt || 'Product'}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className="max-h-64 w-full max-w-xs object-cover bg-neutral-100" />;
}

function BenefitGlyph({ label }: { label: string }) {
  const Icon = BENEFIT_LUCIDE[label as BenefitOption] ?? BENEFIT_LUCIDE.Success;
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 shadow-sm">
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

function Benefits({ benefits }: { benefits: string[] }) {
  if (!benefits.length) return null;
  return (
    <div className="mt-3">
      <p className="font-sans text-xs font-bold">Suggested For:</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {benefits.map((b) => (
          <div
            key={b}
            className="flex w-[76px] flex-col items-center gap-1.5 text-center font-sans text-[10px] leading-tight text-neutral-600"
          >
            <BenefitGlyph label={b} />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportLogo({ logoUrl }: { logoUrl: string | null }) {
  const emblem = logoUrl || DEFAULT_REPORT_LOGO;
  const showWordmark = !logoUrl || logoUrl === DEFAULT_REPORT_LOGO;
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={emblem} alt="Pure Vedic Gems" className="h-12 w-12 object-contain" />
      {showWordmark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={DEFAULT_REPORT_WORDMARK} alt="Pure Vedic Gems" className="h-8 w-auto object-contain" />
      ) : null}
    </div>
  );
}

function StoneBlock({ stone, compact }: { stone: StoneCard; compact?: boolean }) {
  const role = STONE_ROLE_LABELS[stone.role] ?? stone.role;
  return (
    <div className={compact ? '' : 'mb-6'}>
      <h3 className="m-0 text-base font-bold">
        {role}: {stone.gemLabel || '—'}
      </h3>
      {stone.weight ? (
        <p className="mt-1 font-sans text-xs tracking-wide text-neutral-500">WEIGHT: {stone.weight}</p>
      ) : null}
      <div className="mt-2">
        <ProductImage url={stone.product.imageUrl} alt={stone.product.name || stone.gemLabel} />
      </div>
      {stone.product.name ? <p className="mt-1 font-sans text-xs text-neutral-600">{stone.product.name}</p> : null}
      <span className="mt-2 inline-block bg-[#e85d04] px-4 py-2 font-sans text-xs font-bold tracking-wide text-white">
        BUY NOW
      </span>
      <Benefits benefits={stone.benefits} />
    </div>
  );
}

export function ReportView({
  customer,
  blocks,
  chartImageUrl,
  selectedBlockId,
  onSelectBlock,
  interactive,
}: {
  customer: ReportCustomer;
  blocks: ReportBlock[];
  chartImageUrl?: string | null;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  interactive?: boolean;
}) {
  function wrap(block: ReportBlock, child: ReactNode) {
    const selected = selectedBlockId === block.id;
    if (!interactive) return <div key={block.id}>{child}</div>;
    return (
      <div
        key={block.id}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock?.(block.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectBlock?.(block.id);
          }
        }}
        className={`relative cursor-pointer rounded-sm outline-offset-2 ${selected ? 'ring-2 ring-amber-500' : 'hover:ring-1 hover:ring-neutral-300'}`}
      >
        {child}
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-[860px] bg-white px-5 py-6 text-[#1a1a1a]" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
      {(() => {
        const nodes: ReactNode[] = [];
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          const next = blocks[i + 1];
          if (block.type === 'natalChart' && next?.type === 'primaryStone') {
            nodes.push(
              <div key={`${block.id}-${next.id}`} className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {wrap(
                  block,
                  <section>
                    <h2 className="m-0 mb-2 text-sm tracking-widest">NATAL BIRTH CHART</h2>
                    <p className="font-sans text-sm leading-relaxed text-neutral-600">{block.description}</p>
                    <div className="mt-3">
                      {block.imageUrl || chartImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(block.imageUrl || chartImageUrl)!}
                          alt="Natal birth chart"
                          className="w-full border border-neutral-200"
                        />
                      ) : (
                        <div className="flex min-h-[200px] items-center justify-center border border-dashed border-neutral-300 bg-neutral-100 font-sans text-xs text-neutral-500">
                          Upload kundli image
                        </div>
                      )}
                    </div>
                  </section>
                )}
                {wrap(next, <StoneBlock stone={next.stone} />)}
              </div>
            );
            i++;
            continue;
          }
          // fall through to switch below by pushing a sentinel — handled by rendering one block
          nodes.push(renderSingle(block));
        }
        return nodes;
      })()}
    </article>
  );

  function renderSingle(block: ReportBlock): ReactNode {
    switch (block.type) {
      case 'header':
        return wrap(
          block,
          <header className="mb-4 flex flex-col gap-2 border-b border-neutral-200 pb-3">
            <ReportLogo logoUrl={block.logoUrl} />
            {block.navLinks.length > 0 ? (
              <nav className="flex flex-wrap items-center gap-1.5 font-sans text-[11px] tracking-wider text-neutral-600">
                {block.navLinks.map((l, i) => (
                  <span key={`${l}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 ? <span className="text-neutral-300">|</span> : null}
                    {l}
                  </span>
                ))}
              </nav>
            ) : null}
          </header>
        );
      case 'greeting':
        return wrap(
          block,
          <section className="mb-4 bg-[#e8f4fc] px-5 py-5">
            <h1 className="m-0 mb-2 text-3xl font-bold">Hi {customer.name || 'there'}!</h1>
            <p className="m-0 mb-1 text-lg font-bold">{block.headline}</p>
            <p className="m-0 text-sm text-neutral-600">{block.subheadline}</p>
          </section>
        );
      case 'customerDetails':
        return wrap(
          block,
          <section className="mb-5 grid grid-cols-2 gap-x-6 gap-y-2.5 border-b border-neutral-100 pb-5 font-sans text-sm">
            {[
              ['Place of birth', customer.birthPlace],
              ['Purpose', customer.purpose],
              ['Date of birth', customer.dob],
              ['Email', customer.email],
              ['Weight', customer.weightNote],
              ['Phone', customer.phone],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="mb-0.5 block text-[11px] text-neutral-500">{label}</span>
                <strong className="font-semibold">{value || '—'}</strong>
              </div>
            ))}
          </section>
        );
      case 'natalChart': {
        const img = block.imageUrl || chartImageUrl;
        return wrap(
          block,
          <section className="mb-6">
            <h2 className="m-0 mb-2 text-sm tracking-widest">NATAL BIRTH CHART</h2>
            <p className="font-sans text-sm leading-relaxed text-neutral-600">{block.description}</p>
            <div className="mt-3 max-w-xs">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="Natal birth chart" className="w-full border border-neutral-200" />
              ) : (
                <div className="flex min-h-[240px] items-center justify-center border border-dashed border-neutral-300 bg-neutral-100 font-sans text-xs text-neutral-500">
                  Upload kundli image
                </div>
              )}
            </div>
          </section>
        );
      }
      case 'primaryStone':
        return wrap(block, <StoneBlock stone={block.stone} />);
      case 'additionalStones':
        return wrap(
          block,
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-bold">Additionally Helpful Gemstones</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {block.stones.map((s, i) => (
                <StoneBlock key={`${s.role}-${i}`} stone={s} compact />
              ))}
            </div>
          </section>
        );
      case 'tieredProducts':
        return wrap(
          block,
          <section className="mb-6 font-sans">
            <h2 className="font-serif text-lg font-bold">{block.category}:</h2>
            <p className="text-blue-700 underline">
              {block.weight} + {block.gemLabel}
            </p>
            <p className="text-[11px] tracking-wide text-neutral-500">{block.endorsement}</p>
            <p className="mt-2 font-bold">Suggested For:</p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {block.suggestedFor.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {block.tiers.map((t) => (
              <div key={t.label} className="my-4 border-l-2 border-neutral-200 pl-3">
                <h4 className="m-0 mb-2 font-bold">{t.label}</h4>
                <ProductImage url={t.product.imageUrl} alt={t.product.name} />
                <p className="mt-1 text-blue-700 underline">{t.product.name || 'Select product'}</p>
                {t.product.origin ? <p className="text-xs">Origin: {t.product.origin}</p> : null}
                {t.product.priceLabel ? <p className="text-xs font-semibold">{t.product.priceLabel}</p> : null}
              </div>
            ))}
          </section>
        );
      case 'stoneGrid':
        return wrap(
          block,
          <section className="mb-6 text-center">
            <h2 className="mb-3 text-lg font-bold">Your Gems Recommendation</h2>
            <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
              {block.stones.map((s, i) => (
                <div key={`${s.role}-${i}`} className="border border-neutral-200 p-3">
                  <h3 className="m-0 text-xs font-bold">{STONE_ROLE_LABELS[s.role]} :</h3>
                  <p className="mb-2 font-bold">{s.gemLabel}</p>
                  <ProductImage url={s.product.imageUrl} alt={s.gemLabel} />
                  <div className="mt-2 border-t border-dashed border-neutral-300 font-sans text-[11px]">
                    <div className="border-b border-dashed border-neutral-300 py-1.5">Weight in Carat : {s.weight}</div>
                    {s.wearDay ? <div className="border-b border-dashed border-neutral-300 py-1.5">Wear Day: {s.wearDay}</div> : null}
                    {s.wearFinger ? (
                      <div className="border-b border-dashed border-neutral-300 py-1.5">Wear Finger: {s.wearFinger}</div>
                    ) : null}
                    {s.metal ? <div className="border-b border-dashed border-neutral-300 py-1.5">Metal: {s.metal}</div> : null}
                    {s.wearDeity ? <div className="py-1.5">Wear Deity: {s.wearDeity}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'consultationCta':
        return wrap(
          block,
          <section className="my-7 bg-blue-600 px-5 py-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="m-0 font-sans text-sm font-bold tracking-wide">{block.title}</p>
                <p className="mt-1.5 text-2xl font-bold">{block.priceLabel}</p>
              </div>
              <span className="inline-block border border-white bg-white px-4 py-2 font-sans text-xs font-bold text-[#e85d04]">
                {block.buttonLabel}
              </span>
            </div>
          </section>
        );
      case 'whyUs':
        return wrap(
          block,
          <section className="my-7 text-center">
            <h2 className="text-xl font-bold">{block.title}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 font-sans text-sm sm:grid-cols-2">
              {block.items.map((item, i) => (
                <div key={`${item.text}-${i}`} className="bg-neutral-50 p-4">
                  <strong>{item.text}</strong>
                </div>
              ))}
            </div>
          </section>
        );
      case 'footer':
        return wrap(
          block,
          <footer className="mt-7 bg-[#f5f0eb] px-4 py-4 font-sans text-sm">
            <p>
              <strong>Contact</strong> {block.contact}
            </p>
            <p>
              <strong>Address</strong> {block.address}
            </p>
            <p className="mt-3 text-[11px] text-neutral-500">{block.note}</p>
          </footer>
        );
      default:
        return null;
    }
  }
}
