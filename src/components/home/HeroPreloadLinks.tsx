import type { HeroSlide } from '@/lib/hero-slides';

export function HeroPreloadLinks({ slides }: { slides: HeroSlide[] }) {
  const first = slides[0];
  if (!first) return null;

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={first.desktopImage}
        media="(min-width: 768px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={first.mobileImage}
        media="(max-width: 767px)"
        fetchPriority="high"
      />
    </>
  );
}
