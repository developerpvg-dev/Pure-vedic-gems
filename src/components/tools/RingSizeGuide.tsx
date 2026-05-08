'use client';

import { Printer } from 'lucide-react';

const ringRows = [
  { india: '8', us: '4.5', uk: 'I', eu: '48', diameter: '15.3 mm' },
  { india: '10', us: '5.25', uk: 'K', eu: '50', diameter: '15.9 mm' },
  { india: '12', us: '6', uk: 'L 1/2', eu: '52', diameter: '16.5 mm' },
  { india: '14', us: '6.75', uk: 'N', eu: '54', diameter: '17.2 mm' },
  { india: '16', us: '7.5', uk: 'O 1/2', eu: '56', diameter: '17.8 mm' },
  { india: '18', us: '8.25', uk: 'Q', eu: '58', diameter: '18.4 mm' },
  { india: '20', us: '9', uk: 'R 1/2', eu: '60', diameter: '19.1 mm' },
  { india: '22', us: '10', uk: 'T 1/2', eu: '62', diameter: '19.8 mm' },
  { india: '24', us: '10.75', uk: 'V', eu: '64', diameter: '20.4 mm' },
  { india: '26', us: '11.5', uk: 'W 1/2', eu: '66', diameter: '21.0 mm' },
  { india: '28', us: '12.25', uk: 'Y', eu: '68', diameter: '21.6 mm' },
  { india: '30', us: '13', uk: 'Z+1', eu: '70', diameter: '22.3 mm' },
];

export function RingSizeGuide() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <section className="overflow-hidden border border-brand-border bg-brand-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border p-5">
          <div>
            <h2 className="font-heading text-2xl text-brand-primary">Ring Size Conversion Chart</h2>
            <p className="mt-1 text-sm text-brand-muted">Indian, US, UK, EU, and inside diameter reference.</p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 border border-brand-primary px-4 py-2 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="bg-brand-bg-alt text-[11px] uppercase tracking-[2px] text-brand-accent">
              <tr>
                <th className="px-4 py-3">India</th>
                <th className="px-4 py-3">US</th>
                <th className="px-4 py-3">UK/AU</th>
                <th className="px-4 py-3">EU</th>
                <th className="px-4 py-3">Inside Diameter</th>
              </tr>
            </thead>
            <tbody>
              {ringRows.map((row) => (
                <tr key={row.india} className="border-t border-brand-border text-brand-text">
                  <td className="px-4 py-3 font-bold text-brand-primary">{row.india}</td>
                  <td className="px-4 py-3">{row.us}</td>
                  <td className="px-4 py-3">{row.uk}</td>
                  <td className="px-4 py-3">{row.eu}</td>
                  <td className="px-4 py-3">{row.diameter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="border border-brand-border bg-brand-bg-alt p-5 md:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Sizing Tips</p>
        <h3 className="mt-3 font-heading text-2xl text-brand-primary">Measure after temperature settles</h3>
        <div className="mt-4 space-y-4 text-sm leading-7 text-brand-muted">
          <p>Measure at the end of the day when fingers are closer to their natural size.</p>
          <p>Wide rings may need a slightly larger size than slim bands.</p>
          <p>For astrological rings, confirm finger, metal, and setting style with the expert before final production.</p>
        </div>
      </aside>
    </div>
  );
}