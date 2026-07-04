'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { HeroSlide } from '@/lib/hero-slides';

const SLIDE_INTERVAL_MS = 5200;
const TRANSITION_MS = 1650;

/** Navagraha-inspired accent colours for orbiting gem nodes */
const ORBIT_GEM_TONES = [
  '#d4a843',
  '#e8c56a',
  '#7a1515',
  '#46b4c8',
  '#c9a227',
  '#9b59b6',
  '#e07a5f',
] as const;

type PvgHeroSectionProps = {
  slides: HeroSlide[];
};

export function PvgHeroSection({ slides }: PvgHeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const [cosmosActive, setCosmosActive] = useState(false);
  const skipFirstTransition = useRef(true);
  const activeSlides = slides.length > 0 ? slides : [];

  useEffect(() => {
    if (activeSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % activeSlides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [activeSlides.length]);

  useEffect(() => {
    if (currentSlide >= activeSlides.length) {
      setCurrentSlide(0);
    }
  }, [activeSlides.length, currentSlide]);

  useEffect(() => {
    if (skipFirstTransition.current) {
      skipFirstTransition.current = false;
      return undefined;
    }

    setTransitionKey((key) => key + 1);
    setCosmosActive(true);
    const timer = window.setTimeout(() => setCosmosActive(false), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [currentSlide]);

  if (!activeSlides.length) {
    return null;
  }

  return (
    <section
      className={`hero pvg-hero-clean${transitionKey > 0 ? ' pvg-hero-has-transitioned' : ''}`}
      id="hero"
      aria-label="Hero slideshow"
      tabIndex={0}
      data-transition={transitionKey > 0 ? transitionKey : undefined}
      style={{ '--hero-slide-ms': `${SLIDE_INTERVAL_MS}ms` } as CSSProperties}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          setCurrentSlide((value) => (value - 1 + activeSlides.length) % activeSlides.length);
        }
        if (event.key === 'ArrowRight') {
          setCurrentSlide((value) => (value + 1) % activeSlides.length);
        }
      }}
    >
      {activeSlides.map((item, index) => (
        <div
          key={item.id}
          className={`hero-slide${index === currentSlide ? ' is-active' : ''}`}
          data-index={index}
        >
          <Image
            src={item.desktopImage}
            alt={item.alt}
            fill
            className="hero-slide-img pvg-hero-img-desktop"
            priority={index === 0}
            loading="eager"
            sizes="(max-width: 767px) 1px, 100vw"
          />
          <Image
            src={item.mobileImage}
            alt=""
            aria-hidden="true"
            fill
            className="hero-slide-img pvg-hero-img-mobile"
            priority={index === 0}
            loading="eager"
            sizes="(min-width: 768px) 1px, 100vw"
          />
        </div>
      ))}

      {activeSlides.length > 1 ? (
        <div
          key={transitionKey}
          className={`pvg-hero-cosmos${cosmosActive ? ' is-animating' : ''}`}
          aria-hidden="true"
        >
          <svg className="pvg-hero-orbit-svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <ellipse className="pvg-hero-orbit-path" cx="100" cy="100" rx="88" ry="34" />
            <ellipse className="pvg-hero-orbit-path pvg-hero-orbit-path--inner" cx="100" cy="100" rx="62" ry="48" />
          </svg>

          <div className="pvg-hero-orbit-spinner">
            {ORBIT_GEM_TONES.map((tone, index) => (
              <span
                key={tone}
                className="pvg-hero-gem-orb"
                style={
                  {
                    '--orb-tone': tone,
                    '--orb-i': index,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="pvg-hero-facet-gate" />
          <div className="pvg-hero-prism-sweep" />

          <div className="pvg-hero-stardust">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} className="pvg-hero-spark" style={{ '--spark-i': index } as CSSProperties} />
            ))}
          </div>
        </div>
      ) : null}

      {activeSlides.length > 1 ? (
        <div className="hero-controls" aria-label="Slide navigation">
          <div className="hero-dots" id="heroDots">
            {activeSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`hero-dot${index === currentSlide ? ' is-active' : ''}`}
                data-index={index}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {activeSlides.length > 1 ? (
        <div key={`progress-${currentSlide}`} className="hero-progress-bar running" id="heroProgressBar" aria-hidden="true" />
      ) : null}
    </section>
  );
}
