'use client';

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

// Review text is baked into each image, so alt carries the full quote for screen readers and SEO.
const TESTIMONIALS = [
  {
    src: '/category-testimonials/testimonial-1.webp',
    alt: 'Client with Vikas Ji at the Pure Vedic Gems showroom. 5-star review: "Visiting Pure Vedic Gems was a very satisfying experience. The staff and Vikas Ji were warm, professional, and took the time to answer every question patiently. Their trusted certification, quality products, reasonable pricing, and long-standing legacy make them a very reliable choice."',
  },
  {
    src: '/category-testimonials/testimonial-2.webp',
    alt: 'Clients with Vikas Ji at the Pure Vedic Gems showroom. 5-star review: "I was impressed by the professionalism and genuine guidance I received during my visit. Vikas Ji and his team took the time to understand my requirements and explained everything very patiently. The certified gemstone, beautiful craftsmanship, and overall service were excellent."',
  },
  {
    src: '/category-testimonials/testimonial-3.webp',
    alt: 'Client with Vikas Ji at the Pure Vedic Gems showroom. 5-star review: "A memorable experience visiting Pure Vedic Gems and meeting Vikas Ji. The guidance felt genuine, detailed, and completely focused on helping me make the right choice. The gemstone quality, certification, and Pran Pratishtha were all handled with great care."',
  },
];

const N = TESTIMONIALS.length;

function slotFor(i: number, active: number) {
  const d = (i - active + N) % N;
  if (d === 0) return 'center';
  if (d === 1) return 'right';
  if (d === N - 1) return 'left';
  return 'hidden';
}

export function CategoryTestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const touchX = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [focused, setFocused] = useState(false);

  const go = (i: number) => setActive(((i % N) + N) % N);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // SSR markup stays visible; content only hides once JS can bring it back in.
    el.dataset.reveal = 'ready';
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = !!entry?.isIntersecting;
        if (visible) el.dataset.reveal = 'in';
        setInView(visible);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(active + 1);
    if (e.key === 'ArrowLeft') go(active - 1);
  };

  return (
    <section
      ref={sectionRef}
      id="category-testimonials"
      data-playing={inView && !focused}
      className="category-hub-testimonials scroll-mt-28"
      aria-labelledby="category-testimonials-heading"
      aria-roledescription="carousel"
      onKeyDown={onKeyDown}
      onFocus={(e) => e.target.matches(':focus-visible') && setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <span className="category-hub-testimonials__glyph" aria-hidden>
        &ldquo;
      </span>

      <header className="category-hub-testimonials__head">
        <h2 id="category-testimonials-heading" className="category-hub-testimonials__title">
          What Our Clients Say
        </h2>
        <p className="category-hub-testimonials__sub">
          <span className="category-hub-testimonials__stars" role="img" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} aria-hidden style={{ '--s': i } as CSSProperties} />
            ))}
          </span>
          Real showroom visits, in their own words
        </p>
      </header>

      <div
        className="category-hub-testimonials__stage"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          touchX.current = null;
          if (start == null || end == null || Math.abs(end - start) < 40) return;
          go(active + (end < start ? 1 : -1));
        }}
      >
        <span className="category-hub-testimonials__spotlight" aria-hidden />
        <ul className="category-hub-testimonials__track" aria-live={inView && !focused ? 'off' : 'polite'}>
          {TESTIMONIALS.map((t, i) => {
            const slot = slotFor(i, active);
            return (
              <li
                key={t.src}
                data-slot={slot}
                className="category-hub-testimonials__slide"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${N}`}
                aria-hidden={slot !== 'center'}
                onClick={() => slot !== 'center' && go(i)}
              >
                <div className="category-hub-testimonials__frame">
                  <Image
                    src={t.src}
                    alt={t.alt}
                    width={1024}
                    height={1024}
                    sizes="(max-width: 767px) 74vw, 384px"
                    draggable={false}
                    className="category-hub-testimonials__img"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="category-hub-testimonials__bar">
        <div className="category-hub-testimonials__controls">
          <button
            type="button"
            className="category-hub-testimonials__arrow"
            onClick={() => go(active - 1)}
            aria-label="Previous testimonial"
          >
            <ChevronLeft aria-hidden />
          </button>
          <div className="category-hub-testimonials__dots" role="group" aria-label="Choose testimonial">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={active === i}
                className="category-hub-testimonials__dot"
              >
                {/* Autoplay is driven by this fill finishing, so pausing the CSS animation pauses the carousel. */}
                {active === i ? (
                  <span
                    key={active}
                    className="category-hub-testimonials__fill"
                    onAnimationEnd={() => go(active + 1)}
                  />
                ) : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="category-hub-testimonials__arrow"
            onClick={() => go(active + 1)}
            aria-label="Next testimonial"
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
        <Link href="/testimonials" className="category-hub-collection__cta inline-flex">
          View All<span className="hidden sm:inline">Testimonials</span>
        </Link>
      </div>
    </section>
  );
}
