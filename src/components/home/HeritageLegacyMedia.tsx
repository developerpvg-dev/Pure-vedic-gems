'use client';

import { useEffect, useState } from 'react';

const PHOTOS = [
  {
    src: '/home/heri/heri0.jpeg',
    alt: 'Three generations of the Pure Vedic Gems family behind the jewellery counter',
  },
  {
    src: '/home/heri/heri1.jpeg',
    alt: 'Pure Vedic Gems family continuing the jewellery heritage in the showroom',
  },
] as const;

const INTERVAL_MS = 4200;

export function HeritageLegacyMedia() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    PHOTOS.forEach((photo) => {
      const img = new window.Image();
      img.src = photo.src;
    });

    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % PHOTOS.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="remedy-media">
      <div
        className="remedy-orbit heritage-orbit"
        role="img"
        aria-label={PHOTOS[active]?.alt ?? 'Heritage photographs'}
      >
        {PHOTOS.map((photo, index) => {
          const isOn = index === active;
          return (
            <div
              key={photo.src}
              className={`heritage-slide${isOn ? ' is-on' : ''}`}
              style={{
                backgroundImage: `url(${photo.src})`,
                opacity: isOn ? 1 : 0,
                zIndex: isOn ? 2 : 1,
              }}
              aria-hidden={!isOn}
            />
          );
        })}
      </div>
    </div>
  );
}
