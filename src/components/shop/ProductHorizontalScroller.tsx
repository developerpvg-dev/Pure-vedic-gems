'use client';

import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Horizontal strip with left/right scroll buttons. */
export function ProductHorizontalScroller({
  children,
  className = '',
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const step = Math.min(280, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5E0D8] bg-white/95 text-[#7A1515] shadow-md transition hover:bg-[#F7F5F1] sm:h-9 sm:w-9"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5E0D8] bg-white/95 text-[#7A1515] shadow-md transition hover:bg-[#F7F5F1] sm:h-9 sm:w-9"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2} />
      </button>

      <div
        ref={ref}
        role="list"
        aria-label={ariaLabel}
        className={`flex gap-2.5 overflow-x-auto scroll-smooth px-9 pb-1 sm:gap-4 sm:px-11 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
}
