'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft, Scale } from 'lucide-react';
import { trackAnalyticsEvent } from '@/lib/utils/analytics';

const RATTI_PER_CARAT = 1.1;

function formatDecimal(value: number) {
  if (!Number.isFinite(value)) return '';
  return String(Math.round(value * 1000) / 1000);
}

export function CaratRattiTool() {
  const [carat, setCarat] = useState('1');
  const ratti = useMemo(() => formatDecimal(Number(carat || 0) * RATTI_PER_CARAT), [carat]);
  const quickValues = [1, 2, 3, 5, 7.25, 9];

  const updateCarat = (value: string) => {
    setCarat(value);
    trackAnalyticsEvent('tool_use', { tool: 'carat_to_ratti', input_unit: 'carat' });
  };

  const updateRatti = (value: string) => {
    const nextCarat = Number(value || 0) / RATTI_PER_CARAT;
    setCarat(value ? formatDecimal(nextCarat) : '');
    trackAnalyticsEvent('tool_use', { tool: 'carat_to_ratti', input_unit: 'ratti' });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <section className="border border-brand-border bg-brand-surface p-5 md:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gold-light text-brand-primary">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-2xl text-brand-primary">Carat to Ratti Converter</h2>
            <p className="text-sm text-brand-muted">Using 1 carat = 1.1 ratti.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Carat</span>
            <input
              value={carat}
              onChange={(event) => updateCarat(event.target.value)}
              inputMode="decimal"
              className="h-14 w-full border border-brand-border bg-brand-bg px-4 text-lg font-semibold text-brand-primary outline-none focus:border-brand-accent"
              placeholder="1.00"
            />
          </label>
          <div className="hidden pb-4 text-brand-muted md:block">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Ratti</span>
            <input
              value={ratti}
              onChange={(event) => updateRatti(event.target.value)}
              inputMode="decimal"
              className="h-14 w-full border border-brand-border bg-brand-bg px-4 text-lg font-semibold text-brand-primary outline-none focus:border-brand-accent"
              placeholder="1.10"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {quickValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => updateCarat(String(value))}
              className="border border-brand-border px-3 py-2 text-xs font-bold text-brand-primary transition hover:border-brand-accent hover:text-brand-accent"
            >
              {value} ct
            </button>
          ))}
        </div>
      </section>

      <aside className="border border-brand-border bg-brand-bg-alt p-5 md:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Buying Note</p>
        <h3 className="mt-3 font-heading text-xl text-brand-primary">Use weight with context</h3>
        <p className="mt-3 text-sm leading-7 text-brand-muted">
          Ratti is used in many Indian gemstone conversations, while certificates usually mention carat. Always compare stone quality, treatment, origin, and setting cost along with weight.
        </p>
      </aside>
    </div>
  );
}