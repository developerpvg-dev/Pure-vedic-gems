import { createOptionalPublicClient } from '@/lib/supabase/public';

/**
 * Hero slide image specs (see admin hero_slides or public/home/hero fallbacks):
 *
 * Desktop (desktop_image_url): 1024×346 px — wide strip, ratio ~2.96:1
 *   Export @2x: 2048×692 px for retina.
 *
 * Mobile (mobile_image_url): 828×621 px — phone banner, ratio 4:3 (full image visible)
 *   Export @2x: 1656×1242 px. Compose within the full frame; no edge cropping needed.
 */
export type HeroSlide = {
  id: string;
  slug: string;
  desktopImage: string;
  mobileImage: string;
  alt: string;
  /** Optional click-through: `/shop/...` or absolute https URL. */
  linkUrl: string | null;
  sortOrder: number;
};

export const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'fallback-1',
    slug: 'hero-slide-1',
    desktopImage: '/home/hero/pvgheropc1.webp',
    mobileImage: '/home/hero/pvgherobg1.webp',
    alt: 'Find Your Lucky Gem - Pure Vedic Gems',
    linkUrl: null,
    sortOrder: 10,
  },
  {
    id: 'fallback-2',
    slug: 'hero-slide-2',
    desktopImage: '/home/hero/pvgheropc2.webp',
    mobileImage: '/home/hero/pvgherobg2.webp',
    alt: 'Create Your Perfect Gemstone Jewellery - Pure Vedic Gems',
    linkUrl: null,
    sortOrder: 20,
  },
  {
    id: 'fallback-3',
    slug: 'hero-slide-3',
    desktopImage: '/home/hero/pvgheropc3.webp',
    mobileImage: '/home/hero/pvgherobg3.webp',
    alt: 'Swift Results & Blessed Life - Pure Vedic Gems',
    linkUrl: null,
    sortOrder: 30,
  },
];

type HeroSlideRow = {
  id: string;
  slug: string;
  desktop_image_url: string;
  mobile_image_url: string;
  alt_text: string;
  link_url: string | null;
  sort_order: number;
};

function mapRow(row: HeroSlideRow): HeroSlide {
  return {
    id: row.id,
    slug: row.slug,
    desktopImage: row.desktop_image_url,
    mobileImage: row.mobile_image_url,
    alt: row.alt_text,
    linkUrl: row.link_url?.trim() || null,
    sortOrder: row.sort_order,
  };
}

export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  try {
    // ponytail: public client so homepage ISR isn't defeated by cookies()
    const supabase = createOptionalPublicClient();
    if (!supabase) return FALLBACK_HERO_SLIDES;

    const { data, error } = await supabase
      .from('hero_slides')
      .select('id, slug, desktop_image_url, mobile_image_url, alt_text, link_url, sort_order')
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
