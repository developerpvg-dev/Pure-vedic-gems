'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Ensure at least one fallback image
  const imgs =
    images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1551122089-4e3e72477432?w=800&h=1200&fit=crop&q=90'];

  const prevImg = () => setActiveIdx((i) => (i === 0 ? imgs.length - 1 : i - 1));
  const nextImg = () => setActiveIdx((i) => (i === imgs.length - 1 ? 0 : i + 1));

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── Main image — full width on all screen sizes ── */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)]">
          {/* Responsive aspect ratio: 4:3 (landscape) on mobile/tablet;
              3:2 (wider landscape) on desktop for horizontal gem display */}
          <div className="relative aspect-[4/3] w-full lg:aspect-[3/2]">
            <Image
              src={imgs[activeIdx]}
              alt={`${productName} — image ${activeIdx + 1}`}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(min-width: 1024px) 100vw, 100vw"
              priority
            />
          </div>

          {/* Zoom button */}
          <button
            onClick={() => setZoomOpen(true)}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--pvg-primary)] shadow-md backdrop-blur-sm transition hover:bg-[var(--pvg-accent)] hover:text-white"
            aria-label="View full size image"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Prev / Next nav (shown if multiple images) */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--pvg-primary)] shadow-md backdrop-blur-sm transition hover:bg-[var(--pvg-accent)] hover:text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--pvg-primary)] shadow-md backdrop-blur-sm transition hover:bg-[var(--pvg-accent)] hover:text-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === activeIdx ? '24px' : '6px',
                      background: i === activeIdx ? 'var(--pvg-accent)' : 'rgba(255,255,255,0.6)',
                    }}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Thumbnails (below main image on all screens) ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imgs.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 hover:opacity-100 lg:h-[80px] lg:w-[80px]"
              style={{
                borderColor:
                  i === activeIdx ? 'var(--pvg-accent)' : 'var(--pvg-border)',
                opacity: i === activeIdx ? 1 : 0.6,
              }}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Zoom / Lightbox dialog ── */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-3xl border-0 bg-black/95 p-2">
          <div className="relative h-[80vh] w-full">
            <Image
              src={imgs[activeIdx]}
              alt={productName}
              fill
              className="object-contain"
              sizes="(min-width: 768px) 80vw, 100vw"
              quality={95}
            />
          </div>
          {imgs.length > 1 && (
            <div className="flex justify-center gap-2 pb-2">
              <button
                onClick={prevImg}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/25"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="flex items-center text-sm text-white/60">
                {activeIdx + 1} / {imgs.length}
              </span>
              <button
                onClick={nextImg}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/25"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
