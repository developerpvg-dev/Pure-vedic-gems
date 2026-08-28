import { HeroPreloadLinks } from '@/components/home/HeroPreloadLinks';
import { PvgHeroSection } from '@/components/home/PvgHeroSection';
import { PvgHomeInteractions } from '@/components/home/PvgHomeInteractions';
import { getActiveHeroSlides } from '@/lib/hero-slides';
import { createOptionalPublicClient } from '@/lib/supabase/public';
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
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOME_PAGE_DESCRIPTION, HOME_PAGE_KEYWORDS, HOME_PAGE_TITLE, homePageJsonLd } from '@/lib/seo/home-page';
import { getRs101PaidFromHeaders } from '@/lib/consultation/rs101-eligibility.server';
import { buildMetadata } from '@/lib/utils/seo';

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

export const metadata: Metadata = buildMetadata({
  title: HOME_PAGE_TITLE,
  description: HOME_PAGE_DESCRIPTION,
  path: '/',
  keywords: HOME_PAGE_KEYWORDS,
});

async function getHomeTestimonials(): Promise<HomeTestimonial[]> {
  // ponytail: public client so homepage ISR isn't defeated by cookies()
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];

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
  const [heroSlides, categories, sectionCatalog, testimonials, khubCategories, rs101Paid] = await Promise.all([
    getActiveHeroSlides(),
    getHomeManagedCategories(),
    getHomeSectionCatalog(),
    getHomeTestimonials(),
    getKhubCategoriesWithPosts(3),
    getRs101PaidFromHeaders(),
  ]);

  return (
    <>
      <JsonLd data={homePageJsonLd()} />
      <HeroPreloadLinks slides={heroSlides} />
      <div className="pvg-react-home-root">
        <PvgHeroSection slides={heroSlides} />
        <PvgReferenceSections
          rs101Paid={rs101Paid}
          navaratnaSection={<NavaratnaHomeSection categories={categories.navaratna} rs101Paid={rs101Paid} />}
          rudrakshaSection={<RudrakshaHomeSection categories={categories.rudraksha} featureCards={sectionCatalog.rudrakshaFeatures} rs101Paid={rs101Paid} />}
          semipreciousSection={<SemipreciousHomeSection categories={categories.upratna} rs101Paid={rs101Paid} />}
          exploreSection={<ExploreByCategorySection idols={sectionCatalog.exploreIdols} jewelry={sectionCatalog.exploreJewelry} />}
          directorsPickSection={<DirectorsPickSection products={sectionCatalog.directorPicks} />}
          testimonials={testimonials}
          knowledgeBlogCategories={khubCategories}
        />
        <HomeVideosSection />
        <WhyChooseUsSection />
        <PvgHomeInteractions />
      </div>
    </>
  );
}
