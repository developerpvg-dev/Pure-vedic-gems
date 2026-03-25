import Link from 'next/link';
import Image from 'next/image';

const ARTICLES = [
  {
    slug: 'yellow-sapphire-pukhraj-complete-guide',
    title: 'Complete Guide to Yellow Sapphire (Pukhraj)',
    excerpt: 'Everything you need to know — benefits for Jupiter, wearing rules, best origins, pricing factors, and how to identify genuine Pukhraj from treated stones.',
    category: 'Gemstone Guide',
    img: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=800&h=500&fit=crop&q=80',
    large: true,
  },
  {
    slug: 'navagraha-gemstone-connections',
    title: 'Navagraha & Gemstone Connections',
    excerpt: 'How the nine planets influence your life and which gemstones channel their cosmic energies.',
    category: 'Vedic Astrology',
    img: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=600&h=400&fit=crop&q=80',
    large: false,
  },
  {
    slug: 'real-vs-fake-expert-identification',
    title: 'Real vs Fake: Expert Identification',
    excerpt: 'Professional tips on spotting treated, synthetic, and counterfeit gemstones before you buy.',
    category: 'Buying Guide',
    img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&h=400&fit=crop&q=80',
    large: false,
  },
];

export function KnowledgeHighlights() {
  return (
    <section className="px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
            Knowledge Hub
          </p>
          <h2
            className="font-heading text-[var(--pvg-primary)]"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}
          >
            Wisdom from the Ancients
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-sm leading-relaxed text-[var(--pvg-muted)] md:text-base">
            Deep-dive guides on Vedic gemology, planetary science, and spiritual practices.
          </p>
        </div>

        {/* Bento grid layout */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {/* Large featured article — spans full width on mobile, left column on desktop */}
          <Link
            href={`/knowledge/${ARTICLES[0].slug}`}
            className="group relative overflow-hidden rounded-2xl md:row-span-2"
          >
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
              <Image
                src={ARTICLES[0].img}
                alt={ARTICLES[0].title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <span className="mb-2 inline-block rounded bg-[var(--pvg-accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--pvg-primary)]">
                  {ARTICLES[0].category}
                </span>
                <h3 className="mt-2 font-heading text-lg font-semibold text-white transition-colors group-hover:text-[var(--pvg-accent)] md:text-xl">
                  {ARTICLES[0].title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {ARTICLES[0].excerpt}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1.5px] text-[var(--pvg-accent)] transition-all group-hover:gap-3">
                  Read Guide &rarr;
                </span>
              </div>
            </div>
          </Link>

          {/* Smaller articles — right column */}
          {ARTICLES.slice(1).map((a) => (
            <Link
              key={a.slug}
              href={`/knowledge/${a.slug}`}
              className="group grid grid-cols-[120px_1fr] gap-0 overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] sm:grid-cols-[160px_1fr]"
            >
              <div className="relative">
                <Image
                  src={a.img}
                  alt={a.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="160px"
                />
              </div>
              <div className="flex flex-col justify-center p-4 md:p-5">
                <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--pvg-accent)]">
                  {a.category}
                </span>
                <h4 className="font-heading text-sm font-semibold text-[var(--pvg-primary)] transition-colors group-hover:text-[var(--pvg-accent)] md:text-[15px]">
                  {a.title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
                  {a.excerpt}
                </p>
                <span className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--pvg-primary)] transition-all group-hover:text-[var(--pvg-accent)] md:text-[11px]">
                  Read Guide &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}