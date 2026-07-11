'use client';

import Image, { type ImageProps } from 'next/image';
import { ResilientImage } from '@/components/ui/ResilientImage';

type CategoryGemImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src: string;
  alt: string;
  fallbackSrc?: string | null;
};

/** Client boundary for category/home gem images with optional local fallback. */
export function CategoryGemImage({ src, alt, fallbackSrc, ...props }: CategoryGemImageProps) {
  if (fallbackSrc) {
    return <ResilientImage src={src} fallbackSrc={fallbackSrc} alt={alt} {...props} />;
  }
  return <Image src={src} alt={alt} {...props} />;
}
