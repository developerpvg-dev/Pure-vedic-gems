'use client';

import { Rs101CtaLabel } from '@/components/consultation/Rs101CtaLabel';
import { IntegratedCategoryCta } from '@/components/home/PvgManagedCategorySections';

const CALL_HREF = 'tel:+919310172512';
const WHATSAPP_HREF = 'https://wa.me/919310172512';

type CtaVariant = 'navaratna' | 'rudraksha' | 'uparatna';

function resolveVariant(categorySlug?: string | null): CtaVariant {
  const slug = categorySlug?.toLowerCase() ?? '';
  if (slug.includes('rudraksha')) return 'rudraksha';
  if (slug.includes('upratna') || slug.includes('uparatna')) return 'uparatna';
  return 'navaratna';
}

const CTA_BY_VARIANT: Record<
  CtaVariant,
  { title: string; copy: string; image: string; imageAlt: string; imageSide: 'left' | 'right'; recoBase: string }
> = {
  navaratna: {
    title: 'Not sure which gemstone is good for you?',
    copy: 'Share your birth details with our experts and get a clear, horoscope-led gemstone recommendation before you buy. Free for international visitors.',
    image: '/home/ctas/cta1.webp?v=20260810',
    imageAlt: 'Vedic gemstone consultants preparing a horoscope recommendation',
    imageSide: 'right',
    recoBase: 'Book Recommendation',
  },
  rudraksha: {
    title: 'Not sure which Rudraksha is right for you?',
    copy: 'Share your birth details with our experts and get a clear mukhi recommendation before you buy. Free for international visitors.',
    image: '/home/ctas/cta2.webp?v=2',
    imageAlt: 'Rudraksha consultant guiding a buyer',
    imageSide: 'left',
    recoBase: 'Book Recommendation',
  },
  uparatna: {
    title: 'Need a practical gemstone alternative?',
    copy: 'Share your birth details with our experts and get a practical Uparatna recommendation. Free for international visitors.',
    image: '/home/ctas/cta3.webp?v=2',
    imageAlt: 'Vedic astrologer reviewing semi-precious gemstone alternatives',
    imageSide: 'right',
    recoBase: 'Book Recommendation',
  },
};

/** Home-style CTA after product listings — Call, WhatsApp, Book Recommendation (₹101 / free intl). */
export function ShopCollectionCta({ categorySlug }: { categorySlug?: string | null }) {
  const variant = resolveVariant(categorySlug);
  const config = CTA_BY_VARIANT[variant];

  return (
    <div className="pvg-react-home-root mt-10 mb-4 overflow-x-clip md:mt-14">
      <IntegratedCategoryCta
        variant={variant}
        title={config.title}
        copy={config.copy}
        image={config.image}
        imageAlt={config.imageAlt}
        imageSide={config.imageSide}
        buttons={[
          { label: 'Call', href: CALL_HREF, tone: 'call' },
          { label: 'WhatsApp', href: WHATSAPP_HREF, tone: 'whatsapp' },
          {
            label: <Rs101CtaLabel base={config.recoBase} />,
            href: '/gems-recommendations',
            tone: 'chat',
          },
        ]}
      />
    </div>
  );
}
