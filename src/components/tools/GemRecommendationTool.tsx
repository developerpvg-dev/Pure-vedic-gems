'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';
import { trackLeadEvent } from '@/lib/utils/analytics';

type RecommendationResponse = {
  recommendation?: {
    rashi: string | null;
    primaryGemNames: string[];
    supportingGemNames: string[];
    landingHref: string;
    advisory: string;
    notes: string[];
  };
  error?: string;
};

type StoredHomeRecommendation = {
  payload?: {
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    purpose?: string;
  };
  recommendation?: NonNullable<RecommendationResponse['recommendation']>;
  createdAt?: number;
};

const homeRecommendationStorageKey = 'pvg_home_recommendation';
const homeRecommendationTtlMs = 30 * 60 * 1000;

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
  const [error, setError] = useState('');
  const [result, setResult] = useState<NonNullable<RecommendationResponse['recommendation']> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(homeRecommendationStorageKey);
    if (!raw) return;

    try {
      const stored = JSON.parse(raw) as StoredHomeRecommendation;
      if (!stored.createdAt || Date.now() - stored.createdAt > homeRecommendationTtlMs) {
        sessionStorage.removeItem(homeRecommendationStorageKey);
        return;
      }

      setBirthDate(stored.payload?.birthDate ?? '');
      setBirthTime(stored.payload?.birthTime ?? '');
      setBirthPlace(stored.payload?.birthPlace ?? '');
      setPurpose(stored.payload?.purpose ?? 'career growth');
      if (stored.recommendation) setResult(stored.recommendation);
    } catch {
      sessionStorage.removeItem(homeRecommendationStorageKey);
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
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

      if (!response.ok || !data.recommendation) {
        throw new Error(data.error || 'Unable to generate recommendation');
      }

      setResult(data.recommendation);
      trackLeadEvent('recommendation_tool', { purpose, has_birth_date: Boolean(birthDate) });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to generate recommendation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pvg-tool-layout grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={submit} className="pvg-tool-card p-5 md:p-7">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fdf3e7] text-[#7a1515]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="pvg-tool-card-title">Gem Recommendation</h2>
            <p className="pvg-tool-card-sub">A preliminary shortlist before expert review.</p>
          </div>
        </div>

        <div className="grid gap-4">
          <label>
            <span className="pvg-tool-label">Date of Birth</span>
            <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="pvg-tool-input" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="pvg-tool-label">Birth Time</span>
              <input type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} className="pvg-tool-input" />
            </label>
            <label>
              <span className="pvg-tool-label">Budget Ceiling</span>
              <input value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} inputMode="numeric" placeholder="INR" className="pvg-tool-input" />
            </label>
          </div>
          <label>
            <span className="pvg-tool-label">Birth Place</span>
            <input value={birthPlace} onChange={(event) => setBirthPlace(event.target.value)} placeholder="City, country" className="pvg-tool-input" />
          </label>
          <label>
            <span className="pvg-tool-label">Primary Purpose</span>
            <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className="pvg-tool-input">
              {purposes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>

        <button type="submit" disabled={isLoading} className="pvg-tool-btn mt-5 w-full">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Generate Shortlist
        </button>
        {error ? <p className="mt-3 text-sm font-semibold text-[#b53a2f]" role="alert">{error}</p> : null}
      </form>

      <section className="pvg-tool-card-alt p-5 md:p-7">
        {result ? (
          <div>
            <p className="pvg-tool-label">Preliminary Result</p>
            <h3 className="pvg-tool-card-title" style={{ marginTop: '0.5rem' }}>
              {result.rashi ? `${result.rashi} shortlist` : 'Purpose-led shortlist'}
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="pvg-tool-label">Primary gems</p>
                <ul className="mt-2 space-y-2 text-sm font-semibold text-[#2c0404]">
                  {result.primaryGemNames.map((gem) => <li key={gem}>{gem}</li>)}
                </ul>
              </div>
              <div>
                <p className="pvg-tool-label">Alternatives</p>
                <ul className="mt-2 space-y-2 text-sm text-[#5a5043]">
                  {result.supportingGemNames.map((gem) => <li key={gem}>{gem}</li>)}
                </ul>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-7 text-[#6b5b4e]">
              {result.notes.map((note) => <p key={note}>{note}</p>)}
            </div>
            <p className="mt-5 border-l-2 border-[#b8861e] pl-4 text-sm leading-7 text-[#2c0404]">{result.advisory}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={result.landingHref} className="pvg-tool-btn">View Shortlist</Link>
              <Link href="/consultation" className="pvg-tool-btn-outline">Book Consultation</Link>
            </div>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col justify-center sm:min-h-80">
            <p className="pvg-tool-label">How it works</p>
            <h3 className="pvg-tool-card-title" style={{ marginTop: '0.5rem' }}>Purpose first, chart-aware next</h3>
            <p className="mt-4 text-sm leading-7 text-[#5a5043]">
              The tool combines your purpose with a lightweight date-based rashi signal. It does not replace a full Vedic chart reading, but it gives a structured place to begin.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
