import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ThumbsUp, Share2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { EventVideo, EventVideoCategory } from '@/lib/types/database';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { VideoRow } from '@/components/events/VideoRow';

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: video } = await supabase
    .from('event_videos')
    .select('title, description')
    .eq('slug', slug)
    .single();

  if (!video) return { title: 'Video Not Found' };

  return {
    title: `${video.title} | Events & Seminars | Pure Vedic Gems`,
    description: video.description ?? `Watch ${video.title} from the Pure Vedic Gems events archive.`,
  };
}

export default async function VideoDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: videoData } = await supabase
    .from('event_videos')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!videoData) notFound();

  const video = videoData as EventVideo;

  // Fetch category and related videos
  const [{ data: categoryData }, { data: relatedData }] = await Promise.all([
    supabase
      .from('event_video_categories')
      .select('*')
      .eq('id', video.category_id)
      .single(),
    supabase
      .from('event_videos')
      .select('*')
      .eq('category_id', video.category_id)
      .eq('is_active', true)
      .neq('slug', slug)
      .order('sort_order', { ascending: true }),
  ]);

  const category = categoryData as EventVideoCategory | null;
  const related = (relatedData ?? []) as EventVideo[];

  const youtubePageUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;

  return (
    <>
      {/* Back nav */}
      <section className="bg-secondary/30 py-6">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            href="/events-and-seminars"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Events &amp; Seminars
          </Link>
          {category && (
            <span className="ml-2 text-sm text-muted-foreground">/ {category.title}</span>
          )}
        </div>
      </section>

      {/* Video player */}
      <section className="bg-background py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal>
            <h1 className="mb-6 font-heading text-2xl font-bold text-primary md:text-3xl lg:text-4xl">
              {video.title}
            </h1>

            {/* Embed */}
            <div className="overflow-hidden rounded-sm border border-border shadow-md">
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?rel=0`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Actions – opens YouTube for like / share / comment */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={youtubePageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/10"
              >
                <ThumbsUp className="h-4 w-4" />
                Like on YouTube
              </a>
              <a
                href={youtubePageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/10"
              >
                <MessageCircle className="h-4 w-4" />
                Comment on YouTube
              </a>
              <a
                href={youtubePageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/10"
              >
                <Share2 className="h-4 w-4" />
                Share
              </a>
            </div>

            {video.description && (
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{video.description}</p>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Related videos */}
      {related.length > 0 && (
        <section className="bg-secondary/20 py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-6">
            <ScrollReveal>
              <h2 className="mb-6 font-heading text-xl font-semibold text-primary md:text-2xl">
                More from {category?.title ?? 'this category'}
              </h2>
              <VideoRow videos={related} />
            </ScrollReveal>
          </div>
        </section>
      )}
    </>
  );
}
