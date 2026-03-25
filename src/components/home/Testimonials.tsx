'use client';

import { useState } from 'react';

const REVIEWS = [
  {
    name: 'Rajesh Kumar',
    location: 'Delhi',
    initials: 'RK',
    rating: 5,
    text: 'The Yellow Sapphire recommended by Vikas ji changed my career trajectory within 6 months. Their expertise in Vedic gemology is unmatched. Every detail — from selection to energization — was handled with utmost care.',
  },
  {
    name: 'Sarah Patel',
    location: 'London',
    initials: 'SP',
    rating: 5,
    text: 'Exceptional quality and service. The Blue Sapphire I received was beyond my expectations — certified, energized, and delivered with such personal attention that I felt like their only client.',
  },
  {
    name: 'Vikram M.',
    location: 'Mumbai',
    initials: 'VM',
    rating: 5,
    text: 'My family has been buying gems from PureVedic for 3 generations. Their commitment to authenticity and Vedic traditions is what sets them apart. Every stone tells a story of trust.',
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-[var(--pvg-surface)] px-4 py-14 md:px-6 md:py-18">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
            Testimonials
          </p>
          <h2
            className="font-heading text-[var(--pvg-primary)]"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}
          >
            Words of Trust
          </h2>
        </div>

        {/* 3-column card grid — all reviews visible */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
          {REVIEWS.map((review, i) => (
            <button
              key={review.name}
              onClick={() => setActive(i)}
              className={`group relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] md:p-6 ${
                active === i
                  ? 'border-[var(--pvg-accent)] bg-[var(--pvg-bg)] shadow-[0_16px_40px_rgba(0,0,0,0.06)]'
                  : 'border-[var(--pvg-border)] bg-[var(--pvg-bg)]'
              }`}
            >
              {/* Quote mark */}
              <span className="absolute -right-2 -top-2 font-heading text-[80px] leading-none text-[var(--pvg-accent)] opacity-[0.07]">
                &ldquo;
              </span>

              {/* Stars */}
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg
                    key={j}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5 text-[var(--pvg-accent)]"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                ))}
              </div>

              {/* Quote text */}
              <p className="relative z-10 text-sm leading-relaxed text-[var(--pvg-text)]">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-4 flex items-center gap-3 border-t border-[var(--pvg-border)] pt-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--pvg-accent), var(--pvg-primary))' }}
                >
                  {review.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--pvg-primary)]">{review.name}</p>
                  <p className="text-[11px] text-[var(--pvg-muted)]">{review.location}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}