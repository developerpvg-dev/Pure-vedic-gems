/* eslint-disable @next/next/no-img-element */

'use client';

import { useEffect, useState } from 'react';

const SLIDES: Array<{
  image: string;
  alt: string;
}> = [
  {
    image: '/home/hero/pvgherobg1.png',
    alt: 'Find Your Lucky Gem - Pure Vedic Gems',
  },
  {
    image: '/home/hero/pvgherobg2.png',
    alt: 'Create Your Perfect Gemstone Jewellery - Pure Vedic Gems',
  },
  {
    image: '/home/hero/pvgherobg3.png',
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
      <style>{`
        .pvg-hero-clean {
          background: #F6EFE3 !important;
          height: clamp(300px, 41vw, 620px) !important;
          min-height: 220px !important;
          max-height: 650px !important;
        }
        .pvg-hero-clean::after { display: none !important; }
        .pvg-hero-clean .hero-slide-img {
          object-fit: contain !important;
          object-position: center center !important;
          transform: none !important;
        }
        .pvg-hero-clean .hero-slide.is-active .hero-slide-img {
          transform: none !important;
        }
        .pvg-hero-clean .hero-yantra { display: none !important; }
        @media (max-width: 640px) {
          .pvg-hero-clean {
            height: clamp(210px, 60vw, 360px) !important;
          }
        }
      `}</style>

      {/* Slide images */}
      {SLIDES.map((item, index) => (
        <div key={item.image} className={`hero-slide${index === currentSlide ? ' is-active' : ''}`} data-index={index}>
          <img
            src={item.image}
            alt={item.alt}
            className="hero-slide-img"
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : undefined}
          />
        </div>
      ))}

      {/* Dot nav */}
      <div className="hero-controls" aria-label="Slide navigation">
        <div className="hero-dots" id="heroDots">
          {SLIDES.map((item, index) => (
            <button
              key={item.image}
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