import { RudrakshaQualitiesContent } from '@/components/knowledge/RudrakshaQualitiesContent';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  GEO_BUY_KEYWORDS_BY_DEST,
  geoBuyInternalJsonLd,
  geoBuyShipCopy,
  geoBuyCityList,
} from '@/lib/constants/geo-buy-seo';
import { absoluteUrl, buildMetadata } from '@/lib/utils/seo';

export const revalidate = 86400;

const PATH = '/knowledge/rudraksha-qualities';
const cities = geoBuyCityList(PATH);
const shipNote = geoBuyShipCopy('Rudraksha', cities);

const title = 'Buy Certified Rudraksha Online | Quality Guide';
const description =
  cities.length > 0
    ? `Identify genuine Rudraksha — grades, mukhi types, and mantras. Certified beads ship to ${cities.join(', ')} and worldwide from PureVedicGems.`
    : 'Identify genuine Rudraksha quality, compare fake beads, mukhi types, planets and mantras. Certified since 1937.';

export const metadata = {
  ...buildMetadata({
    title,
    description,
    path: PATH,
    image: '/rudraksha-knowledge/rq-genuine.png',
    type: 'article',
  }),
  keywords: GEO_BUY_KEYWORDS_BY_DEST[PATH],
};

export default function RudrakshaQualitiesPage() {
  return (
    <>
      <JsonLd data={geoBuyInternalJsonLd(PATH, absoluteUrl, title, description)} />
      <RudrakshaQualitiesContent shipNote={shipNote} />
    </>
  );
}
