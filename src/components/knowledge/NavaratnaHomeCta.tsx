import { IntegratedCategoryCta } from '@/components/home/PvgManagedCategorySections';

/** Home-page Navaratna CTA — wrapped so `home.css` styles apply on knowledge pages. */
export function NavaratnaHomeCta({ className = '' }: { className?: string }) {
  return (
    <div className={`pvg-react-home-root ${className}`.trim()}>
      <IntegratedCategoryCta
        variant="navaratna"
        title="Not sure which gemstone is good for you?"
        copy="Share your birth details with our experts and get a clear, horoscope-led gemstone recommendation before you buy."
        primary={{ label: 'Get Gem Recommendation', href: '/consultation' }}
        secondary={{ label: 'See Navaratna Collection', href: '/shop/navaratna' }}
        image="/home/ctas/cta1.webp?v=4"
        imageAlt="Vedic gemstone consultants preparing a horoscope recommendation"
        imageSide="right"
      />
    </div>
  );
}
