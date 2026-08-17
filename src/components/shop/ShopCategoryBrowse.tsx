import {
  ExploreByCategorySection,
  getShopBrowseCategories,
  NavaratnaHomeSection,
  SemipreciousHomeSection,
} from '@/components/home/PvgManagedCategorySections';
import { PvgHomeInteractions } from '@/components/home/PvgHomeInteractions';

/** Shop browse: homepage layouts, all subcategories, no CTAs. */
export async function ShopCategoryBrowse() {
  const { gems, idols, jewelry } = await getShopBrowseCategories();

  return (
    <div className="pvg-react-home-root pvg-shop-category-browse">
      <NavaratnaHomeSection categories={gems.navaratna} showCta={false} />
      <SemipreciousHomeSection categories={gems.upratna} showCta={false} />
      <ExploreByCategorySection idols={idols} jewelry={jewelry} showCta={false} />
      <PvgHomeInteractions />
    </div>
  );
}
