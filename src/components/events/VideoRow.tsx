'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventVideo } from '@/lib/types/database';

interface VideoRowProps {
  videos: EventVideo[];
}

export function VideoRow({ videos }: VideoRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 'left' | 'right') {
    if (!rowRef.current) return;
    const amount = 320;
    rowRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  return (
    <div className="relative group/row">
      {/* Left button */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 z-10 -translate-x-3 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background shadow-md opacity-0 transition-opacity group-hover/row:opacity-100 hover:bg-accent/10"
      >
        <ChevronLeft className="h-4 w-4 text-primary" />
      </button>

      {/* Scrollable row */}
      <div
        ref={rowRef}
        className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:thin] scroll-smooth"
      >
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/events-and-seminars/${video.slug}`}
            className="w-72 flex-none overflow-hidden rounded-sm border border-border bg-background transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <img
                src={`https://i.ytimg.com/vi/${video.youtube_id}/mqdefault.jpg`}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <svg className="h-5 w-5 translate-x-0.5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold leading-snug text-primary">{video.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Right button */}
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 z-10 translate-x-3 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background shadow-md opacity-0 transition-opacity group-hover/row:opacity-100 hover:bg-accent/10"
      >
        <ChevronRight className="h-4 w-4 text-primary" />
      </button>
    </div>
  );
}
