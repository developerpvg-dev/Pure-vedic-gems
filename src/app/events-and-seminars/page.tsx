import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import type { EventVideo, EventVideoCategory } from '@/lib/types/database';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { VideoRow } from '@/components/events/VideoRow';
import { buildMetadata } from '@/lib/utils/seo';
import './events-page.css';

export const metadata: Metadata = buildMetadata({
  title: 'Events & Seminars | PureVedicGems',
  description: 'Watch Pure Vedic Gems event, seminar, yagya, pooja, and spiritual ceremony videos grouped by event category.',
  path: '/events-and-seminars',
});

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

const CATEGORIES_PER_PAGE = 5;

type CategoryWithVideos = EventVideoCategory & { videos: EventVideo[] };

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

export default async function EventsAndSeminarsPage({
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
        supabase.from('event_video_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('event_videos').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ])
    : [{ data: null }, { data: null }];

  const videos = (videosResult.data ?? []) as EventVideo[];
  const allCategories = ((categoriesResult.data ?? []) as EventVideoCategory[])
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

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-8 pt-10 sm:px-6 lg:pt-14" aria-labelledby="events-page-heading">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="events-page-heading">
              Events &amp; Seminars
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Watch ceremonies, seminars, yagyas, and spiritual gatherings from Pure Vedic Gems.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-label="Event video categories">
        {allCategories.length === 0 ? (
          <p className="pvg-events-empty">No event videos are published yet.</p>
        ) : (
          <>
            <div className="space-y-10">
              {categories.map((category: CategoryWithVideos) => (
                <ScrollReveal key={category.id}>
                  <section className="pvg-events-category-card p-4 md:p-6">
                    <div className="pvg-events-category-head">
                      <h2 className="pvg-events-category-title">{category.title}</h2>
                    </div>
                    <VideoRow videos={category.videos} />
                  </section>
                </ScrollReveal>
              ))}
            </div>

            <Pagination currentPage={safePage} totalPages={totalPages} />
          </>
        )}
      </section>
    </main>
  );
}
