'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { designImageSrc } from '@/lib/utils/design-image';

interface DesignImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  title: string;
  subtitle?: string;
}

export function DesignImageLightbox({
  open,
  onOpenChange,
  imageUrl,
  title,
}: DesignImageLightboxProps) {
  const src = designImageSrc(imageUrl);
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!top-[7.25rem] !left-1/2 !z-[60] !max-h-[calc(100dvh-8.5rem)] !w-[min(88vw,460px)] !max-w-[min(88vw,460px)] !-translate-x-1/2 !translate-y-0 overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 sm:!max-w-[min(88vw,460px)] lg:!top-[8.5rem]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="relative w-full">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-1.5 top-1.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md ring-1 ring-black/10 transition hover:bg-white sm:h-9 sm:w-9"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>

          <img
            src={src}
            alt={title}
            className="mx-auto block h-auto w-full max-h-[min(46vh,360px)] object-contain object-center"
            decoding="async"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
