import Link from 'next/link';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { LibraryVideo } from '@/lib/types/database';
import { VideoCard } from '@/components/videos/VideoCard';

export async function HomeVideosSection() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(4);

  const videos = (data ?? []) as LibraryVideo[];
  if (videos.length === 0) return null;

  return (
    <section className="bg-secondary/20 py-12 md:py-16" aria-labelledby="home-videos-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[4px] text-accent">
            <PlayCircle className="h-4 w-4" />
            Knowledge Hub
          </span>
          <h2 id="home-videos-heading" className="mt-3 font-heading text-2xl font-bold text-primary md:text-3xl">
            Vedic Gemstone &amp; Astrology Videos
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Free educational videos on jyotish remedies, gemstones, rudraksha and sacred energization rituals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Full Video Library
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
