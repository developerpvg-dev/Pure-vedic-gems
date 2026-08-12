import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ThumbsUp, Share2, MessageCircle } from 'lucide-react';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import type { LibraryVideo, VideoCategory } from '@/lib/types/database';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { VideoCard } from '@/components/videos/VideoCard';
import { canonicalUrl } from '@/lib/utils/seo';

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

type Props = { params: Promise<{ slug: string }> };

async function loadVideo(rawSlug: string) {
  // ponytail: public client so cookies() don't force this route dynamic
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;
  const slug = decodeURIComponent(rawSlug);
  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return (data ?? null) as LibraryVideo | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await loadVideo(slug);
  if (!video) return { title: 'Video Not Found' };

  const description =
    video.seo_description ?? video.description ?? `Watch ${video.title} from the Pure Vedic Gems video library.`;
  const canonical = canonicalUrl(`/videos/${encodeURIComponent(video.slug)}`);

  return {
    title: video.seo_title ?? `${video.title} | Pure Vedic Gems`,
    description,
    alternates: { canonical },
    openGraph: {
      title: video.title,
      description,
      type: 'video.other',
      url: canonical,
      images: [{ url: `https://i.ytimg.com/vi/${video.youtube_id}/maxresdefault.jpg` }],
    },
    twitter: {
      card: 'player',
      title: video.title,
      description,
      images: [`https://i.ytimg.com/vi/${video.youtube_id}/maxresdefault.jpg`],
    },
  };
}

export default async function VideoDetailPage({ params }: Props) {
  const { slug } = await params;
  const video = await loadVideo(slug);
  if (!video) notFound();

  const supabase = createOptionalPublicClient();
  if (!supabase) notFound();

  const [{ data: categoryData }, { data: relatedData }] = await Promise.all([
    video.category_id
      ? supabase.from('video_categories').select('*').eq('id', video.category_id).single()
      : Promise.resolve({ data: null }),
    video.category_id
      ? supabase
          .from('videos')
          .select('*')
          .eq('category_id', video.category_id)
          .eq('is_active', true)
          .neq('id', video.id)
          .order('sort_order', { ascending: true })
          .limit(8)
      : Promise.resolve({ data: [] }),
  ]);

  const category = categoryData as VideoCategory | null;
  const related = (relatedData ?? []) as LibraryVideo[];
  const youtubePageUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
  const canonical = canonicalUrl(`/videos/${encodeURIComponent(video.slug)}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.seo_description ?? video.description ?? video.title,
    thumbnailUrl: [
      `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${video.youtube_id}/maxresdefault.jpg`,
    ],
    uploadDate: video.published_at ?? video.created_at,
    contentUrl: youtubePageUrl,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtube_id}`,
    url: canonical,
    publisher: {
      '@type': 'Organization',
      name: 'Pure Vedic Gems',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Back nav */}
      <section className="bg-secondary/30 py-6">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Video Library
          </Link>
          {category && <span className="ml-2 text-sm text-muted-foreground">/ {category.title}</span>}
        </div>
      </section>

      {/* Video player */}
      <section className="bg-background py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal>
            <h1 className="mb-6 font-heading text-2xl font-bold text-primary md:text-3xl lg:text-4xl">
              {video.title}
            </h1>

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

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href={youtubePageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/10">
                <ThumbsUp className="h-4 w-4" /> Like on YouTube
              </a>
              <a href={youtubePageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/10">
                <MessageCircle className="h-4 w-4" /> Comment on YouTube
              </a>
              <a href={youtubePageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/10">
                <Share2 className="h-4 w-4" /> Share
              </a>
            </div>

            {video.description && (
              <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{video.description}</p>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Related videos */}
      {related.length > 0 && (
        <section className="bg-secondary/20 py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-6 font-heading text-xl font-semibold text-primary md:text-2xl">
              More from {category?.title ?? 'this category'}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {related.map((item) => (
                <VideoCard key={item.id} video={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
