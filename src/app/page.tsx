import { PvgHeroSection } from '@/components/home/PvgHeroSection';
import { PvgHomeInteractions } from '@/components/home/PvgHomeInteractions';
import { createClient } from '@/lib/supabase/server';
import {
  DirectorsPickSection,
  ExploreByCategorySection,
  getHomeManagedCategories,
  getHomeSectionCatalog,
  NavaratnaHomeSection,
  RudrakshaHomeSection,
  SemipreciousHomeSection,
} from '@/components/home/PvgManagedCategorySections';
import { PvgReferenceSections, type HomeTestimonial } from '@/components/home/PvgReferenceSections';
import { HomeVideosSection } from '@/components/home/HomeVideosSection';
import { WhyChooseUsSection } from '@/components/shared/WhyChooseUsSection';
import { getKhubCategoriesWithPosts } from '@/lib/sanity/queries';

export const revalidate = 300;

async function getHomeTestimonials(): Promise<HomeTestimonial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('testimonials')
    .select('id, name, location, rating, title, message, proof_image_url, proof_alt')
    .eq('status', 'approved')
    .eq('is_active', true)
    .eq('show_on_homepage', true)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })
    .limit(8);

  return (data ?? []) as HomeTestimonial[];
}

export default async function HomePage() {
  const [categories, sectionCatalog, testimonials, khubCategories] = await Promise.all([
    getHomeManagedCategories(),
    getHomeSectionCatalog(),
    getHomeTestimonials(),
    getKhubCategoriesWithPosts(3),
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
        testimonials={testimonials}
        knowledgeBlogCategories={khubCategories}
      />
      <HomeVideosSection />
      <WhyChooseUsSection />
      <PvgHomeInteractions />
    </div>
  );
}
