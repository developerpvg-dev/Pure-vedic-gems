import Image from 'next/image';

const CERT_ITEMS = [
  { name: 'GJEPC', logo: '/labslogo/GJEPC.jpg' },
  { name: 'GIA', logo: '/labslogo/GIA.jpg' },
  { name: 'GÜBELIN', logo: '/labslogo/GUBELIN.jpg' },
  { name: 'GII', logo: '/labslogo/GII.jpg' },
  { name: 'GRS', logo: '/labslogo/GRS.jpg' },
  { name: 'IIGJ', logo: '/labslogo/IIGJ.jpg' },
  { name: 'IGI', logo: '/labslogo/IGI.jpg' },
  { name: 'SSEF', logo: '/labslogo/SSEF.jpg' },
  { name: 'GFCO', logo: '/labslogo/GFCO.jpg' },
  { name: 'HRD ANTWERP', logo: '/labslogo/HRD ANTWERP.jpg' },
];

export function CertMarquee() {
  const items = [...CERT_ITEMS, ...CERT_ITEMS];

  return (
    <div className="overflow-hidden border-y border-[var(--pvg-border)] bg-[var(--pvg-surface)] py-3">
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
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
