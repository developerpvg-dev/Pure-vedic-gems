import Image from 'next/image';

const CERT_ITEMS = [
  { name: 'GIA', logo: '/GIA-PVG.webp' },
  { name: 'IGI', logo: '/IGI-PVG.webp' },
  { name: 'IIGJ', logo: '/IIGJ.jpg' },
  { name: 'GRS', logo: '/GRS-PVG.webp' },
  { name: 'Gübelin', logo: '/CUBELIN LAB-PVG.webp' },
  { name: 'GII', logo: '/GII-PVG.webp' },
];

export function CertMarquee() {
  const items = [...CERT_ITEMS, ...CERT_ITEMS];

  return (
    <div className="overflow-hidden border-y border-[var(--pvg-border)] bg-[var(--pvg-surface)] py-3">
      <div className="animate-marquee flex w-max items-center gap-12 hover:[animation-play-state:paused] md:gap-16">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-3 whitespace-nowrap text-[11px] font-bold uppercase tracking-[2.5px] text-[var(--pvg-muted)] md:text-xs"
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--pvg-border)] md:h-9 md:w-9">
              <Image
                src={item.logo}
                alt={`${item.name} certification`}
                fill
                className="object-cover"
              />
            </div>
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
