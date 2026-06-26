'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { catalogFamilyToStorefrontGroupSlug, storefrontSubcategoryHref } from '@/lib/categories/storefront';
import { RUDRAKSHA_FEATURE_IMAGES } from '@/lib/constants/rudraksha-category-images';
import type { HomeCatalogCategory } from '@/components/home/PvgManagedCategorySections';

const AUTO_ADVANCE_MS = 4200;
const MOBILE_AUTO_ADVANCE_MS = 4500;

function catalogCategoryHref(category: HomeCatalogCategory) {
  const parentSlug = catalogFamilyToStorefrontGroupSlug(category.family) ?? 'jewelry';
  const legacySinglePath = `/shop/${category.slug}`;
  if (category.slug === parentSlug || (parentSlug === 'malas' && category.slug === 'mala')) return `/shop/${parentSlug}`;
  if (category.canonical_path && category.canonical_path !== legacySinglePath) return category.canonical_path;
  return storefrontSubcategoryHref(parentSlug, category.slug);
}

function rudrakshaFeatureImage(card: HomeCatalogCategory) {
  if (card.image_url) return card.image_url;
  if (card.slug.includes('mukhi') || card.slug.includes('collection')) {
    return RUDRAKSHA_FEATURE_IMAGES.collection;
  }
  if (card.slug.includes('mala')) return RUDRAKSHA_FEATURE_IMAGES.malas;
  if (card.slug.includes('jewelry') || card.slug.includes('jeweller')) {
    return RUDRAKSHA_FEATURE_IMAGES.jewellery;
  }
  return RUDRAKSHA_FEATURE_IMAGES.jewellery;
}

type RudrakshaFeatureCarouselProps = {
  cards: HomeCatalogCategory[];
};

export function RudrakshaFeatureCarousel({ cards }: RudrakshaFeatureCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  const cardCount = cards.length;
  const hasMultipleCards = cardCount > 1;

  const goTo = useCallback(
    (index: number) => {
      if (!cardCount) return;
      setActiveIndex(((index % cardCount) + cardCount) % cardCount);
    },
    [cardCount]
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleAdvance = useCallback(() => {
    clearTimer();
    if (!hasMultipleCards || !isVisibleRef.current || document.hidden) return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const interval = isMobile ? MOBILE_AUTO_ADVANCE_MS : AUTO_ADVANCE_MS;

    timerRef.current = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % cardCount);
      scheduleAdvance();
    }, interval);
  }, [cardCount, clearTimer, hasMultipleCards]);

  useEffect(() => {
    if (!hasMultipleCards) return undefined;

    const root = carouselRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = Boolean(entry?.isIntersecting);
        scheduleAdvance();
      },
      { rootMargin: '180px 0px' }
    );

    const onVisibilityChange = () => scheduleAdvance();

    observer.observe(root);
    document.addEventListener('visibilitychange', onVisibilityChange);
    scheduleAdvance();

    return () => {
      clearTimer();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [cardCount, clearTimer, hasMultipleCards, scheduleAdvance]);

  useEffect(() => {
    if (activeIndex >= cardCount) {
      setActiveIndex(0);
    }
  }, [activeIndex, cardCount]);

  if (!cardCount) return null;

  return (
    <>
      <div className="rudra-left-carousel" id="rudraCarousel" ref={carouselRef}>
        {cards.map((card, index) => {
          const featureImage = rudrakshaFeatureImage(card);
          const isActive = index === activeIndex;

          return (
            <Link
              key={card.slug}
              href={catalogCategoryHref(card)}
              className={`rudra-left-card${isActive ? ' is-active' : ''}`}
              data-rudra-card={index}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              <div className="rudra-left-img">
                <Image
                  fill
                  src={featureImage}
                  alt={card.name}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="(max-width: 768px) 100vw, 500px"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </div>
              <div className="rudra-left-footer">
                <div className="rudra-left-title">{card.name}</div>
                <span className="rudra-left-show">{card.cta_label ?? 'Shop Now'}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {hasMultipleCards ? (
        <div className="rudra-carousel-dots" id="rudraCarouselDots">
          {cards.map((card, index) => (
            <button
              key={card.slug}
              type="button"
              className={`rudra-c-dot${index === activeIndex ? ' is-active' : ''}`}
              data-dot={index}
              aria-label={`Show ${card.name}`}
              aria-pressed={index === activeIndex}
              onClick={() => {
                goTo(index);
                scheduleAdvance();
              }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
