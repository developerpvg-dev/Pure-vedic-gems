import type { Metadata } from 'next';
import { ConsultationBookingForm } from '@/components/consultation/ConsultationBookingForm';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  CONSULTATION_GEO_KEYWORDS,
  CONSULTATION_GEO_META,
  CONSULTATION_PATH,
  consultationGeoInternalJsonLd,
} from '@/lib/constants/consultation-geo-seo';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import type { ConsultationPlan } from '@/lib/types/database';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, serviceJsonLd } from '@/lib/utils/seo';

const baseMeta = buildMetadata({
  title: CONSULTATION_GEO_META.title,
  description: CONSULTATION_GEO_META.description,
  path: CONSULTATION_PATH,
});

export const metadata: Metadata = {
  ...baseMeta,
  keywords: CONSULTATION_GEO_KEYWORDS,
  openGraph: {
    ...baseMeta.openGraph,
    locale: 'en_IN',
    alternateLocale: ['en_US', 'en_GB', 'en_AE', 'en_MY', 'en_CA', 'en_AU'],
  },
};

// ponytail: plans are public; ISR so cookies() no longer force SSR every visit
export const revalidate = 1800;

export default async function ConsultationPage() {
  const supabase = createOptionalPublicClient();
  const { data, error } = supabase
    ? await supabase
        .from('consultation_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
    : { data: null, error: null };

  if (error) {
    console.error('[Consultation] Failed to load plans:', error);
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', href: '/' },
            { name: 'Consultation', href: CONSULTATION_PATH },
          ]),
          {
            ...serviceJsonLd({
              name: 'Online Vedic Astrology Consultation',
              description: CONSULTATION_GEO_META.description,
              path: CONSULTATION_PATH,
            }),
            areaServed: [
              'India',
              'United Arab Emirates',
              'United Kingdom',
              'United States',
              'Malaysia',
              'Worldwide',
            ],
            availableChannel: {
              '@type': 'ServiceChannel',
              serviceType: 'Online consultation',
              availableLanguage: ['English', 'Hindi'],
            },
          },
          ...consultationGeoInternalJsonLd(absoluteUrl),
        ]}
      />
      <ConsultationBookingForm plans={(data ?? []) as ConsultationPlan[]} />
    </>
  );
}
