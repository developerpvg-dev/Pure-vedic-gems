'use client';

import { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';

const TENURES = [3, 6, 9, 12, 18, 24];

function calculateMonthly(amount: number, months: number, annualRate: number) {
  if (annualRate <= 0) return Math.ceil(amount / months);
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, months);
  return Math.ceil((amount * monthlyRate * factor) / (factor - 1));
}

export function EmiCalculator({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const [months, setMonths] = useState(12);
  const [annualRate, setAnnualRate] = useState(12);
  const monthly = useMemo(() => calculateMonthly(amount, months, annualRate), [amount, annualRate, months]);
  const totalPayable = monthly * months;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold-light text-brand-accent">
          <Calculator className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent">EMI estimate</p>
              <p className="font-heading text-xl text-brand-primary">{formatPrice(monthly)}/mo</p>
            </div>
            <p className="text-right text-xs text-brand-muted">for {months} months<br />Total {formatPrice(totalPayable)}</p>
          </div>
          <div className={compact ? 'mt-3 grid grid-cols-2 gap-2' : 'mt-4 grid gap-3 sm:grid-cols-2'}>
            <label>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Tenure</span>
              <select value={months} onChange={(event) => setMonths(Number(event.target.value))} className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none">
                {TENURES.map((tenure) => <option key={tenure} value={tenure}>{tenure} months</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">APR</span>
              <input type="number" min={0} max={36} step={0.5} value={annualRate} onChange={(event) => setAnnualRate(Number(event.target.value))} className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none" />
            </label>
          </div>
          <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-brand-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Estimate only. Final EMI, bank charges, eligibility, and payment method availability are confirmed by the payment provider at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}