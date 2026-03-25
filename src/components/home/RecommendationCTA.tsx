'use client';

import { useState } from 'react';
import Image from 'next/image';

const PURPOSE_OPTIONS = [
  'Career Growth',
  'Health & Wellness',
  'Relationships',
  'Financial Prosperity',
  'Education',
  'Spiritual Growth',
];

export function RecommendationCTA() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    dob: '',
    birthTime: '',
    birthPlace: '',
    purpose: '',
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent(
      `Hi, I need a gemstone recommendation.\nName: ${form.name}\nPhone: ${form.phone}\nDOB: ${form.dob}\nBirth Time: ${form.birthTime}\nBirth Place: ${form.birthPlace}\nPurpose: ${form.purpose}`
    );
    window.open(`https://wa.me/919876543210?text=${msg}`, '_blank', 'noopener');
  };

  const inputCls =
    'w-full rounded-lg border border-[var(--pvg-border)] bg-[var(--pvg-bg)] px-4 py-3 text-sm text-[var(--pvg-text)] placeholder:text-[var(--pvg-muted)] outline-none focus:border-[var(--pvg-accent)] transition-colors';

  return (
    <section className="px-4 py-14 md:px-6 md:py-18">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-[var(--pvg-border)] md:grid-cols-2">
          {/* Left — Image + context */}
          <div className="relative aspect-[4/3] md:aspect-auto">
            <Image
              src="https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=800&h=900&fit=crop&q=80"
              alt="Vedic gemstone consultation"
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
                Not Sure Which Gem?
              </p>
              <h2
                className="font-heading text-white"
                style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}
              >
                Get Your Gemstone Recommendation
              </h2>
              <p className="mt-3 max-w-[380px] text-sm leading-relaxed text-white/70">
                Share your birth details and our Vedic experts will recommend the perfect gemstone aligned with your planetary chart.
              </p>
              {/* Trust badges */}
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                  50K+ Clients Served
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                  Free Consultation
                </span>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-[var(--pvg-surface)] p-6 md:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* DOB / Time / Place */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--pvg-muted)]">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={form.dob}
                    onChange={(e) => update('dob', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--pvg-muted)]">Birth Time</label>
                  <input
                    type="time"
                    value={form.birthTime}
                    onChange={(e) => update('birthTime', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--pvg-muted)]">Birth Place</label>
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={form.birthPlace}
                    onChange={(e) => update('birthPlace', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Name / Phone */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--pvg-muted)]">Your Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--pvg-muted)]">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    required
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--pvg-muted)]">Purpose</label>
                <select
                  required
                  value={form.purpose}
                  onChange={(e) => update('purpose', e.target.value)}
                  className={inputCls}
                  style={{ appearance: 'none' }}
                >
                  <option value="" disabled>Select Purpose</option>
                  {PURPOSE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--pvg-accent)' }}
              >
                Get Free Recommendation
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}