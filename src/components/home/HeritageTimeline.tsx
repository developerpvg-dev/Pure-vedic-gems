import Image from 'next/image';

const TIMELINE = [
  { year: '1937', label: "Founded in Old Delhi's Gem Quarter" },
  { year: '1960', label: '2nd Generation Expands Nationwide' },
  { year: '1985', label: '3rd Gen — Pan-India Presence' },
  { year: '2005', label: 'Digital & International Presence' },
  { year: '2015', label: 'E-Commerce & Global Clientele' },
  { year: '2026', label: '50K+ Customers · Next-Gen Platform' },
];

export function HeritageTimeline() {
  return (
    <section className="w-full">
      <div className="">
        <div className="grid grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          {/* Left — Image with overlay text */}
          <div className="relative aspect-[4/3] md:aspect-auto">
            <Image
              src="https://images.unsplash.com/photo-1551122089-4e3e72477432?w=800&h=900&fit=crop&q=80"
              alt="Heritage gemstone legacy"
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
                Our Legacy
              </p>
              <h2
                className="font-heading text-white"
                style={{ fontSize: 'clamp(26px, 3vw, 38px)' }}
              >
                87 Years of Vedic Remedies
              </h2>
              <p className="mt-3 max-w-[400px] text-sm leading-relaxed text-white/70">
                Four generations of expertise in sourcing, certifying, and energizing Vedic remedies for a global clientele.
              </p>
            </div>
          </div>

          {/* Right — Timeline items */}
          <div className="bg-[var(--pvg-surface)] p-6 md:p-8 lg:p-10">
            <div className="relative space-y-0">
              {TIMELINE.map((item, i) => (
                <div key={item.year} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--pvg-accent)] bg-[var(--pvg-bg)]"
                    >
                      <span className="text-[11px] font-bold text-[var(--pvg-accent)]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className="w-px flex-1 bg-[var(--pvg-border)]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pt-1.5">
                    <p className="font-heading text-lg font-bold text-[var(--pvg-primary)]">
                      {item.year}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--pvg-muted)]">
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}