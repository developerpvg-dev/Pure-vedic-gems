'use client';

import Image, { type ImageProps } from 'next/image';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { toPublicAssetUrl } from '@/lib/site-static';

type CategoryGemImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src: string;
  alt: string;
  fallbackSrc?: string | null;
};

/** Client boundary for category/home gem images with optional local fallback. */
export function CategoryGemImage({ src, alt, fallbackSrc, ...props }: CategoryGemImageProps) {
  const resolved = toPublicAssetUrl(src);
  const fallback = fallbackSrc ? toPublicAssetUrl(fallbackSrc) : fallbackSrc;
  if (fallback) {
    return <ResilientImage src={resolved} fallbackSrc={fallback} alt={alt} {...props} />;
  }
  return <Image src={resolved} alt={alt} {...props} />;
}
