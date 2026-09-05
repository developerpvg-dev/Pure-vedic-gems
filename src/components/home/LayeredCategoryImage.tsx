'use client';

import Image from 'next/image';
import { CategoryGemImage } from '@/components/home/CategoryGemImage';
import { toPublicAssetUrl } from '@/lib/site-static';

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

/** Both layers in DOM from mount so hover swap is instant (no first-hover fetch). */
export function LayeredCategoryImage({
  mainUrl,
  hoverUrl,
  alt,
  fallbackBackground,
  className = '',
  fallbackImageUrl = null,
  variant = 'image',
}: LayeredCategoryImageProps) {
  if (variant === 'background') {
    return (
      <>
        {mainUrl ? (
          <span className="semi-circ-layer pvg-main-bg" style={{ backgroundImage: `url('${toPublicAssetUrl(mainUrl)}')` }} />
        ) : null}
        {hoverUrl ? (
          <span className="semi-circ-layer pvg-hover-bg" style={{ backgroundImage: `url('${toPublicAssetUrl(hoverUrl)}')` }} />
        ) : null}
      </>
    );
  }

  const mainClassName = ['pvg-main-img', hoverUrl ? 'has-hover-image' : '', className].filter(Boolean).join(' ');
  const hoverClassName = ['pvg-hover-img', className].filter(Boolean).join(' ');
  const localFallback = fallbackImageUrl ?? '';

  return (
    <>
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
            src={toPublicAssetUrl(mainUrl)}
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
      {hoverUrl ? (
        <Image
          src={toPublicAssetUrl(hoverUrl)}
          alt=""
          aria-hidden="true"
          width={400}
          height={400}
          className={hoverClassName}
          loading="lazy"
          sizes="(max-width: 768px) 120px, 180px"
        />
      ) : null}
    </>
  );
}
