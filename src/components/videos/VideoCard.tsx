import Link from 'next/link';
import type { LibraryVideo } from '@/lib/types/database';

interface VideoCardProps {
  video: LibraryVideo;
}

function videoPath(slug: string) {
  return `/videos/${encodeURIComponent(slug)}`;
}

export function VideoCard({ video }: VideoCardProps) {
  const href = videoPath(video.slug);

  return (
    <Link
      href={href}
      className="group relative z-0 flex flex-col overflow-hidden rounded-sm border border-border bg-background transition-shadow hover:z-10 hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${video.youtube_id}/mqdefault.jpg`}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <svg className="h-5 w-5 translate-x-0.5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-primary">{video.title}</h3>
      </div>
    </Link>
  );
}
