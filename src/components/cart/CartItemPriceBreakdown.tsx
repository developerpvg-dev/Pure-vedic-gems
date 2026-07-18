'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import { buildCartItemPriceBreakdown } from '@/lib/cart/price-breakdown';
import type { CartItem } from '@/lib/types/cart';

function amountLabel(amount: number | null, display?: string) {
  if (display) return display;
  if (amount == null) return '—';
  if (amount === 0) return formatPrice(0);
  return formatPrice(amount);
}

export function CartItemPriceBreakdown({
  item,
  defaultOpen = false,
  gstNote,
}: {
  item: CartItem;
  defaultOpen?: boolean;
  /** Override the default GST / shipping footnote */
  gstNote?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const breakdown = useMemo(() => buildCartItemPriceBreakdown(item), [item]);

  const footnote =
    gstNote ??
    (breakdown.estimatedGst > 0
      ? 'GST shown is an estimate. Final tax is calculated at checkout based on your shipping address.'
      : 'Shipping and final GST/IGST are calculated at checkout.');

  return (
    <div className="mt-2 rounded-lg border border-[var(--pvg-border)]/80 bg-brand-bg-alt/60">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="text-[12px] font-semibold text-[var(--pvg-primary)]">
          Price breakdown
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[12px] font-bold tabular-nums text-[var(--pvg-primary)]">
            {formatPrice(item.price * item.quantity)}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[var(--pvg-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open ? (
        <div className="space-y-2 border-t border-[var(--pvg-border)]/70 px-3 py-2.5">
          {breakdown.lines.map((line) => (
            <div key={line.key} className="flex items-start justify-between gap-3 text-[12px]">
              <div className="min-w-0">
                <p className="font-medium text-[var(--pvg-text)]">{line.label}</p>
                {line.detail ? (
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--pvg-muted)]">{line.detail}</p>
                ) : null}
              </div>
              <span className="shrink-0 tabular-nums font-semibold text-[var(--pvg-primary)]">
                {amountLabel(line.amount, line.display)}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 border-t border-dashed border-[var(--pvg-border)] pt-2 text-[12px] font-semibold text-[var(--pvg-primary)]">
            <span>Item subtotal (ex-GST)</span>
            <span className="tabular-nums">{formatPrice(breakdown.preGstSubtotal * item.quantity)}</span>
          </div>

          {breakdown.gstLines.map((line) => (
            <div key={line.key} className="flex items-start justify-between gap-3 text-[12px]">
              <p className="text-[var(--pvg-muted)]">{line.label}</p>
              <span className="shrink-0 tabular-nums text-[var(--pvg-muted)]">
                {amountLabel(line.amount, line.display)}
              </span>
            </div>
          ))}

          <p className="text-[10px] leading-relaxed text-[var(--pvg-muted)]">{footnote}</p>
        </div>
      ) : null}
    </div>
  );
}
