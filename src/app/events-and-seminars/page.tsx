import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { EventVideo, EventVideoCategory } from '@/lib/types/database';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import { VideoRow } from '@/components/events/VideoRow';

export const metadata: Metadata = {
  title: 'Events and Seminars | Pure Vedic Gems Videos',
  description: 'Watch Pure Vedic Gems event, seminar, yagya, pooja, and spiritual ceremony videos grouped by event category.',
};

export const revalidate = 300;

const CATEGORIES_PER_PAGE = 5;

type CategoryWithVideos = EventVideoCategory & { videos: EventVideo[] };

export default async function EventsAndSeminarsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10));

  const supabase = await createClient();
  const [categoriesResult, videosResult] = await Promise.all([
    supabase.from('event_video_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('event_videos').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ]);

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
    <>
      {/* Hero */}
      <section className="bg-secondary/30 pt-14 pb-4 md:pt-18 md:pb-6">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <ScrollReveal>
            <span className="font-body text-xs font-semibold uppercase tracking-[5px] text-accent">
              Sacred Ceremonies
            </span>
            <h1 className="mt-10 font-heading text-3xl font-bold text-primary md:text-4xl lg:text-5xl">
              Events &amp; Seminars
            </h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" />
          </ScrollReveal>
        </div>
      </section>

      {/* Videos */}
      <section className="bg-background pt-8 pb-16 md:pt-10 md:pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {allCategories.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No event videos are published yet.</p>
          ) : (
            <>
              <div className="space-y-12">
                {categories.map((category: CategoryWithVideos) => (
                  <ScrollReveal key={category.id}>
                    <section className="rounded-sm border border-border bg-card p-4 shadow-sm md:p-6">
                      <div className="mb-5 border-b border-border pb-5">
                        <h2 className="font-heading text-xl font-semibold text-primary md:text-2xl">{category.title}</h2>
                      </div>

                      <VideoRow videos={category.videos} />
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
