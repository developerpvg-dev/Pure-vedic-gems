import type { Metadata } from 'next';
import Image from 'next/image';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const metadata: Metadata = {
  title: 'About Us — Our Heritage Story',
  description:
    'PureVedicGems — a four-generation heritage Vedic gemstone brand established in 1937. Discover our legacy, values, and commitment to authentic planetary gemology.',
};

const TIMELINE = [
  {
    year: '1937',
    title: 'The Beginning',
    description:
      'Our founder began his journey in the narrow lanes of Old Delhi, studying the ancient art of Vedic gemology under the tutelage of revered Jyotish scholars. With a small collection of carefully sourced gems and an unwavering commitment to authenticity, the first seeds of PureVedicGems were planted.',
  },
  {
    year: '1965',
    title: 'Second Generation Takes the Helm',
    description:
      'The second generation expanded our expertise, forging relationships with gemstone mines in Sri Lanka, Myanmar, and Colombia. Formal gemological training was combined with the family\'s inherited Vedic knowledge, creating a unique blend of modern science and ancient wisdom.',
  },
  {
    year: '1992',
    title: 'International Recognition',
    description:
      'With GIA and IGI certifications in hand, the third generation took PureVedicGems to a global audience. Clients from the UK, USA, Canada, and Australia began trusting us for their Vedic gemstone needs. Our reputation for authenticity and expertise grew internationally.',
  },
  {
    year: '2010',
    title: 'Digital Transformation',
    description:
      'The fourth generation embraced technology — launching online consultations, digital gemstone certifications, and e-commerce. Today, PureVedicGems serves clients across 50+ countries while maintaining the personal touch that has defined us for nearly nine decades.',
  },
];

