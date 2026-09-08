'use client';

import { useEffect, useState } from 'react';
import { toPublicAssetUrl } from '@/lib/site-static';

const PHOTOS = [
  {
    src: toPublicAssetUrl('/home/heri/heri0.jpeg'),
    alt: 'Three generations of the Pure Vedic Gems family behind the jewellery counter',
  },
  {
    src: toPublicAssetUrl('/home/heri/heri2b.jpeg'),
    alt: 'Pure Vedic Gems family continuing the jewellery heritage in the showroom',
  },
] as const;

const INTERVAL_MS = 4200;

export function HeritageLegacyMedia() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % PHOTOS.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="remedy-media">
      <div className="remedy-orbit heritage-orbit">
        {PHOTOS.map((photo, index) => {
          const isOn = index === active;
          return (
            <img
              key={photo.src}
              className={`heritage-slide${isOn ? ' is-on' : ''}`}
              src={photo.src}
              alt={isOn ? photo.alt : ''}
              width={1200}
              height={800}
              decoding="async"
              loading={index === 0 ? 'eager' : 'lazy'}
              aria-hidden={!isOn}
            />
          );
        })}
      </div>
    </div>
  );
}
