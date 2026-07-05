'use client';

import { formatPrice } from '@/lib/utils/format';
import {
  getConfigurationDetailChips,
  getConfigurationDisplaySections,
} from '@/lib/utils/rudraksha-order-display';

const METAL_LABELS: Record<string, string> = {
  gold_22k: '22K Gold',
  gold_18k: '18K Gold',
  gold_14k: '14K Gold',
  silver_925: '925 Sterling Silver',
  panchdhatu: 'Panchdhatu (Without Gold)',
  panchdhatu_with_gold: 'Panchdhatu (With Gold)',
  platinum: 'Platinum',
};

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ConfigurationDetailsDisplayProps {
  snapshot?: unknown;
  summary?: string | null;
  deliveryEtaLabel?: string | null;
  variant?: 'compact' | 'full';
  className?: string;
}

export function ConfigurationDetailsDisplay({
  snapshot,
  summary,
  deliveryEtaLabel,
  variant = 'compact',
  className = '',
}: ConfigurationDetailsDisplayProps) {
  if (!snapshot && !summary) return null;

  const chips = getConfigurationDetailChips(snapshot, summary);
  const sections = getConfigurationDisplaySections(snapshot);
  const eta = deliveryEtaLabel ?? sections.deliveryEta;

  if (variant === 'compact') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-block rounded bg-brand-gold-light px-2 py-0.5 text-[10px] font-medium text-[var(--pvg-accent)]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {sections.isRudraksha && sections.beads.length > 0 && (
          <ul className="space-y-1 rounded-md border border-[var(--pvg-border)]/70 bg-white/60 px-2 py-1.5 text-[10px] text-[var(--pvg-primary)]">
            {sections.beads.map((bead) => (
              <li key={bead.id} className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <span>
                  <span className="font-semibold text-[var(--pvg-accent)]">
                    {bead.role === 'primary' ? 'Primary' : 'Combo'} ·{' '}
                  </span>
                  {bead.mukhi_label} — {bead.name}
                </span>
                <span className="text-[var(--pvg-muted)]">
                  {bead.tag_number ? `Tag ${bead.tag_number}` : bead.sku ? `SKU ${bead.sku}` : null}
                  {bead.price > 0 ? ` · ${formatPrice(bead.price)}` : null}
                </span>
              </li>
            ))}
          </ul>
        )}

        {eta && (
          <p className="text-[11px] font-medium text-[var(--pvg-muted)]">Delivery ETA: {eta}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 text-xs ${className}`}>
      {sections.summary && (
        <p className="text-[var(--pvg-muted)]">{sections.summary}</p>
      )}

      {sections.isRudraksha && sections.beads.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Rudraksha Beads ({sections.beads.length})
          </p>
          <ul className="divide-y divide-amber-100 rounded-lg border border-amber-100 bg-white/80">
            {sections.beads.map((bead) => (
              <li key={bead.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2">
                <div>
                  <p className="font-semibold text-[var(--pvg-text)]">
                    <span className="text-amber-700">
                      {bead.role === 'primary' ? 'Primary' : 'Combo'} ·{' '}
                    </span>
                    {bead.mukhi_label} — {bead.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--pvg-muted)]">
                    {bead.sku ? `SKU: ${bead.sku}` : null}
                    {bead.sku && bead.tag_number ? ' · ' : null}
                    {bead.tag_number ? `Tag: ${bead.tag_number}` : null}
                    {bead.origin ? ` · Origin: ${bead.origin}` : null}
                  </p>
                </div>
                {bead.price > 0 && (
                  <span className="font-semibold text-[var(--pvg-text)]">{formatPrice(bead.price)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {sections.designName && (
          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Mounting</p>
            <p className="mt-0.5 font-semibold">{sections.designName}</p>
            {sections.designCategory && (
              <p className="text-[10px] text-[var(--pvg-muted)]">{sections.designCategory}</p>
            )}
          </div>
        )}
        {sections.metal && (
          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Metal</p>
            <p className="mt-0.5 font-semibold">{METAL_LABELS[sections.metal] ?? titleCase(sections.metal)}</p>
          </div>
        )}
        {sections.chainLength && (
          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Chain</p>
            <p className="mt-0.5 font-semibold">{sections.chainLength}</p>
          </div>
        )}
        {sections.certification && (
          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Certification</p>
            <p className="mt-0.5 font-semibold">{sections.certification}</p>
          </div>
        )}
        {sections.certificationSkipped && (
          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Certification</p>
            <p className="mt-0.5 font-semibold">Skipped</p>
          </div>
        )}
        {eta && (
          <div className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2 sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Delivery ETA</p>
            <p className="mt-0.5 font-semibold">{eta}</p>
          </div>
        )}
      </div>
    </div>
  );
}