const VALUES = [
  {
    icon: '🔬',
    title: 'Authenticity First',
    description:
      'Every gemstone is independently certified by world-renowned labs — GIA, IGI, GJEPC. We never sell treated or synthetic gems without full disclosure.',
  },
  {
    icon: '🕉️',
    title: 'Vedic Integrity',
    description:
      'Our recommendations are rooted in authentic Jyotish Shastra. We combine ancient Vedic wisdom with modern gemological science for accurate planetary analysis.',
  },
  {
    icon: '🤝',
    title: 'Transparent Pricing',
    description:
      'No hidden charges, no inflated prices. Each gemstone is priced per carat with complete clarity on certification, making charges, and energization costs.',
  },
  {
    icon: '🌍',
    title: 'Ethical Sourcing',
    description:
      'We source directly from trusted mines and cutting houses across Sri Lanka, Myanmar, Colombia, Brazil, and Africa — ensuring conflict-free, responsibly mined gems.',
  },
  {
    icon: '📜',
    title: '15-Day Returns',
    description:
      'Complete peace of mind with our transparent 15-day return policy on loose gemstones. Your satisfaction and trust are our utmost priority.',
  },
  {
    icon: '✨',
    title: 'Vedic Energization',
    description:
      'Every gemstone can be energized through authentic Vedic puja ceremonies by our qualified pundits, following ancient rituals for maximum planetary benefit.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero with background image */}
      <section className="relative overflow-hidden py-24 md:py-28 lg:py-32">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&h=800&fit=crop&q=80"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <ScrollReveal>
            <span className="font-body text-xs font-semibold uppercase tracking-[5px]" style={{ color: 'var(--accent)' }}>
              Est. 1937 · New Delhi, India
            </span>
            <h1 className="mt-3 font-heading text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Our Heritage Story
            </h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" gem="◆ 🏛️ ◆" />
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              For nearly nine decades, PureVedicGems has been a trusted name in
              authentic Vedic gemstones. What began as a humble passion for
              planetary gemology in Old Delhi has grown into a globally
              recognised heritage brand — serving over 15,000 clients across
              50+ countries.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission statement */}
      <section className="bg-background py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal>
            <div className="rounded-sm border border-accent/20 bg-card p-8 text-center shadow-sm md:p-12">
              <span className="text-4xl">🕉️</span>
              <h2 className="mt-4 font-heading text-2xl font-bold text-primary md:text-3xl">
                Our Mission
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                To provide every individual with access to authentic, certified,
                and Vedically potent gemstones — paired with expert astrological
                guidance — so they may harness the cosmic energies of the planets
                for prosperity, health, and spiritual growth.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Visual storytelling — Workshop & Craftsmanship */}
      <section className="bg-secondary/10 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-xl" style={{ aspectRatio: '3/4' }}>
            <Image
              src="https://images.unsplash.com/photo-1624927637280-f033784c1279?w=500&h=667&fit=crop&q=80"
              alt="Expert gemstone examination"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 font-heading text-sm font-semibold text-white">
              Expert Gemstone Examination
            </p>
          </div>
          <div className="group relative overflow-hidden rounded-xl" style={{ aspectRatio: '3/4' }}>
            <Image
              src="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500&h=667&fit=crop&q=80"
              alt="Precision cutting and polishing"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 font-heading text-sm font-semibold text-white">
              Precision Cutting & Polishing
            </p>
          </div>
          <div className="group relative overflow-hidden rounded-xl" style={{ aspectRatio: '3/4' }}>
            <Image
              src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=667&fit=crop&q=80"
              alt="Certified gemstone collection"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 font-heading text-sm font-semibold text-white">
              Certified Gemstone Collection
            </p>
          </div>
        </div>
      </section>

      {/* Heritage Timeline */}
      <section className="bg-secondary/30 py-24 md:py-28 lg:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-[5px] text-accent">
              Four Generations
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-4xl">
              Our Journey Through Time
            </h2>
            <OrnamentalDivider className="mx-auto mt-2 max-w-sm" />
          </div>

          <div className="relative mt-16">
            {/* Vertical line */}
            <div className="absolute bottom-0 left-6 top-0 w-px bg-accent/20 md:left-1/2 md:-translate-x-px" />

            <div className="space-y-12">
              {TIMELINE.map((item, i) => (
                <ScrollReveal key={item.year} direction={i % 2 === 0 ? 'left' : 'right'}>
                  <div
                    className={`relative flex flex-col gap-4 pl-16 md:flex-row md:gap-8 md:pl-0 ${
                      i % 2 === 0 ? 'md:flex-row-reverse md:text-right' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-4 top-2 h-5 w-5 rounded-full border-2 border-accent bg-card shadow-sm md:left-1/2 md:-translate-x-1/2" />

                    {/* Year badge */}
                    <div className="flex shrink-0 items-start md:w-1/2 md:justify-center">
                      <span className="font-heading text-4xl font-bold text-accent md:text-5xl">
                        {item.year}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="md:w-1/2">
                      <h3 className="font-heading text-xl font-semibold text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="bg-background py-24 md:py-28 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-[5px] text-accent">
              What We Stand For
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-4xl">
              Our Core Values
            </h2>
            <OrnamentalDivider className="mx-auto mt-2 max-w-sm" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value) => (
              <ScrollReveal key={value.title}>
                <div className="group rounded-sm border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-md">
                  <span className="text-3xl">{value.icon}</span>
                  <h3 className="mt-4 font-heading text-base font-semibold text-primary">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Parallax Quote */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ height: '320px' }}>
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=1600&h=600&fit=crop&q=80"
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: 'center 40%' }}
          />
        </div>
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
          <p className="mb-4 text-3xl" style={{ color: 'var(--accent)' }}>◆</p>
          <blockquote className="font-heading text-xl font-medium italic leading-relaxed text-white md:text-2xl lg:text-3xl" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            &ldquo;Four generations of trust, one commitment — bringing the cosmic power of authentic gemstones to every doorstep.&rdquo;
          </blockquote>
          <p className="mt-4 text-3xl" style={{ color: 'var(--accent)' }}>◆</p>
        </div>
      </section>

      {/* Stats band */}
      <section
        className="py-16 md:py-20"
        style={{ backgroundColor: 'var(--pvg-dark-bg)' }}
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { number: '87+', label: 'Years of Heritage' },
              { number: '15,000+', label: 'Gems Delivered' },
              { number: '50+', label: 'Countries Served' },
              { number: '4', label: 'Generations' },
            ].map((stat) => (
              <div key={stat.label}>
                <span
                  className="block font-heading text-3xl font-bold md:text-4xl"
                  style={{ color: 'var(--pvg-accent)' }}
                >
                  {stat.number}
                </span>
                <span
                  className="mt-1 block text-xs uppercase tracking-wider"
                  style={{ color: 'var(--pvg-dark-text)' }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-background py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-primary md:text-3xl">
            Trusted Certifications
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Every gemstone from PureVedicGems is backed by internationally
            recognised laboratory certifications.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            {['GIA', 'IGI', 'GJEPC', 'IIGJ', 'GRS', 'Gübelin'].map((lab) => (
              <div
                key={lab}
                className="flex h-16 w-24 items-center justify-center rounded-sm border border-border bg-card text-sm font-semibold text-muted-foreground shadow-sm"
              >
                {lab}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
