'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const SLIDES: Array<{
  desktopImage: string;
  mobileImage: string;
  alt: string;
}> = [
  {
    desktopImage: '/home/hero/pvgheropc1.png',
    mobileImage: '/home/hero/pvgherobg1.png',
    alt: 'Find Your Lucky Gem - Pure Vedic Gems',
  },
  {
    desktopImage: '/home/hero/pvgheropc2.png',
    mobileImage: '/home/hero/pvgherobg2.png',
    alt: 'Create Your Perfect Gemstone Jewellery - Pure Vedic Gems',
  },
  {
    desktopImage: '/home/hero/pvgheropc3.png',
    mobileImage: '/home/hero/pvgherobg3.png',
    alt: 'Swift Results & Blessed Life - Pure Vedic Gems',
  },
];

const SLIDE_INTERVAL_MS = 4500;

export function PvgHeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section
      className="hero pvg-hero-clean"
      id="hero"
      aria-label="Hero slideshow"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          setCurrentSlide((value) => (value - 1 + SLIDES.length) % SLIDES.length);
        }
        if (event.key === 'ArrowRight') {
          setCurrentSlide((value) => (value + 1) % SLIDES.length);
        }
      }}
    >
      {/* Slide images */}
      {SLIDES.map((item, index) => (
        <div key={item.desktopImage} className={`hero-slide${index === currentSlide ? ' is-active' : ''}`} data-index={index}>
          {/* Desktop image (≥768px) — hidden on mobile via CSS */}
          <Image
            src={item.desktopImage}
            alt={item.alt}
            fill
            className="hero-slide-img pvg-hero-img-desktop"
            priority={index === 0}
            loading={index === 0 ? undefined : 'lazy'}
            sizes="(max-width: 767px) 1px, 100vw"
          />
          {/* Mobile/tablet image (<768px) — hidden on desktop via CSS */}
          <Image
            src={item.mobileImage}
            alt=""
            aria-hidden="true"
            fill
            className="hero-slide-img pvg-hero-img-mobile"
            priority={index === 0}
            loading={index === 0 ? undefined : 'lazy'}
            sizes="(min-width: 768px) 1px, 100vw"
          />
        </div>
      ))}

      {/* Dot nav */}
      <div className="hero-controls" aria-label="Slide navigation">
        <div className="hero-dots" id="heroDots">
          {SLIDES.map((item, index) => (
            <button
              key={item.desktopImage}
              type="button"
              className={`hero-dot${index === currentSlide ? ' is-active' : ''}`}
              data-index={index}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      <div key={`progress-${currentSlide}`} className="hero-progress-bar running" id="heroProgressBar" aria-hidden="true" />
    </section>
  );
}