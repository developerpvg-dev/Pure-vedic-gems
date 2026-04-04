import Link from 'next/link';
import Image from 'next/image';
import { type LucideIcon, Gem, PenLine, Layers, BadgeCheck, Flame } from 'lucide-react';

const STEPS: Array<{ num: number; label: string; desc: string; Icon: LucideIcon }> = [
  { num: 1, label: 'Choose Gem', desc: 'Select from certified natural gemstones', Icon: Gem },
  { num: 2, label: 'Pick Design', desc: 'Browse rings, pendants, bracelets & more', Icon: PenLine },
  { num: 3, label: 'Select Metal', desc: 'Gold, platinum, silver — your choice', Icon: Layers },
  { num: 4, label: 'Certification', desc: 'GIA, IGI, GRS lab certification included', Icon: BadgeCheck },
  { num: 5, label: 'Energization', desc: 'Vedic puja and mantra energization', Icon: Flame },
];

export function ConfiguratorCTA() {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: 'var(--pvg-primary)' }}>
      {/* Subtle glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.05), transparent)' }}
      />

      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1.3fr] lg:grid-cols-[1fr_1fr_1.2fr]">
        {/* Left — Image showing gem-to-jewelry transformation */}
        <div className="relative hidden aspect-[3/4] lg:block lg:aspect-auto">
          <Image
            src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=800&fit=crop&q=80"
            alt="Gemstone to jewelry transformation"
            fill
            className="object-cover"
            sizes="33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--pvg-primary)]" />
          <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-black/30 p-4 backdrop-blur-sm">
            <p className="text-xs font-bold text-[var(--pvg-accent)]">From Raw Gem → Finished Jewellery</p>
            <p className="mt-1 text-[11px] text-white/60">See the transformation live</p>
          </div>
        </div>

        {/* Middle — Text content */}
        <div className="flex flex-col justify-center p-8 md:p-10 lg:p-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
            First in India
          </p>
          <h2
            className="font-heading text-[var(--pvg-bg)]"
            style={{ fontSize: 'clamp(26px, 3vw, 38px)' }}
          >
            Gem-to-Jewellery Configurator
          </h2>
          <p className="mt-4 max-w-[400px] text-sm leading-relaxed text-white/70 md:text-base">
            From raw stone to finished jewellery &mdash; design your dream piece in 5 simple steps.
          </p>
          <Link
            href="/configure"
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--pvg-accent)] px-8 py-3.5 text-sm font-bold text-[var(--pvg-primary)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          >
            Start Configuring &rarr;
          </Link>
        </div>

        {/* Right — Steps */}
        <div className="border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-8 lg:p-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 transition-all hover:border-[var(--pvg-accent)]/30 hover:bg-white/[0.08]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pvg-accent)]">
                  <s.Icon className="h-5 w-5" style={{ color: 'var(--pvg-primary)' }} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--pvg-accent)]">
                      STEP {s.num}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-white/90">{s.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/45">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}