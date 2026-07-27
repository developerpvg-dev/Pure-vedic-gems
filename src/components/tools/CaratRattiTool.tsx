'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft, Scale } from 'lucide-react';
import { trackAnalyticsEvent } from '@/lib/utils/analytics';
import { RATTI_PER_CARAT, caratToRatti, rattiToCarat } from '@/lib/utils/format';

function formatDecimal(value: number) {
  if (!Number.isFinite(value)) return '';
  return String(Math.round(value * 1000) / 1000);
}

export function CaratRattiTool() {
  const [carat, setCarat] = useState('1');
  const ratti = useMemo(() => formatDecimal(caratToRatti(Number(carat || 0))), [carat]);
  const quickValues = [1, 2, 3, 5, 7.25, 9];

  const updateCarat = (value: string) => {
    setCarat(value);
    trackAnalyticsEvent('tool_use', { tool: 'carat_to_ratti', input_unit: 'carat' });
  };

  const updateRatti = (value: string) => {
    setCarat(value ? formatDecimal(rattiToCarat(Number(value || 0))) : '');
    trackAnalyticsEvent('tool_use', { tool: 'carat_to_ratti', input_unit: 'ratti' });
  };

  return (
    <div className="pvg-tool-layout grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <section className="pvg-tool-card p-5 md:p-7">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fdf3e7] text-[#7a1515]">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="pvg-tool-card-title">Carat to Ratti Converter</h2>
            <p className="pvg-tool-card-sub">Using 1 carat = {RATTI_PER_CARAT} ratti.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <label className="block">
            <span className="pvg-tool-label">Carat</span>
            <input
              value={carat}
              onChange={(event) => updateCarat(event.target.value)}
              inputMode="decimal"
              className="pvg-tool-input text-lg font-semibold"
              placeholder="1.00"
            />
          </label>
          <div className="hidden justify-center pb-3 text-[#6b5b4e] md:flex" aria-hidden="true">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <label className="block">
            <span className="pvg-tool-label">Ratti</span>
            <input
              value={ratti}
              onChange={(event) => updateRatti(event.target.value)}
              inputMode="decimal"
              className="pvg-tool-input text-lg font-semibold"
              placeholder="1.10"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {quickValues.map((value) => (
            <button key={value} type="button" onClick={() => updateCarat(String(value))} className="pvg-tool-chip">
              {value} ct
            </button>
          ))}
        </div>
      </section>

      <aside className="pvg-tool-card-alt p-5 md:p-7">
        <p className="pvg-tool-label">Buying Note</p>
        <h3 className="pvg-tool-card-title" style={{ marginTop: '0.5rem' }}>Use weight with context</h3>
        <p className="mt-3 text-sm leading-7 text-[#5a5043]">
          Ratti is used in many Indian gemstone conversations, while certificates usually mention carat. Always compare stone quality, treatment, origin, and setting cost along with weight.
        </p>
      </aside>
    </div>
  );
}
