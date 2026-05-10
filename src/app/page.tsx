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
      <div className="pvg-header-spacer" aria-hidden="true" />
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
