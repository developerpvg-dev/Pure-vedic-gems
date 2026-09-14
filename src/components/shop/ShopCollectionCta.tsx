'use client';

import { Phone, Sparkles } from 'lucide-react';
import { Rs101CtaLabel } from '@/components/consultation/Rs101CtaLabel';
import { IntegratedCategoryCta } from '@/components/home/PvgManagedCategorySections';

const CALL_HREF = 'tel:+919310172512';
const WHATSAPP_HREF = 'https://wa.me/919310172512';

/** Matches product-page AddToCartBar pills */
const pill =
  'pvg-cta-pill inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold tracking-[0.01em] transition duration-150 sm:w-auto sm:px-4 sm:text-[13px]';

type CtaVariant = 'navaratna' | 'rudraksha' | 'uparatna';

function resolveVariant(categorySlug?: string | null): CtaVariant {
  const slug = categorySlug?.toLowerCase() ?? '';
  if (slug.includes('rudraksha')) return 'rudraksha';
  if (slug.includes('upratna') || slug.includes('uparatna')) return 'uparatna';
  return 'navaratna';
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.139-1.633-.807-1.886-.9-.253-.093-.437-.139-.62.14-.183.278-.71.9-.87 1.085-.16.185-.32.208-.592.07-.272-.139-1.15-.424-2.19-1.352-.81-.722-1.357-1.613-1.516-1.886-.16-.272-.017-.42.122-.558.125-.124.278-.323.417-.484.139-.161.185-.278.278-.463.093-.185.047-.347-.023-.485-.07-.139-.62-1.494-.85-2.047-.223-.538-.45-.465-.62-.473l-.528-.01c-.185 0-.485.07-.737.347-.253.278-.967.945-.967 2.304 0 1.36.99 2.672 1.127 2.857.139.185 1.95 2.98 4.727 4.178.661.286 1.177.457 1.579.585.663.212 1.266.182 1.742.11.532-.08 1.633-.668 1.864-1.313.23-.645.23-1.198.16-1.313-.07-.114-.253-.185-.53-.324z" />
      <path d="M12.04 2C6.53 2 2.05 6.48 2.05 12c0 1.77.46 3.45 1.28 4.92L2 22l5.23-1.37A9.95 9.95 0 0 0 12.04 22C17.56 22 22 17.52 22 12S17.56 2 12.04 2zm0 18.15c-1.62 0-3.17-.44-4.5-1.22l-.32-.19-3.1.81.83-3.02-.21-.33a8.13 8.13 0 0 1-1.25-4.2c0-4.5 3.66-8.16 8.15-8.16 4.5 0 8.15 3.66 8.15 8.16 0 4.49-3.66 8.15-8.15 8.15z" />
    </svg>
  );
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
    recoBase: 'Remedies Recommendation',
  },
  rudraksha: {
    title: 'Not sure which Rudraksha is right for you?',
    copy: 'Share your birth details with our experts and get a clear mukhi recommendation before you buy. Free for international visitors.',
    image: '/home/ctas/cta2.webp?v=2',
    imageAlt: 'Rudraksha consultant guiding a buyer',
    imageSide: 'left',
    recoBase: 'Remedies Recommendation',
  },
  uparatna: {
    title: 'Need a practical gemstone alternative?',
    copy: 'Share your birth details with our experts and get a practical Uparatna recommendation. Free for international visitors.',
    image: '/home/ctas/cta3.webp?v=2',
    imageAlt: 'Vedic astrologer reviewing semi-precious gemstone alternatives',
    imageSide: 'right',
    recoBase: 'Remedies Recommendation',
  },
};

/** Home-style CTA after product listings — Call, WhatsApp, Remedies Recommendation (₹101 / free intl). */
export function ShopCollectionCta({ categorySlug }: { categorySlug?: string | null }) {
  const variant = resolveVariant(categorySlug);
  const config = CTA_BY_VARIANT[variant];

  return (
    <div className="pvg-react-home-root pvg-shop-cta-pills mt-10 mb-4 overflow-x-clip md:mt-14">
      <IntegratedCategoryCta
        variant={variant}
        title={config.title}
        copy={config.copy}
        image={config.image}
        imageAlt={config.imageAlt}
        imageSide={config.imageSide}
        buttons={[
          {
            label: (
              <>
                <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">Call</span>
              </>
            ),
            href: CALL_HREF,
            className: `${pill} pvg-cta-pill-call`,
          },
          {
            label: (
              <>
                <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </>
            ),
            href: WHATSAPP_HREF,
            className: `${pill} pvg-cta-pill-whatsapp`,
          },
          {
            label: (
              <>
                <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">
                  <Rs101CtaLabel base={config.recoBase} />
                </span>
              </>
            ),
            href: '/gems-recommendations',
            className: `${pill} pvg-cta-pill-remedies`,
          },
        ]}
      />
    </div>
  );
}
