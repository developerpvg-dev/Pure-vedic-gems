import type { ReactNode } from 'react';
import {
  formatGstRatePercent,
  parseOrderTaxBreakdown,
  type OrderTaxBreakdownView,
} from '@/lib/orders/tax-breakdown-display';

type MoneyFmt = (amount: number) => string;

/**
 * Renders CGST/SGST/IGST + per-component rates from orders.tax_breakdown.
 * Used on admin order detail, print receipt, and offline POS.
 */
export function OrderTaxBreakdownBlock({
  taxBreakdown,
  formatMoney,
  /** print = always expanded (no disclosure); admin/pos can use compact */
  variant = 'admin',
}: {
  taxBreakdown: unknown;
  formatMoney: MoneyFmt;
  variant?: 'admin' | 'print' | 'pos';
}): ReactNode {
  const view = parseOrderTaxBreakdown(taxBreakdown);
  if (!view) return null;

  const hasSplit = view.cgst > 0 || view.sgst > 0 || view.igst > 0;
  const jurisdictionNote = [
    view.jurisdiction?.replace(/_/g, ' '),
    view.destinationState && view.destinationState !== 'Unknown'
      ? view.destinationState
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const componentsList = view.components.length > 0 ? (
    <ul className={variant === 'print' ? 'mt-2 space-y-1.5 text-sm' : 'mt-2 space-y-1 text-xs'}>
      {view.components.map((c, i) => (
        <li key={`${c.label}-${i}`} className="flex justify-between gap-3">
          <span className="min-w-0 text-stone-600">
            {c.label}
            {c.ratePercent > 0 ? (
              <span className="font-medium text-stone-800">
                {' '}
                @ {formatGstRatePercent(c.ratePercent)}
              </span>
            ) : null}
            {c.hsnCode ? (
              <span className="text-stone-400"> · HSN {c.hsnCode}</span>
            ) : null}
          </span>
          <span className="shrink-0 tabular-nums text-stone-800">
            {formatMoney(c.totalTax)}
            <span className="text-stone-400"> on {formatMoney(c.taxableAmount)}</span>
          </span>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div
      className={
        variant === 'print'
          ? 'mt-3 border-t border-stone-200 pt-3'
          : 'border-t border-stone-200 pt-2'
      }
    >
      {hasSplit ? (
        <div className={variant === 'print' ? 'space-y-1 text-sm' : 'space-y-1 text-xs text-stone-500'}>
          <p className="mb-1 font-medium text-stone-600">
            GST split
            {jurisdictionNote ? ` (${jurisdictionNote})` : ''}
          </p>
          {view.cgst > 0 ? (
            <div className="flex justify-between gap-4">
              <span>CGST</span>
              <span className="tabular-nums text-stone-800">{formatMoney(view.cgst)}</span>
            </div>
          ) : null}
          {view.sgst > 0 ? (
            <div className="flex justify-between gap-4">
              <span>SGST</span>
              <span className="tabular-nums text-stone-800">{formatMoney(view.sgst)}</span>
            </div>
          ) : null}
          {view.igst > 0 ? (
            <div className="flex justify-between gap-4">
              <span>IGST</span>
              <span className="tabular-nums text-stone-800">{formatMoney(view.igst)}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {componentsList ? (
        variant === 'print' || variant === 'admin' ? (
          <div className={hasSplit ? 'mt-3' : undefined}>
            <p className="text-xs font-medium text-stone-600">
              Taxable components
              <span className="font-normal text-stone-400">
                {' '}
                (loose stone 0.25% · jewellery 3% · shipping 18%)
              </span>
            </p>
            {componentsList}
          </div>
        ) : (
          <details className={hasSplit ? 'mt-2 border-t border-stone-200 pt-2' : undefined}>
            <summary className="cursor-pointer text-xs font-medium text-stone-600">
              Taxable components
            </summary>
            {componentsList}
          </details>
        )
      ) : null}
    </div>
  );
}

/** Re-export parse for callers that need the view model. */
export function getOrderTaxBreakdownView(raw: unknown): OrderTaxBreakdownView | null {
  return parseOrderTaxBreakdown(raw);
}
