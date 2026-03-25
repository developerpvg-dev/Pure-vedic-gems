import Link from 'next/link';
import Image from 'next/image';

export function DirectorsPick() {
  return (
    <section className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
            Director&apos;s Pick
          </p>
          <h2
            className="font-heading text-[var(--pvg-primary)]"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}
          >
            Personally Curated by Our Director
          </h2>
        </div>

        {/* Split layout */}
        <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-[var(--pvg-border)] md:grid-cols-2">
          {/* Left — Image */}
          <div className="relative aspect-[4/5] md:aspect-auto">
            <Image
              src="https://images.unsplash.com/photo-1624927637280-f033784c1279?w=800&h=1000&fit=crop&q=80"
              alt="Director curated gemstone"
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/20" />
            {/* Floating badge on image */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur-sm md:bottom-6 md:left-6">
              <p className="text-xs font-bold text-[var(--pvg-accent)]">4.22ct Ceylon Yellow Sapphire</p>
              <p className="text-[10px] text-white/70">Sri Lanka · Unheated · GIA Certified</p>
            </div>
          </div>

          {/* Right — Content */}
          <div className="flex flex-col justify-center bg-[var(--pvg-surface)] p-6 md:p-10 lg:p-14">
            {/* Quote */}
            <div className="relative">
              <span className="absolute -left-2 -top-4 font-heading text-[60px] leading-none text-[var(--pvg-accent)] opacity-15 md:text-[80px]">&ldquo;</span>
              <p className="relative z-10 font-heading text-base italic leading-relaxed text-[var(--pvg-text)] md:text-lg md:leading-[1.7]">
                Every gemstone that leaves our hands carries 87 years of knowledge, integrity, and the sacred trust of our clients.
              </p>
            </div>

            <div className="my-5 h-px w-12 bg-[var(--pvg-accent)]" />

            <p className="text-[13px] leading-relaxed text-[var(--pvg-muted)]">
              Pure Vedic Gems Pvt. Ltd. &mdash; Established 1937, 4 Generations of gemstone expertise serving over 50,000 clients worldwide.
            </p>

            {/* Director info */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pvg-primary)] font-heading text-base font-semibold text-[var(--pvg-bg)]">
                VM
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--pvg-text)]">Shri Vikas Mehra</p>
                <p className="text-xs text-[var(--pvg-muted)]">Director &amp; 4th Generation Gemologist</p>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="text-2xl font-bold text-[var(--pvg-accent)]">&#x20B9;2,85,000</span>
              <Link
                href="/shop/gemstone/1"
                className="rounded-full bg-[var(--pvg-primary)] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--pvg-bg)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                View This Pick &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}