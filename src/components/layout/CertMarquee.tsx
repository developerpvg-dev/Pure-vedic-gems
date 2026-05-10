import Image from 'next/image';

const CERT_ITEMS = [
  { name: 'GJEPC', logo: '/labslogo/GJEPC.webp' },
  { name: 'GIA', logo: '/labslogo/GIA.webp' },
  { name: 'GÜBELIN', logo: '/labslogo/GUBELIN.webp' },
  { name: 'GII', logo: '/labslogo/GII.webp' },
  { name: 'GRS', logo: '/labslogo/GRS.webp' },
  { name: 'IIGJ', logo: '/labslogo/IIGJ.webp' },
  { name: 'IGI', logo: '/labslogo/IGI.webp' },
  { name: 'SSEF', logo: '/labslogo/SSEF.webp' },
  { name: 'GFCO', logo: '/labslogo/GFCO.webp' },
  { name: 'HRD ANTWERP', logo: '/labslogo/HRD ANTWERP.webp' },
];

export function CertMarquee() {
  const items = [...CERT_ITEMS, ...CERT_ITEMS];

  return (
    <div className="overflow-hidden border-y border-[var(--pvg-border)] bg-brand-surface py-3">
      <div className="animate-marquee flex w-max items-center gap-12 hover:[animation-play-state:paused] md:gap-16">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center"
          >
            <div className="relative h-8 w-auto shrink-0 md:h-9">
              <Image
                src={item.logo}
                alt={`${item.name} certification`}
                width={80}
                height={36}
                className="h-full object-contain"
                style={{ width: 'auto' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
