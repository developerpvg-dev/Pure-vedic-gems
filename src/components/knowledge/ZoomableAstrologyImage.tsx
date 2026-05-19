'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ZoomableAstrologyImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
};

export function ZoomableAstrologyImage({
  src,
  alt,
  width,
  height,
  caption,
  priority = false,
  sizes,
  className,
  imageClassName,
}: ZoomableAstrologyImageProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <>
      <div className={cn('rounded-sm border border-border bg-card p-3 shadow-sm', className)}>
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          className="group relative block w-full cursor-zoom-in overflow-hidden rounded-sm text-left"
          aria-label={`Zoom image: ${alt}`}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={cn('h-auto w-full rounded-sm transition-transform duration-300 group-hover:scale-[1.01]', imageClassName)}
            sizes={sizes ?? '(min-width: 1280px) 420px, 100vw'}
            priority={priority}
          />
          <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition group-hover:bg-accent group-hover:text-accent-foreground">
            <ZoomIn className="h-4 w-4" />
          </span>
        </button>

        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">{caption}</p>
      </div>

      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-6xl border-0 bg-black/95 p-2 sm:max-w-6xl">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative h-[85vh] w-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              quality={95}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}