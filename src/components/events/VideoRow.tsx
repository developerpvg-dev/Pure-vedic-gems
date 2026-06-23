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
    <div className="group/row relative">
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-[#ede6d5] bg-white text-[#2c0404] opacity-0 shadow-md transition-opacity group-hover/row:opacity-100 hover:bg-[#fdf3e7]"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={rowRef}
        className="flex gap-5 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:thin]"
      >
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/events-and-seminars/${video.slug}`}
            className="w-72 flex-none overflow-hidden rounded-xl border border-[#ede6d5] bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(44,4,4,0.1)]"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <img
                src={`https://i.ytimg.com/vi/${video.youtube_id}/mqdefault.jpg`}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <svg className="h-5 w-5 translate-x-0.5 text-[#7a1515]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold leading-snug text-[#2c0404]">{video.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 z-10 flex h-9 w-9 translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-[#ede6d5] bg-white text-[#2c0404] opacity-0 shadow-md transition-opacity group-hover/row:opacity-100 hover:bg-[#fdf3e7]"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
