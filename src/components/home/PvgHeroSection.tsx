'use client';

import './pvg-hero-carousel.css';

import Image from 'next/image';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import type { HeroSlide } from '@/lib/hero-slides';

const SLIDE_INTERVAL_MS = 4000;
const TRANSITION_MS = 1600;

function HeroNavButton({
  direction,
  label,
  onClick,
}: {
  direction: 'prev' | 'next';
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`pvg-hero-carousel__nav pvg-hero-carousel__nav--${direction}`}
      aria-label={label}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={direction === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}

type PvgHeroSectionProps = {
  slides: HeroSlide[];
};

export function PvgHeroSection({ slides }: PvgHeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const [veilKey, setVeilKey] = useState(0);
  const activeSlides = slides.length > 0 ? slides : [];

  const goToSlide = useCallback(
    (nextIndex: number) => {
      setCurrentIndex((prev) => {
        if (nextIndex === prev || activeSlides.length <= 1) return prev;
        setLeavingIndex(prev);
        setVeilKey((key) => key + 1);
        return nextIndex;
      });
    },
    [activeSlides.length],
  );

  useEffect(() => {
    if (leavingIndex === null) return undefined;
    const timer = window.setTimeout(() => setLeavingIndex(null), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [leavingIndex, currentIndex]);

  const goToPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length, currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide((currentIndex + 1) % activeSlides.length);
  }, [activeSlides.length, currentIndex, goToSlide]);

  useEffect(() => {
    if (activeSlides.length <= 1) return undefined;
    const timer = window.setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % activeSlides.length;
        setLeavingIndex(prev);
        setVeilKey((key) => key + 1);
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [activeSlides.length, currentIndex]);

  useEffect(() => {
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  if (!activeSlides.length) {
    return null;
  }

  const isTransitioning = leavingIndex !== null;
  const visibleIndices = new Set<number>([currentIndex]);
  if (isTransitioning) visibleIndices.add(leavingIndex);

  return (
    <section
      className="hero pvg-hero-clean pvg-hero-carousel"
      id="hero"
      aria-labelledby="home-hero-heading"
      tabIndex={0}
      style={{ '--hero-slide-ms': `${SLIDE_INTERVAL_MS}ms` } as CSSProperties}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goToPrev();
        if (event.key === 'ArrowRight') goToNext();
      }}
    >
      <h1 id="home-hero-heading" className="sr-only">
        Buy Certified Vedic Gemstones Online in India
      </h1>
      {activeSlides.map((item, index) => {
        if (!visibleIndices.has(index)) return null;

        const isCurrent = index === currentIndex;
        const isLeaving = index === leavingIndex;
        const isIncoming = isCurrent && isTransitioning;

        const slideClass = [
          'pvg-hero-carousel__slide',
          isIncoming ? 'pvg-hero-carousel__slide--incoming pvg-hero-carousel__slide--current' : '',
          isLeaving ? 'pvg-hero-carousel__slide--outgoing' : '',
          isCurrent && !isIncoming ? 'pvg-hero-carousel__slide--current' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const images = (
          <>
            <Image
              src={item.desktopImage}
              alt={item.alt}
              fill
              className="pvg-hero-carousel__img pvg-hero-img-desktop"
              priority={index === 0}
              loading="eager"
              sizes="(max-width: 767px) 100vw, 100vw"
            />
            <Image
              src={item.mobileImage}
              alt=""
              aria-hidden="true"
              fill
              className="pvg-hero-carousel__img pvg-hero-img-mobile"
              priority={index === 0}
              loading="eager"
              sizes="(max-width: 767px) 100vw, 1px"
            />
          </>
        );

        return (
          <div key={item.id} className={slideClass} data-index={index}>
            {item.linkUrl ? (
              <a
                href={item.linkUrl}
                className="pvg-hero-carousel__media"
                aria-label={item.alt}
                {...(item.linkUrl.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {images}
              </a>
            ) : (
              <div className="pvg-hero-carousel__media">{images}</div>
            )}
          </div>
        );
      })}

      {isTransitioning ? (
        <div key={veilKey} className="pvg-hero-carousel__veil" aria-hidden />
      ) : null}

      {activeSlides.length > 1 ? (
        <>
          <HeroNavButton direction="prev" label="Previous hero slide" onClick={goToPrev} />
          <HeroNavButton direction="next" label="Next hero slide" onClick={goToNext} />
        </>
      ) : null}

      {activeSlides.length > 1 ? (
        <div className="hero-controls" aria-label="Slide navigation">
          <div className="hero-dots" id="heroDots">
            {activeSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`hero-dot${index === currentIndex ? ' is-active' : ''}`}
                data-index={index}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {activeSlides.length > 1 ? (
        <div key={`progress-${currentIndex}`} className="hero-progress-bar running" id="heroProgressBar" aria-hidden="true" />
      ) : null}
    </section>
  );
}
