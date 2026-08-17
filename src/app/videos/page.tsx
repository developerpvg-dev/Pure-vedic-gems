import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import type { LibraryVideo, VideoCategory } from '@/lib/types/database';
import { VideoCard } from '@/components/videos/VideoCard';
import { buildMetadata, canonicalUrl } from '@/lib/utils/seo';
import './videos-page.css';

export const metadata: Metadata = buildMetadata({
  title: 'Vedic Gemstone & Astrology Video Library | PureVedicGems',
  description:
    'Watch free educational videos on Vedic jyotish remedies, gemstones, rudraksha, karmic remedies, ratna shuddhikaran and pran pratishtha from the Pure Vedic Gems experts.',
  path: '/videos',
});

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

const CATEGORIES_PER_PAGE = 4;

type CategoryWithVideos = VideoCategory & { videos: LibraryVideo[] };

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-16 flex items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link
          href={`?page=${currentPage - 1}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8bd75] text-[#6b3b23] transition-colors hover:bg-[#b86654] hover:text-white"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        if (totalPages > 7) {
          if (pageNumber !== 1 && pageNumber !== totalPages && Math.abs(pageNumber - currentPage) > 2) {
            if (pageNumber === 2 || pageNumber === totalPages - 1) {
              return (
                <span key={pageNumber} className="px-1 text-[#6b3b23]">
                  ...
                </span>
              );
            }
            return null;
          }
        }
        return (
          <Link
            key={pageNumber}
            href={`?page=${pageNumber}`}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              pageNumber === currentPage
                ? 'bg-[#a37c44] text-white'
                : 'border border-[#e0d6c8] text-[#a37c44] hover:bg-[#f0eadd]'
            }`}
          >
            {pageNumber}
          </Link>
        );
      })}
      {currentPage < totalPages ? (
        <Link
          href={`?page=${currentPage + 1}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8bd75] text-[#6b3b23] transition-colors hover:bg-[#b86654] hover:text-white"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function VideoLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10));

  // ponytail: public client so cookies() don't force this route dynamic
  const supabase = createOptionalPublicClient();
  const [categoriesResult, videosResult] = supabase
    ? await Promise.all([
        supabase.from('video_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('videos').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ])
    : [{ data: null }, { data: null }];

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
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="px-4 pb-8 pt-10 sm:px-6 lg:pt-14" aria-labelledby="videos-page-heading">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="videos-page-heading">
              Video Library
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Free educational videos on Vedic jyotish remedies, gemstones, rudraksha, karmic remedies and sacred energization rituals.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-label="Video categories">
        {allCategories.length === 0 ? (
          <p className="pvg-videos-empty">No videos are published yet.</p>
        ) : (
          <>
            <div className="space-y-12">
              {categories.map((category: CategoryWithVideos) => (
                <section key={category.id}>
                  <div className="pvg-videos-category-head">
                    <h2 className="pvg-videos-category-title">{category.title}</h2>
                    {category.description ? (
                      <p className="pvg-videos-category-desc">{category.description}</p>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {category.videos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <Pagination currentPage={safePage} totalPages={totalPages} />
          </>
        )}
      </section>
    </main>
  );
}
