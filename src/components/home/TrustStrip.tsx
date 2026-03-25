import Image from 'next/image';

const TRUST_ITEMS = [
  { icon: '🏛', title: 'Since 1937', sub: '87+ Years Legacy' },
  { icon: '🔬', title: 'Lab Certified', sub: 'GIA · IGI · GJEPC' },
  { icon: '🔱', title: 'Vedic Energized', sub: 'Authentic Puja & Mantra' },
  { icon: '🚚', title: 'Insured Delivery', sub: 'Worldwide Shipping' },
];

export function TrustStrip() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 border-b border-border bg-card px-6 py-6 sm:flex-row sm:gap-12"
    >
      {TRUST_ITEMS.map((item) => (
        <div key={item.title} className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ background: 'rgba(92,61,46,0.06)', color: 'var(--primary)' }}
          >
            {item.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">{item.title}</p>
            <p className="text-[11px] text-muted-foreground">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
