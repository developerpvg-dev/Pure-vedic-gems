import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import type { LibraryVideo } from '@/lib/types/database';
import { VideoCard } from '@/components/videos/VideoCard';
import { SliderButton } from '@/components/home/PvgManagedCategorySections';

export async function HomeVideosSection() {
  // ponytail: public client so homepage ISR isn't defeated by cookies()
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(4);

  const videos = (data ?? []) as LibraryVideo[];
  if (videos.length === 0) return null;

  return (
    <section className="navratna-section" id="home-videos" aria-labelledby="home-videos-heading">
      <div className="container">
        <div className="section-head">
          <h2 className="section-title" id="home-videos-heading">
            Vedic Gemstone &amp; Astrology Videos
          </h2>
          <p className="navratna-subtitle">
            Free educational videos on jyotish remedies, gemstones, rudraksha and sacred energization rituals.
          </p>
          <div className="section-rule-center" />
        </div>

        <div className="pvg-slider-shell pvg-videos-slider-shell">
          <SliderButton target="homeVideosScroll" direction="prev" label="Previous videos" />
          <div className="home-videos-scroll" id="homeVideosScroll">
            <div className="home-videos-track">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
          <SliderButton target="homeVideosScroll" direction="next" label="Next videos" />
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/videos" className="btn-maroon inline-flex items-center gap-2">
            View Full Video Library
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
