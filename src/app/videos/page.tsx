import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { LibraryVideo, VideoCategory } from '@/lib/types/database';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import { VideoCard } from '@/components/videos/VideoCard';
import { canonicalUrl } from '@/lib/utils/seo';

export const metadata: Metadata = {
  title: 'Vedic Gemstone & Astrology Video Library | Pure Vedic Gems',
  description:
    'Watch free educational videos on Vedic jyotish remedies, gemstones, rudraksha, karmic remedies, ratna shuddhikaran and pran pratishtha from the Pure Vedic Gems experts.',
  alternates: { canonical: canonicalUrl('/videos') },
};

export const revalidate = 300;

const CATEGORIES_PER_PAGE = 4;

type CategoryWithVideos = VideoCategory & { videos: LibraryVideo[] };

export default async function VideoLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10));

  const supabase = await createClient();
  const [categoriesResult, videosResult] = await Promise.all([
    supabase.from('video_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('videos').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ]);

  const videos = (videosResult.data ?? []) as LibraryVideo[];
  const allCategories = ((categoriesResult.data ?? []) as VideoCategory[])
    .map((category) => ({
      ...category,
      videos: videos.filter((video) => video.category_id === category.id),
    }))
    .filter((category) => category.videos.length > 0);

  const totalPages = Math.ceil(allCategories.length / CATEGORIES_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const categories = allCategories.slice(
    (safePage - 1) * CATEGORIES_PER_PAGE,
    safePage * CATEGORIES_PER_PAGE,
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Vedic Gemstone & Astrology Video Library',
    description:
      'Educational videos on Vedic jyotish remedies, gemstones, rudraksha and karmic remedies from Pure Vedic Gems.',
    url: canonicalUrl('/videos'),
    hasPart: videos.slice(0, 50).map((video) => ({
      '@type': 'VideoObject',
      name: video.title,
      thumbnailUrl: `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`,
      contentUrl: video.youtube_url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtube_id}`,
      uploadDate: video.published_at ?? video.created_at,
      url: canonicalUrl(`/videos/${encodeURIComponent(video.slug)}`),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-secondary/30 pt-14 pb-4 md:pt-18 md:pb-6">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <ScrollReveal>
            <span className="font-body text-xs font-semibold uppercase tracking-[5px] text-accent">
              Knowledge Hub
            </span>
            <h1 className="mt-10 font-heading text-3xl font-bold text-primary md:text-4xl lg:text-5xl">
              Video Library
            </h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" />
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Free educational videos on Vedic jyotish remedies, gemstones, rudraksha, karmic remedies and sacred energization rituals.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Videos */}
      <section className="bg-background pt-8 pb-16 md:pt-10 md:pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {allCategories.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No videos are published yet.</p>
          ) : (
            <>
              <div className="space-y-12">
                {categories.map((category: CategoryWithVideos) => (
                  <ScrollReveal key={category.id}>
                    <section>
                      <div className="mb-5 border-b border-border pb-4">
                        <h2 className="font-heading text-xl font-semibold text-primary md:text-2xl">{category.title}</h2>
                        {category.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {category.videos.map((video) => (
                          <VideoCard key={video.id} video={video} />
                        ))}
                      </div>
                    </section>
                  </ScrollReveal>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  {safePage > 1 && (
                    <Link
                      href={`?page=${safePage - 1}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-primary hover:bg-accent/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`?page=${p}`}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border text-sm font-medium transition-colors ${
                        p === safePage
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-border text-primary hover:bg-accent/10'
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                  {safePage < totalPages && (
                    <Link
                      href={`?page=${safePage + 1}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-primary hover:bg-accent/10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
