'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Play, Maximize2 } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  videoUrl?: string | null;
}

function toEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function ytThumb(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return yt ? `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` : null;
}

export function ProductGallery({ images, productName, videoUrl }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Zoom-modal state ──
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  // Ensure at least one fallback image
  const imgs =
    images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1551122089-4e3e72477432?w=800&h=1200&fit=crop&q=90'];

  const embedUrl = videoUrl ? toEmbed(videoUrl) : null;
  const isDirectVideo = videoUrl && !embedUrl;
  const videoThumb = videoUrl ? (ytThumb(videoUrl) ?? imgs[0]) : null;
  const totalSlides = imgs.length + (videoUrl ? 1 : 0);
  const videoIdx = videoUrl ? imgs.length : -1;
  const isVideoActive = activeIdx === videoIdx;

  const prevImg = () => setActiveIdx((i) => (i === 0 ? totalSlides - 1 : i - 1));
  const nextImg = () => setActiveIdx((i) => (i === totalSlides - 1 ? 0 : i + 1));

  // Reset zoom+pan whenever the lightbox opens or image changes
  const openZoom = useCallback(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
    setZoomOpen(true);
  }, []);

  const closeZoom = useCallback(() => setZoomOpen(false), []);

  const resetZoom = useCallback(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Clamp pan so image never drifts completely off screen
  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const el = imgWrapRef.current;
    if (!el) return { x, y };
    const maxPanX = (el.clientWidth * (scale - 1)) / 2;
    const maxPanY = (el.clientHeight * (scale - 1)) / 2;
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, y)),
    };
  }, []);

  // ── Mouse-wheel zoom (desktop) ──
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoomScale((prev) => {
        const next = Math.min(4, Math.max(1, prev + delta));
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    },
    [],
  );

  // ── Mouse drag (desktop) ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, [zoomScale]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setPan((prev) => clampPan(prev.x + dx, prev.y + dy, zoomScale));
    },
    [zoomScale, clampPan],
  );

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  // ── Touch pinch-to-zoom + drag (mobile) ──
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && zoomScale > 1) {
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [zoomScale]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / lastPinchDist.current;
        lastPinchDist.current = dist;
        setZoomScale((prev) => {
          const next = Math.min(4, Math.max(1, prev * ratio));
          if (next === 1) setPan({ x: 0, y: 0 });
          return next;
        });
      } else if (e.touches.length === 1 && zoomScale > 1) {
        const dx = e.touches[0].clientX - lastPointer.current.x;
        const dy = e.touches[0].clientY - lastPointer.current.y;
        lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setPan((prev) => clampPan(prev.x + dx, prev.y + dy, zoomScale));
      }
    },
    [zoomScale, clampPan],
  );

  const onTouchEnd = useCallback(() => { lastPinchDist.current = null; }, []);

  // Close on Escape key
  useEffect(() => {
    if (!zoomOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeZoom(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomOpen, closeZoom]);

  // Keyboard arrow nav in lightbox
  useEffect(() => {
    if (!zoomOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { prevImg(); resetZoom(); }
      if (e.key === 'ArrowRight') { nextImg(); resetZoom(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomOpen]);

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── Main image — full width on all screen sizes ── */}
        <div className="group relative overflow-hidden rounded-lg border border-brand-border bg-brand-bg-alt shadow-[0_18px_54px_rgba(61,43,31,0.08)]">
          <div className="relative aspect-4/3 w-full lg:aspect-3/2">
            {isVideoActive && embedUrl ? (
              <iframe
                src={embedUrl}
                title={`${productName} video`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : isVideoActive && isDirectVideo && videoUrl ? (
              <video src={videoUrl} controls className="absolute inset-0 h-full w-full bg-black object-contain" />
            ) : (
              <Image
                src={imgs[activeIdx]}
                alt={`${productName} — image ${activeIdx + 1}`}
                fill
                className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.07]"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority={activeIdx === 0}
                loading="eager"
                fetchPriority="high"
              />
            )}
          </div>

          {/* Zoom button — top-right, hidden on video slide */}
          {!isVideoActive && (
            <button
              onClick={openZoom}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-primary shadow-md backdrop-blur-sm transition hover:bg-brand-accent hover:text-white"
              aria-label="View full size image"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}

          {/* Prev / Next nav */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-primary shadow-md backdrop-blur-sm transition hover:bg-brand-accent hover:text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-primary shadow-md backdrop-blur-sm transition hover:bg-brand-accent hover:text-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === activeIdx ? '24px' : '6px',
                      background: i === activeIdx ? 'var(--pvg-accent)' : 'rgba(255,255,255,0.6)',
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Thumbnails ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imgs.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 hover:opacity-100 lg:h-22 lg:w-22"
              style={{
                borderColor: i === activeIdx ? 'var(--pvg-accent)' : 'var(--pvg-border)',
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
          {videoUrl && (
            <button
              onClick={() => setActiveIdx(videoIdx)}
              className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 hover:opacity-100 lg:h-22 lg:w-22"
              style={{
                borderColor: isVideoActive ? 'var(--pvg-accent)' : 'var(--pvg-border)',
                opacity: isVideoActive ? 1 : 0.6,
              }}
              aria-label="Play product video"
            >
              {videoThumb && (
                <Image src={videoThumb} alt={`${productName} video`} fill className="object-cover" sizes="80px" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Play className="h-6 w-6 fill-white text-white" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Zoom Lightbox (rendered via portal to escape sticky stacking context) ── */}
      {mounted && zoomOpen && createPortal(
        <div
          className="fixed inset-0 flex flex-col bg-black"
          style={{ zIndex: 99999, top: 0, left: 0, right: 0, bottom: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom viewer"
        >
          {/* ── Prominent close button — always top-right ── */}
          <button
            onClick={closeZoom}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-sm transition hover:bg-white/30 active:scale-95"
            style={{ zIndex: 100001 }}
            aria-label="Close zoom"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Top bar — counter + zoom controls */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3 pr-20">
            <span className="text-sm text-white/60 select-none">
              {activeIdx + 1} / {imgs.length}
            </span>
            <div className="flex items-center gap-2">
              {/* Zoom out */}
              <button
                onClick={() => setZoomScale((s) => Math.max(1, +(s - 0.5).toFixed(1)))}
                disabled={zoomScale <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 disabled:opacity-30"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              {/* Zoom level label — click to reset */}
              <button
                onClick={resetZoom}
                className="min-w-11 rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/25"
                aria-label="Reset zoom"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              {/* Zoom in */}
              <button
                onClick={() => setZoomScale((s) => Math.min(4, +(s + 0.5).toFixed(1)))}
                disabled={zoomScale >= 4}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 disabled:opacity-30"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Image viewport */}
          <div
            ref={imgWrapRef}
            className="relative flex flex-1 items-center justify-center overflow-hidden"
            style={{ cursor: zoomScale > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'zoom-in' }}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={() => {
              if (zoomScale === 1) setZoomScale(2);
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
                transition: isDragging.current ? 'none' : 'transform 0.2s ease',
                transformOrigin: 'center center',
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              <Image
                src={imgs[activeIdx]}
                alt={productName}
                fill
                className="object-contain select-none"
                sizes="100vw"
                quality={95}
                draggable={false}
              />
            </div>
          </div>

          {/* Bottom nav */}
          {imgs.length > 1 && (
            <div className="flex shrink-0 items-center justify-center gap-4 py-3">
              <button
                onClick={() => { prevImg(); resetZoom(); }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-1.5">
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveIdx(i); resetZoom(); }}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === activeIdx ? '20px' : '6px',
                      background: i === activeIdx ? 'white' : 'rgba(255,255,255,0.35)',
                    }}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => { nextImg(); resetZoom(); }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Hint text */}
          <p className="shrink-0 pb-3 text-center text-[11px] text-white/30 select-none">
            {zoomScale === 1
              ? 'Click to zoom · Scroll wheel / pinch to zoom · Drag to pan'
              : 'Drag to pan · Scroll / pinch to zoom · Click % to reset'}
          </p>
        </div>,
        document.body
      )}
    </>
  );
}
