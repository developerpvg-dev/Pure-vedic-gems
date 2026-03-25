import Link from 'next/link';

const EXPERTS = [
  {
    initials: 'VM',
    name: 'Shri Vikas Mehra',
    role: 'Director \u00B7 4th Gen Gemologist',
    years: '30+',
    clients: '12K+',
    rating: '5.0',
  },
  {
    initials: 'AM',
    name: 'Aarav Mehta',
    role: 'Senior Gemologist (GIA)',
    years: '15+',
    clients: '5K+',
    rating: '4.9',
  },
  {
    initials: 'PS',
    name: 'Pandit Sharma',
    role: 'Vedic Astrology Expert',
    years: '20+',
    clients: '8K+',
    rating: '4.8',
  },
];

export function ExpertTeam() {
  return (
    <section className="bg-[var(--pvg-surface)] px-4 py-14 md:px-6 md:py-18">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
            Our Experts
          </p>
          <h2
            className="font-heading text-[var(--pvg-primary)]"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}
          >
            Meet Our Experts
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-sm leading-relaxed text-[var(--pvg-muted)] md:text-base">
            Certified gemologists and Vedic consultants with decades of combined expertise.
          </p>
        </div>

        {/* 3-col expert cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
          {EXPERTS.map((e) => (
            <div
              key={e.initials}
              className="group rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg)] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(92,61,46,0.06)] md:p-10"
            >
              {/* Avatar */}
              <div className="mx-auto mb-5 flex h-[100px] w-[100px] items-center justify-center rounded-full border-[3px] border-[var(--pvg-accent)] bg-[var(--pvg-primary)] font-heading text-4xl font-semibold text-[var(--pvg-bg)]">
                {e.initials}
              </div>

              <h4 className="font-heading text-lg font-semibold text-[var(--pvg-primary)]">
                {e.name}
              </h4>
              <p className="mt-1 text-[13px] font-medium text-[var(--pvg-accent)]">
                {e.role}
              </p>

              {/* Stats */}
              <div className="mx-auto mt-4 flex justify-center gap-6">
                <div className="text-center">
                  <p className="font-heading text-xl font-bold text-[var(--pvg-primary)]">{e.years}</p>
                  <p className="text-[11px] uppercase tracking-wider text-[var(--pvg-muted)]">Years</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-xl font-bold text-[var(--pvg-primary)]">{e.clients}</p>
                  <p className="text-[11px] uppercase tracking-wider text-[var(--pvg-muted)]">Clients</p>
                </div>
              </div>

              {/* Rating */}
              <p className="mt-4 text-sm text-[var(--pvg-accent)]">
                {'\u2605\u2605\u2605\u2605\u2605'} {e.rating}
              </p>

              <Link
                href="/consultation"
                className="mt-5 inline-flex h-10 w-full items-center justify-center rounded border border-[var(--pvg-primary)] text-xs font-semibold uppercase tracking-wider text-[var(--pvg-primary)] transition-colors hover:bg-[var(--pvg-primary)] hover:text-[var(--pvg-bg)]"
              >
                Book Consultation
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
