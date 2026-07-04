'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

type ResilientImageProps = Omit<ImageProps, 'src'> & {
  src: string;
  fallbackSrc: string;
};

export function ResilientImage({ src, fallbackSrc, alt, ...props }: ResilientImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  return (
    <Image
      {...props}
      alt={alt}
      src={currentSrc || fallbackSrc}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}
