import Image from 'next/image';
import Link from 'next/link';

interface BannerItem {
  image: string;
  title: string;
  subtitle: string;
  href: string;
}

const BANNERS: BannerItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=800&h=500&fit=crop&q=80',
    title: 'Yellow Sapphire',
    subtitle: 'The Gem of Jupiter — Prosperity & Wisdom',
    href: '/shop/gemstones/yellow-sapphire',
  },
  {
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=500&fit=crop&q=80',
    title: 'Blue Sapphire',
    subtitle: 'Saturn\'s Stone — Power & Discipline',
    href: '/shop/gemstones/blue-sapphire',
  },
  {
    image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&h=500&fit=crop&q=80',
    title: 'Emerald',
    subtitle: 'Mercury\'s Gift — Intellect & Communication',
    href: '/shop/gemstones/emerald',
  },
];

export function CreativeBanner() {
  return (
    <section className="overflow-hidden bg-background px-6 py-16 md:px-10 lg:py-20">
      <div className="mx-auto max-w-[1200px]">
        {/* Section label */}
        <div className="mb-10 text-center">
          <p
            className="mb-3 font-semibold uppercase"
            style={{ fontSize: '12px', letterSpacing: '3px', color: 'var(--accent)' }}
          >
            Explore Our World
          </p>
          <h2
            className="font-heading text-primary"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}
          >
            Discover the Magic of Vedic Gems
          </h2>
        </div>

        {/* Creative asymmetric image grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:grid-rows-2">
          {/* Large feature image — spans 7 cols, 2 rows */}
          <Link
            href={BANNERS[0].href}
            className="group relative col-span-1 row-span-1 overflow-hidden rounded-2xl md:col-span-7 md:row-span-2"
            style={{ minHeight: '400px' }}
          >
            <Image
              src={BANNERS[0].image}
              alt={BANNERS[0].title}
              fill
              className="parallax-banner object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <span
                className="mb-2 inline-block rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[2px] text-white"
                style={{ background: 'var(--accent)' }}
              >
                Featured
              </span>
              <h3 className="font-heading text-3xl font-bold text-white md:text-4xl">
                {BANNERS[0].title}
              </h3>
              <p className="mt-2 text-sm text-white/70">{BANNERS[0].subtitle}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80 transition-colors group-hover:text-[var(--accent)]">
                Explore Collection →
              </span>
            </div>
          </Link>

          {/* Two stacked images — right side */}
          {BANNERS.slice(1).map((banner, i) => (
            <Link
              key={banner.title}
              href={banner.href}
              className="group relative col-span-1 overflow-hidden rounded-2xl md:col-span-5"
              style={{ minHeight: '190px' }}
            >
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="parallax-banner object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-heading text-xl font-bold text-white">
                  {banner.title}
                </h3>
                <p className="mt-1 text-xs text-white/60">{banner.subtitle}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 transition-colors group-hover:text-[var(--accent)]">
                  Shop Now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
