'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CategoryGemImage } from '@/components/home/CategoryGemImage';

const CARD_SEL = '.gem-card-new, .rudra-item-card, .explore-card, .semi-circ-card';

type LayeredCategoryImageProps = {
  mainUrl: string | null;
  hoverUrl: string | null;
  alt: string;
  fallbackBackground: string;
  className?: string;
  fallbackImageUrl?: string | null;
  /** `background` = CSS layers (Uparatnas semi-circ). Default = next/image. */
  variant?: 'image' | 'background';
};

/**
 * Loads the hover asset only after the first hover/focus on the parent card.
 * ponytail: ceiling = first hover waits one network round-trip; upgrade = CSS image-set preload on intent.
 */
export function LayeredCategoryImage({
  mainUrl,
  hoverUrl,
  alt,
  fallbackBackground,
  className = '',
  fallbackImageUrl = null,
  variant = 'image',
}: LayeredCategoryImageProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [loadHover, setLoadHover] = useState(false);

  useEffect(() => {
    if (!hoverUrl) return;
    const el = anchorRef.current;
    if (!el) return;
    const card = el.closest(CARD_SEL);
    if (!card) return;

    const arm = () => setLoadHover(true);
    card.addEventListener('mouseenter', arm, { once: true });
    card.addEventListener('focusin', arm, { once: true });
    return () => {
      card.removeEventListener('mouseenter', arm);
      card.removeEventListener('focusin', arm);
    };
  }, [hoverUrl]);

  if (variant === 'background') {
    return (
      <>
        <span ref={anchorRef} hidden aria-hidden />
        {mainUrl ? (
          <span className="semi-circ-layer pvg-main-bg" style={{ backgroundImage: `url('${mainUrl}')` }} />
        ) : null}
        {loadHover && hoverUrl ? (
          <span className="semi-circ-layer pvg-hover-bg" style={{ backgroundImage: `url('${hoverUrl}')` }} />
        ) : null}
      </>
    );
  }

  const mainClassName = ['pvg-main-img', hoverUrl ? 'has-hover-image' : '', className].filter(Boolean).join(' ');
  const hoverClassName = ['pvg-hover-img', className].filter(Boolean).join(' ');
  const localFallback = fallbackImageUrl ?? '';

  return (
    <>
      <span ref={anchorRef} hidden aria-hidden />
      {mainUrl ? (
        localFallback ? (
          <CategoryGemImage
            src={mainUrl}
            fallbackSrc={localFallback}
            alt={alt}
            width={400}
            height={400}
            className={mainClassName}
            loading="lazy"
            sizes="(max-width: 768px) 120px, 180px"
          />
        ) : (
          <Image
            src={mainUrl}
            alt={alt}
            width={400}
            height={400}
            className={mainClassName}
            loading="lazy"
            sizes="(max-width: 768px) 120px, 180px"
          />
        )
      ) : (
        <span className={mainClassName} role="img" aria-label={alt} style={{ background: fallbackBackground }} />
      )}
      {loadHover && hoverUrl ? (
        <Image
          src={hoverUrl}
          alt=""
          aria-hidden="true"
          width={400}
          height={400}
          className={hoverClassName}
          sizes="(max-width: 768px) 120px, 180px"
        />
      ) : null}
    </>
  );
}
