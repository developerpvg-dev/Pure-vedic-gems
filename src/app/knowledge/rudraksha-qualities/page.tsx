import type { Metadata } from 'next';
import { RudrakshaQualitiesContent } from '@/components/knowledge/RudrakshaQualitiesContent';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  GEO_BUY_KEYWORDS_BY_DEST,
  geoBuyInternalJsonLd,
  geoBuySourcesForDest,
} from '@/lib/constants/geo-buy-seo';
import { absoluteUrl } from '@/lib/utils/seo';

export const revalidate = 86400;

const PATH = '/knowledge/rudraksha-qualities';
const geoSources = geoBuySourcesForDest(PATH);
const cities = [...new Set(geoSources.map((s) => s.city))];

const title =
  'Buy Certified Natural Rudraksha Beads in Delhi NCR/India | Buy Astrological Rudrakshas Online | Lab Certified Rudraksha Delhi NCR, India: Purevedicgems';
const description =
  cities.length > 0
    ? `Oldest & most trusted genuine Rudraksha seller since 1937. Learn authenticity, quality grades, mukhi types, planets and mantras — for buyers in ${cities.join(', ')} and worldwide.`
    : 'Oldest & most trusted genuine Rudraksha seller in India. Learn how to identify authentic Rudraksha quality, compare genuine vs fake beads, mukhi types, ruling deities, planets, mantras and FAQs. Certified since 1937.';

export const metadata: Metadata = {
  title,
  description,
  keywords: GEO_BUY_KEYWORDS_BY_DEST[PATH],
  alternates: {
    canonical: absoluteUrl(PATH),
  },
  openGraph: {
    title: 'Rudraksha Qualities | PureVedicGems',
    description:
      'How to identify genuine Rudraksha — quality grades, fake bead awareness, mukhi reference table and FAQs.',
    type: 'article',
    url: absoluteUrl(PATH),
    locale: 'en_IN',
    alternateLocale: ['en_US', 'en_GB', 'en_AE'],
    images: [
      {
        url: absoluteUrl('/rudraksha-knowledge/rq-genuine.png'),
        width: 1200,
        height: 900,
        alt: 'Genuine Rudraksha',
      },
    ],
  },
};

export default function RudrakshaQualitiesPage() {
  return (
    <>
      <JsonLd data={geoBuyInternalJsonLd(PATH, absoluteUrl, title, description)} />
      <RudrakshaQualitiesContent />
    </>
  );
}
