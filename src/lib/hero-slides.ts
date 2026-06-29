import { createClient } from '@/lib/supabase/server';

export type HeroSlide = {
  id: string;
  slug: string;
  desktopImage: string;
  mobileImage: string;
  alt: string;
  sortOrder: number;
};

export const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'fallback-1',
    slug: 'hero-slide-1',
    desktopImage: '/home/hero/pvgheropc1.webp',
    mobileImage: '/home/hero/pvgherobg1.webp',
    alt: 'Find Your Lucky Gem - Pure Vedic Gems',
    sortOrder: 10,
  },
  {
    id: 'fallback-2',
    slug: 'hero-slide-2',
    desktopImage: '/home/hero/pvgheropc2.webp',
    mobileImage: '/home/hero/pvgherobg2.webp',
    alt: 'Create Your Perfect Gemstone Jewellery - Pure Vedic Gems',
    sortOrder: 20,
  },
  {
    id: 'fallback-3',
    slug: 'hero-slide-3',
    desktopImage: '/home/hero/pvgheropc3.webp',
    mobileImage: '/home/hero/pvgherobg3.webp',
    alt: 'Swift Results & Blessed Life - Pure Vedic Gems',
    sortOrder: 30,
  },
];

type HeroSlideRow = {
  id: string;
  slug: string;
  desktop_image_url: string;
  mobile_image_url: string;
  alt_text: string;
  sort_order: number;
};

function mapRow(row: HeroSlideRow): HeroSlide {
  return {
    id: row.id,
    slug: row.slug,
    desktopImage: row.desktop_image_url,
    mobileImage: row.mobile_image_url,
    alt: row.alt_text,
    sortOrder: row.sort_order,
  };
}

export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('hero_slides')
      .select('id, slug, desktop_image_url, mobile_image_url, alt_text, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data?.length) {
      return FALLBACK_HERO_SLIDES;
    }

    return (data as HeroSlideRow[]).map(mapRow);
  } catch {
    return FALLBACK_HERO_SLIDES;
  }
}
