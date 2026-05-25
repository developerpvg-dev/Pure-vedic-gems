'use client';

import { Printer } from 'lucide-react';

const ringRows = [
  { india: '#1', diameter: '13', circumference: '41', us: '1', uk: 'B', france: '--', germany: '--', italy: '--' },
  { india: '#2', diameter: '13.4', circumference: '42', us: '2', uk: 'D', france: '41 1/2', germany: '13 1/4', italy: '1 1/2' },
  { india: '#3', diameter: '13.7', circumference: '43', us: '2 1/2', uk: 'E', france: '42 3/4', germany: '13 3/4', italy: '2 3/4' },
  { india: '#4', diameter: '14', circumference: '44', us: '3', uk: 'F', france: '44', germany: '14', italy: '4' },
  { india: '#5', diameter: '14.3', circumference: '45', us: '3 1/2', uk: 'G', france: '45 1/4', germany: '14 1/2', italy: '5 1/4' },
  { india: '#6', diameter: '14.6', circumference: '46', us: '3 3/4', uk: 'G 1/2', france: '45 7/8', germany: '14 3/4', italy: '5 7/8' },
  { india: '#7', diameter: '15', circumference: '47', us: '4', uk: 'H 1/2', france: '46 1/2', germany: '15', italy: '6 1/2' },
  { india: '#8', diameter: '15.3', circumference: '48', us: '4 1/2', uk: 'I 1/2', france: '47 3/4', germany: '15 1/2', italy: '7 3/4' },
  { india: '#9', diameter: '15.6', circumference: '49', us: '5', uk: 'J 1/2', france: '49', germany: '15 3/4', italy: '9' },
  { india: '#10', diameter: '15.9', circumference: '50', us: '5 1/2', uk: 'K 1/2', france: '50 1/4', germany: '16 1/4', italy: '10 1/4' },
  { india: '#11', diameter: '16.2', circumference: '51', us: '5 3/4', uk: 'L', france: '50 7/8', germany: '---', italy: '10 7/8' },
  { india: '#12', diameter: '16.5', circumference: '52', us: '6', uk: 'L 1/2', france: '51 1/2', germany: '16 1/2', italy: '11 1/2' },
  { india: '#13', diameter: '16.8', circumference: '53', us: '6 1/2', uk: 'M 1/2', france: '52 3/4', germany: '17', italy: '12 3/4' },
  { india: '#14', diameter: '17.2', circumference: '54', us: '7', uk: 'O', france: '54', germany: '17 1/4', italy: '14' },
  { india: '#15', diameter: '17.5', circumference: '55', us: '7 1/2', uk: 'P', france: '55 1/4', germany: '17 3/4', italy: '15 1/4' },
  { india: '#16', diameter: '17.8', circumference: '56', us: '8', uk: 'Q', france: '56 1/2', germany: '18', italy: '16 1/2' },
  { india: '#17', diameter: '18.1', circumference: '57', us: '8 1/2', uk: 'R', france: '57 3/4', germany: '18 1/2', italy: '17 3/4' },
  { india: '#18', diameter: '18.4', circumference: '58', us: '9', uk: 'S', france: '59', germany: '19', italy: '19' },
  { india: '#19', diameter: '18.8', circumference: '59', us: '9 1/2', uk: '---', france: '60 1/4', germany: '20', italy: '20 1/4' },
  { india: '#20', diameter: '19.1', circumference: '60', us: '10', uk: 'T 1/2', france: '61 1/2', germany: '20', italy: '21 1/2' },
  { india: '#21', diameter: '19.4', circumference: '61', us: '10 1/4', uk: 'U', france: '62 1/8', germany: '20 1/4', italy: '20 1/8' },
  { india: '#22', diameter: '19.7', circumference: '62', us: '10 1/2', uk: 'U 1/2', france: '62 3/4', germany: '20 1/2', italy: '22 3/4' },
  { india: '#23', diameter: '20', circumference: '63', us: '11', uk: 'V 1/2', france: '64', germany: '20 3/4', italy: '24' },
  { india: '#24', diameter: '20.3', circumference: '64', us: '11 1/2', uk: 'W 1/2', france: '65 1/4', germany: '21', italy: '25 1/4' },
  { india: '#25', diameter: '20.6', circumference: '65', us: '12', uk: 'Y', france: '66 1/2', germany: '21 1/4', italy: '26 1/2' },
  { india: '#26', diameter: '21', circumference: '66', us: '12 1/2', uk: 'Z', france: '67 3/4', germany: '21 3/4', italy: '27 3/4' },
  { india: '#27', diameter: '21.3', circumference: '67', us: '13', uk: 'Z 1/2', france: '69', germany: '22', italy: '29' },
];

export function RingSizeGuide() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <section className="overflow-hidden border border-brand-border bg-brand-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border p-5">
          <div>
            <h2 className="font-heading text-2xl text-brand-primary">International Ring Size Conversion Chart</h2>
            <p className="mt-1 text-sm text-brand-muted">India, US/Canada, UK/Australia/New Zealand, France, Germany, and Italy/Spain/Netherlands/Switzerland reference.</p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 border border-brand-primary px-4 py-2 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-brand-bg-alt text-[11px] uppercase tracking-[2px] text-brand-accent">
              <tr>
                <th className="px-4 py-3">India / China / Japan / South America</th>
                <th className="px-4 py-3">Diameter (mm)</th>
                <th className="px-4 py-3">Circumference (mm)</th>
                <th className="px-4 py-3">USA / Canada</th>
                <th className="px-4 py-3">UK / Australia / New Zealand</th>
                <th className="px-4 py-3">France</th>
                <th className="px-4 py-3">Germany</th>
                <th className="px-4 py-3">Italy / Spain / Netherlands / Switzerland</th>
              </tr>
            </thead>
            <tbody>
              {ringRows.map((row) => (
                <tr key={row.india} className="border-t border-brand-border text-brand-text">
                  <td className="px-4 py-3 font-bold text-brand-primary">{row.india}</td>
                  <td className="px-4 py-3">{row.diameter}</td>
                  <td className="px-4 py-3">{row.circumference}</td>
                  <td className="px-4 py-3">{row.us}</td>
                  <td className="px-4 py-3">{row.uk}</td>
                  <td className="px-4 py-3">{row.france}</td>
                  <td className="px-4 py-3">{row.germany}</td>
                  <td className="px-4 py-3">{row.italy}</td>
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
