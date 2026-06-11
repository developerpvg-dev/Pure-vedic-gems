import { IntegratedCategoryCta } from '@/components/home/PvgManagedCategorySections';

/**
 * Rudraksha category CTA matching the home page — wrapped in `pvg-react-home-root`
 * so `home.css` / `homepage-fixes.css` styles (green + gold buttons, arch, portrait) apply.
 */
export function RudrakshaHomeCta({ className = '' }: { className?: string }) {
  return (
    <div className={`pvg-react-home-root ${className}`.trim()}>
      <IntegratedCategoryCta
        variant="rudraksha"
        title="Not sure which Rudraksha is right for you?"
        copy="Share your birth details or spiritual goal with our experts and get a clear, mukhi-led Rudraksha recommendation before you buy."
        primary={{ label: 'Get Rudraksha Guidance', href: '/consultation' }}
        secondary={{ label: 'See Rudraksha Collection', href: '/shop/rudraksha' }}
        image="/home/ctas/cta2.webp?v=2"
        imageAlt="Rudraksha expert offering personalised guidance"
        imageSide="left"
      />
    </div>
  );
}
