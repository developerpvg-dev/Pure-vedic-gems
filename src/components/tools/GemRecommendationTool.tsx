'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';
import { trackLeadEvent } from '@/lib/utils/analytics';

type RecommendationResponse = {
  recommendation: {
    rashi: string | null;
    primaryGemNames: string[];
    supportingGemNames: string[];
    landingHref: string;
    advisory: string;
    notes: string[];
  };
};

const purposes = [
  { value: 'career growth', label: 'Career growth' },
  { value: 'marriage harmony', label: 'Marriage and harmony' },
  { value: 'protection grounding', label: 'Protection and grounding' },
  { value: 'wealth prosperity', label: 'Wealth and prosperity' },
];

export function GemRecommendationTool() {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [purpose, setPurpose] = useState('career growth');
  const [budgetMax, setBudgetMax] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResponse['recommendation'] | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const response = await fetch('/api/recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthDate: birthDate || undefined,
        birthTime: birthTime || undefined,
        birthPlace: birthPlace || undefined,
        purpose,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
      }),
    });
    const data = (await response.json()) as RecommendationResponse;
    setResult(data.recommendation);
    setIsLoading(false);
    trackLeadEvent('recommendation_tool', { purpose, has_birth_date: Boolean(birthDate) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="border border-brand-border bg-brand-surface p-5 md:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gold-light text-brand-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-2xl text-brand-primary">Gem Recommendation</h2>
            <p className="text-sm text-brand-muted">A preliminary shortlist before expert review.</p>
          </div>
        </div>

        <div className="grid gap-4">
          <label>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Date of Birth</span>
            <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="h-12 w-full border border-brand-border bg-brand-bg px-3 text-sm outline-none focus:border-brand-accent" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Birth Time</span>
              <input type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} className="h-12 w-full border border-brand-border bg-brand-bg px-3 text-sm outline-none focus:border-brand-accent" />
            </label>
            <label>
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Budget Ceiling</span>
              <input value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} inputMode="numeric" placeholder="INR" className="h-12 w-full border border-brand-border bg-brand-bg px-3 text-sm outline-none focus:border-brand-accent" />
            </label>
          </div>
          <label>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Birth Place</span>
            <input value={birthPlace} onChange={(event) => setBirthPlace(event.target.value)} placeholder="City, country" className="h-12 w-full border border-brand-border bg-brand-bg px-3 text-sm outline-none focus:border-brand-accent" />
          </label>
          <label>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Primary Purpose</span>
            <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className="h-12 w-full border border-brand-border bg-brand-bg px-3 text-sm outline-none focus:border-brand-accent">
              {purposes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>

        <button type="submit" disabled={isLoading} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 bg-brand-primary px-5 text-xs font-bold uppercase tracking-[1.5px] text-brand-bg transition hover:bg-brand-accent hover:text-brand-primary disabled:opacity-60">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Generate Shortlist
        </button>
      </form>

      <section className="border border-brand-border bg-brand-bg-alt p-5 md:p-7">
        {result ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">Preliminary Result</p>
            <h3 className="mt-3 font-heading text-3xl text-brand-primary">
              {result.rashi ? `${result.rashi} shortlist` : 'Purpose-led shortlist'}
            </h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[1.5px] text-brand-muted">Primary gems</p>
                <ul className="mt-2 space-y-2 text-sm font-semibold text-brand-primary">
                  {result.primaryGemNames.map((gem) => <li key={gem}>{gem}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[1.5px] text-brand-muted">Alternatives</p>
                <ul className="mt-2 space-y-2 text-sm text-brand-muted">
                  {result.supportingGemNames.map((gem) => <li key={gem}>{gem}</li>)}
                </ul>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-7 text-brand-muted">
              {result.notes.map((note) => <p key={note}>{note}</p>)}
            </div>
            <p className="mt-5 border-l-2 border-brand-accent pl-4 text-sm leading-7 text-brand-primary">{result.advisory}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={result.landingHref} className="bg-brand-primary px-5 py-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-bg">View Shortlist</Link>
              <Link href="/consultation" className="border border-brand-primary px-5 py-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">Book Consultation</Link>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-80 flex-col justify-center">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-accent">How it works</p>
            <h3 className="mt-3 font-heading text-3xl text-brand-primary">Purpose first, chart-aware next</h3>
            <p className="mt-4 text-sm leading-7 text-brand-muted">
              The tool combines your purpose with a lightweight date-based rashi signal. It does not replace a full Vedic chart reading, but it gives a structured place to begin.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}