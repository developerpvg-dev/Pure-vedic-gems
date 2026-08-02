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
import { REPORT_TRUST_MARKS } from '@/lib/recommendations/blocks';

function SecLabel({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`m-0 text-[10px] font-medium uppercase tracking-[0.16em] ${
        light ? 'text-[#C9A84C]' : 'text-[#8A6400]'
      }`}
    >
      {children}
    </p>
  );
}

function SecHead({ num, label, title }: { num: string; label: string; title?: string }) {
  return (
    <div className="mb-3.5 flex items-start gap-3.5 border-b border-[rgba(61,43,31,0.12)] pb-2.5">
      <span className="min-w-[28px] text-[22px] font-semibold leading-none text-[#8A6400]">{num}</span>
      <div>
        <SecLabel>{label}</SecLabel>
        {title ? <h2 className="m-0 mt-0.5 text-[22px] font-semibold leading-tight text-[#3D2B1F]">{title}</h2> : null}
      </div>
    </div>
  );
}

function ProductImage({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex min-h-[120px] items-center justify-center border border-dashed border-[rgba(138,100,0,0.3)] bg-[#F4EADB] text-[10px] uppercase tracking-wider text-[#7A6250]">
        {alt || 'Product'}
      </div>
    );
  }
  return (
    <div className="inline-block max-w-full border border-[rgba(61,43,31,0.12)] bg-white p-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="block max-h-60 w-full max-w-[240px] bg-[#F4EADB] object-cover" />
    </div>
  );
}

function BenefitGlyph({ label }: { label: string }) {
  const Icon = BENEFIT_LUCIDE[label as BenefitOption] ?? BENEFIT_LUCIDE.Success;
  return (
    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(201,168,76,0.45)] bg-[rgba(201,168,76,0.12)] text-[#8A6400]">
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

function Benefits({ benefits }: { benefits: string[] }) {
  if (!benefits.length) return null;
  return (
    <div className="mt-3.5">
      <SecLabel>Suggested for</SecLabel>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
        {benefits.map((b) => (
          <div key={b} className="flex w-[68px] flex-col items-center gap-1 text-center text-[9px] leading-tight text-[#7A6250]">
            <BenefitGlyph label={b} />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WearMeta({ stone }: { stone: StoneCard }) {
  const rows: [string, string | undefined][] = [
    ['Wear day', stone.wearDay],
    ['Finger', stone.wearFinger],
    ['Metal', stone.metal],
    ['Deity', stone.wearDeity],
  ];
  const filled = rows.filter(([, v]) => v?.trim());
  if (!filled.length) return null;
  return (
    <table className="my-2.5 w-full border-collapse text-left text-[11px]">
      <tbody>
        {filled.map(([k, v]) => (
          <tr key={k} className="border-b border-[rgba(61,43,31,0.12)]">
            <th className="w-[40%] py-1.5 font-medium text-[#7A6250]">{k}</th>
            <td className="py-1.5 text-[13px] font-semibold text-[#3D2B1F]">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReportLogo({ logoUrl }: { logoUrl: string | null }) {
  const emblem = logoUrl || DEFAULT_REPORT_LOGO;
  const showWordmark = !logoUrl || logoUrl === DEFAULT_REPORT_LOGO;
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={emblem} alt="Pure Vedic Gems" className="h-11 w-11 object-contain" />
      {showWordmark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={DEFAULT_REPORT_WORDMARK} alt="Pure Vedic Gems" className="h-7 w-auto object-contain" />
      ) : null}
    </div>
  );
}

function StoneBlock({ stone, compact }: { stone: StoneCard; compact?: boolean }) {
  const role = STONE_ROLE_LABELS[stone.role] ?? stone.role;
  return (
    <div className={compact ? 'border border-[rgba(61,43,31,0.12)] bg-white p-3.5' : ''}>
      <p className="m-0 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8A6400]">{role}</p>
      <h3 className="m-0 mb-1 text-[22px] font-semibold leading-tight text-[#3D2B1F]">
        {stone.gemLabel || '—'}
      </h3>
      {stone.weight ? <p className="mb-2.5 text-[11px] text-[#7A6250]">Weight · {stone.weight}</p> : null}
      <ProductImage url={stone.product.imageUrl} alt={stone.product.name || stone.gemLabel} />
      {stone.product.name ? <p className="mt-2 text-xs text-[#7A6250]">{stone.product.name}</p> : null}
      {stone.product.priceLabel ? (
        <p className="m-0 mb-2 text-base font-semibold text-[#3D2B1F]">{stone.product.priceLabel}</p>
      ) : null}
      <WearMeta stone={stone} />
      <span className="mt-2.5 inline-block bg-[#8A6400] px-[18px] py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-white">
        View & Buy
      </span>
      <Benefits benefits={stone.benefits} />
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="mt-7 grid grid-cols-2 border border-[rgba(61,43,31,0.12)] bg-white sm:grid-cols-4">
      {REPORT_TRUST_MARKS.map((m, i) => (
        <div
          key={m.title}
          className={`px-3 py-3.5 text-center ${i < REPORT_TRUST_MARKS.length - 1 ? 'border-b border-[rgba(61,43,31,0.12)] sm:border-b-0 sm:border-r' : ''}`}
        >
          <strong className="mb-0.5 block text-sm font-semibold text-[#3D2B1F]">{m.title}</strong>
          <span className="text-[9px] leading-snug text-[#7A6250]">{m.detail}</span>
        </div>
      ))}
    </section>
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
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let section = 0;
  const nextNum = () => String(++section).padStart(2, '0');

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
        className={`relative cursor-pointer rounded-sm outline-offset-2 ${selected ? 'ring-2 ring-[#8A6400]' : 'hover:ring-1 hover:ring-[rgba(61,43,31,0.2)]'}`}
      >
        {child}
      </div>
    );
  }

  const nodes: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = blocks[i + 1];

    if (block.type === 'natalChart' && next?.type === 'primaryStone') {
      const n = nextNum();
      nodes.push(
        <div key={`${block.id}-${next.id}`} className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {wrap(
            block,
            <section>
              <SecHead num={n} label="Astrological basis" title="Natal birth chart" />
              <p className="m-0 mb-3 text-[13px] leading-relaxed text-[#7A6250]">{block.description}</p>
              <div className="max-w-xs border border-[rgba(61,43,31,0.12)] bg-white p-1.5">
                {block.imageUrl || chartImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(block.imageUrl || chartImageUrl)!} alt="Natal birth chart" className="w-full" />
                ) : (
                  <div className="flex min-h-[200px] items-center justify-center border border-dashed border-[rgba(138,100,0,0.3)] bg-[#F4EADB] text-[10px] uppercase tracking-wider text-[#7A6250]">
                    Upload kundli image
                  </div>
                )}
              </div>
            </section>
          )}
          {wrap(
            next,
            <div>
              <SecLabel>Primary recommendation</SecLabel>
              <div className="mt-2">
                <StoneBlock stone={next.stone} />
              </div>
            </div>
          )}
        </div>
      );
      i++;
      continue;
    }

    nodes.push(renderSingle(block));
  }

  if (!blocks.some((b) => b.type === 'footer')) {
    nodes.push(<TrustStrip key="trust" />);
  }

  return (
    <article
      className="mx-auto max-w-[800px] bg-[#FDFBF7] px-7 py-6 text-[13px] leading-normal text-[#261A10]"
      style={{ fontFamily: 'var(--font-roboto, Roboto, Helvetica, Arial, sans-serif)' }}
    >
      {nodes}
    </article>
  );

  function renderSingle(block: ReportBlock): ReactNode {
    switch (block.type) {
      case 'header':
        return wrap(
          block,
          <header className="mb-5 border-b-2 border-[#3D2B1F] pb-3.5">
            <div className="mb-3.5 flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.14em] text-[#7A6250]">
              <span className="font-semibold text-[#8A6400]">Gem recommendation report</span>
              <span>{reportDate}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <ReportLogo logoUrl={block.logoUrl} />
              {block.navLinks.length > 0 ? (
                <nav className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7A6250]">
                  {block.navLinks.map((l, i) => (
                    <span key={`${l}-${i}`}>{l}</span>
                  ))}
                </nav>
              ) : null}
            </div>
          </header>
        );
      case 'greeting':
        return wrap(
          block,
          <section className="mb-6 border border-[rgba(61,43,31,0.12)] border-l-[3px] border-l-[#8A6400] bg-white px-5 py-4">
            <SecLabel>Prepared for</SecLabel>
            <h1 className="m-0 mt-1 mb-2 text-[32px] font-semibold leading-tight text-[#3D2B1F]">
              {customer.name || 'there'}
            </h1>
            <p className="m-0 mb-1 text-lg font-semibold leading-snug text-[#261A10]">{block.headline}</p>
            <p className="m-0 text-[13px] text-[#7A6250]">{block.subheadline}</p>
          </section>
        );
      case 'customerDetails': {
        const n = nextNum();
        const rows: [string, string][] = [
          ['Place of birth', customer.birthPlace || '—'],
          ['Date of birth', customer.dob || '—'],
          ['Purpose', customer.purpose || '—'],
          ['Email', customer.email || '—'],
          ['Phone', customer.phone || '—'],
          ['Weight note', customer.weightNote || '—'],
        ];
        return wrap(
          block,
          <section className="mb-6">
            <SecHead num={n} label="Client information" />
            <table className="w-full border-collapse border border-[rgba(61,43,31,0.12)] bg-white">
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label} className="border-b border-[rgba(61,43,31,0.12)] last:border-b-0">
                    <th className="w-[34%] bg-[#F4EADB] px-3.5 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[#7A6250]">
                      {label}
                    </th>
                    <td className="px-3.5 py-2.5 text-[15px] font-semibold text-[#3D2B1F]">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      }
      case 'natalChart': {
        const img = block.imageUrl || chartImageUrl;
        const n = nextNum();
        return wrap(
          block,
          <section className="mb-6">
            <SecHead num={n} label="Astrological basis" title="Natal birth chart" />
            <p className="m-0 mb-3 text-[13px] leading-relaxed text-[#7A6250]">{block.description}</p>
            <div className="max-w-xs border border-[rgba(61,43,31,0.12)] bg-white p-1.5">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="Natal birth chart" className="w-full" />
              ) : (
                <div className="flex min-h-[220px] items-center justify-center border border-dashed border-[rgba(138,100,0,0.3)] bg-[#F4EADB] text-[10px] uppercase tracking-wider text-[#7A6250]">
                  Upload kundli image
                </div>
              )}
            </div>
          </section>
        );
      }
      case 'primaryStone': {
        const n = nextNum();
        return wrap(
          block,
          <section className="mb-6">
            <SecHead num={n} label="Primary recommendation" />
            <StoneBlock stone={block.stone} />
          </section>
        );
      }
      case 'additionalStones': {
        const n = nextNum();
        return wrap(
          block,
          <section className="mb-6">
            <SecHead num={n} label="Supporting remedies" title="Additionally helpful gemstones" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {block.stones.map((s, i) => (
                <StoneBlock key={`${s.role}-${i}`} stone={s} compact />
              ))}
            </div>
          </section>
        );
      }
      case 'tieredProducts': {
        const n = nextNum();
        return wrap(
          block,
          <section className="mb-6">
            <SecHead num={n} label={block.category || 'Product options'} title={block.gemLabel} />
            <p className="m-0 mb-2 text-[11px] text-[#7A6250]">{block.weight}</p>
            {block.endorsement ? (
              <p className="mb-2.5 inline-block border border-[rgba(138,100,0,0.25)] bg-[rgba(201,168,76,0.12)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8A6400]">
                {block.endorsement}
              </p>
            ) : null}
            {block.suggestedFor.length ? (
              <div className="mb-3.5 flex flex-wrap gap-1.5">
                {block.suggestedFor.map((s) => (
                  <span
                    key={s}
                    className="border border-[rgba(61,43,31,0.12)] bg-[#F4EADB] px-2 py-1 text-[9px] uppercase tracking-wider text-[#3D2B1F]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {block.tiers.map((t, idx) => (
                <div
                  key={t.label}
                  className={`p-3.5 text-center ${
                    idx === 1
                      ? 'border border-[rgba(138,100,0,0.4)] bg-gradient-to-b from-white to-[rgba(201,168,76,0.12)]'
                      : 'border border-[rgba(61,43,31,0.12)] bg-white'
                  }`}
                >
                  {idx === 1 ? (
                    <span className="mb-1.5 inline-block bg-[#8A6400] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white">
                      Recommended
                    </span>
                  ) : null}
                  <h4 className="m-0 mb-2.5 text-[15px] font-semibold">{t.label}</h4>
                  <ProductImage url={t.product.imageUrl} alt={t.product.name} />
                  <p className="mt-2 text-[11px] font-medium">{t.product.name || 'Select product'}</p>
                  {t.product.origin ? <p className="text-[11px] text-[#7A6250]">Origin · {t.product.origin}</p> : null}
                  {t.product.priceLabel ? (
                    <p className="text-[15px] font-semibold">{t.product.priceLabel}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        );
      }
      case 'stoneGrid': {
        const n = nextNum();
        return wrap(
          block,
          <section className="mb-6">
            <SecHead num={n} label="Wear guidance" title="Your gems recommendation" />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {block.stones.map((s, i) => (
                <div key={`${s.role}-${i}`} className="border border-[rgba(61,43,31,0.12)] bg-white p-3">
                  <p className="m-0 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8A6400]">
                    {STONE_ROLE_LABELS[s.role]}
                  </p>
                  <p className="mb-2 text-base font-semibold">{s.gemLabel}</p>
                  <ProductImage url={s.product.imageUrl} alt={s.gemLabel} />
                  <table className="mt-2 w-full border-collapse text-left text-[11px]">
                    <tbody>
                      <tr className="border-b border-[rgba(61,43,31,0.12)]">
                        <th className="w-[40%] py-1.5 font-medium text-[#7A6250]">Weight</th>
                        <td className="py-1.5 text-[13px] font-semibold">{s.weight} ct</td>
                      </tr>
                      {s.wearDay ? (
                        <tr className="border-b border-[rgba(61,43,31,0.12)]">
                          <th className="py-1.5 font-medium text-[#7A6250]">Wear day</th>
                          <td className="py-1.5 text-[13px] font-semibold">{s.wearDay}</td>
                        </tr>
                      ) : null}
                      {s.wearFinger ? (
                        <tr className="border-b border-[rgba(61,43,31,0.12)]">
                          <th className="py-1.5 font-medium text-[#7A6250]">Finger</th>
                          <td className="py-1.5 text-[13px] font-semibold">{s.wearFinger}</td>
                        </tr>
                      ) : null}
                      {s.metal ? (
                        <tr className="border-b border-[rgba(61,43,31,0.12)]">
                          <th className="py-1.5 font-medium text-[#7A6250]">Metal</th>
                          <td className="py-1.5 text-[13px] font-semibold">{s.metal}</td>
                        </tr>
                      ) : null}
                      {s.wearDeity ? (
                        <tr>
                          <th className="py-1.5 font-medium text-[#7A6250]">Deity</th>
                          <td className="py-1.5 text-[13px] font-semibold">{s.wearDeity}</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>
        );
      }
      case 'consultationCta':
        return wrap(
          block,
          <section className="my-6 bg-[#2C1A0E] px-5 py-4 text-[#FDF7EE]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <SecLabel light>Personal guidance</SecLabel>
                <p className="m-0 mt-0.5 text-lg font-semibold">{block.title}</p>
                <p className="mt-1.5 text-[26px] font-semibold text-[#C9A84C]">{block.priceLabel}</p>
              </div>
              <span className="inline-block border border-[rgba(201,168,76,0.5)] bg-white px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#3D2B1F]">
                {block.buttonLabel}
              </span>
            </div>
          </section>
        );
      case 'whyUs': {
        const n = nextNum();
        return wrap(
          block,
          <section className="mb-6">
            <SecHead num={n} label="Why Pure Vedic Gems" title={block.title} />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {block.items.map((item, i) => (
                <div
                  key={`${item.text}-${i}`}
                  className="flex items-start gap-2.5 border border-[rgba(61,43,31,0.12)] bg-white p-3"
                >
                  <span className="text-base font-semibold leading-none text-[#8A6400]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="m-0 text-xs font-medium leading-snug text-[#3D2B1F]">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        );
      }
      case 'footer':
        return wrap(
          block,
          <div>
            <TrustStrip />
            <footer className="pt-4">
              <div className="grid grid-cols-1 gap-4 border-t border-[rgba(61,43,31,0.12)] pt-4 sm:grid-cols-2">
                <div>
                  <SecLabel>Contact</SecLabel>
                  <p className="m-0 mt-0.5 text-[15px] font-semibold">{block.contact}</p>
                </div>
                <div>
                  <SecLabel>Address</SecLabel>
                  <p className="m-0 mt-0.5 text-[15px] font-semibold">{block.address}</p>
                </div>
              </div>
              <p className="mt-3.5 text-[9px] tracking-wide text-[#7A6250]">{block.note}</p>
            </footer>
          </div>
        );
      default:
        return null;
    }
  }
}
