/* eslint-disable @next/next/no-css-tags */

import { PvgHeroSection } from '@/components/home/PvgHeroSection';
import { PvgHomeInteractions } from '@/components/home/PvgHomeInteractions';
import {
  DirectorsPickSection,
  ExploreByCategorySection,
  getHomeManagedCategories,
  getHomeSectionCatalog,
  NavaratnaHomeSection,
  RudrakshaHomeSection,
  SemipreciousHomeSection,
} from '@/components/home/PvgManagedCategorySections';
import { PvgReferenceSections } from '@/components/home/PvgReferenceSections';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, sectionCatalog] = await Promise.all([
    getHomeManagedCategories(),
    getHomeSectionCatalog(),
  ]);

  return (
    <div className="pvg-react-home-root">
      <link rel="stylesheet" href="/home/home.css" />
      <style>{`
        html { overflow-x: clip !important; }
        body { overflow-x: clip !important; }
        .pvg-react-home-root a { text-decoration: none; }
        .pvg-react-home-root .gem-card-new { color: inherit; }
        .pvg-react-home-root .rudra-c-dot { border: 0; }
      `}</style>
      <div className="h-26 xl:h-27.5" aria-hidden="true" />
      <PvgHeroSection />
      <PvgReferenceSections
        navaratnaSection={<NavaratnaHomeSection categories={categories.navaratna} />}
        rudrakshaSection={<RudrakshaHomeSection categories={categories.rudraksha} featureCards={sectionCatalog.rudrakshaFeatures} />}
        semipreciousSection={<SemipreciousHomeSection categories={categories.upratna} />}
        exploreSection={<ExploreByCategorySection idols={sectionCatalog.exploreIdols} jewelry={sectionCatalog.exploreJewelry} />}
        directorsPickSection={<DirectorsPickSection products={sectionCatalog.directorPicks} />}
      />
      <PvgHomeInteractions />
    </div>
  );
}
