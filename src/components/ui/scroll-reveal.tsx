'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  threshold?: number;
  className?: string;
}

const TRANSLATE_MAP = {
  up: 'translateY(28px)',
  down: 'translateY(-28px)',
  left: 'translateX(-40px)',
  right: 'translateX(40px)',
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  threshold = 0.15,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.style.opacity = '1';
      el.style.transform = 'translate(0)';
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      return;
    }

    const isInViewport = () => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.unobserve(el);
        }
      },
      { threshold: Math.min(threshold, 0.05), rootMargin: '0px 0px 0px 0px' }
    );

    observer.observe(el);

    // Elements already on screen when the page loads may never cross the observer threshold.
    const syncVisible = () => {
      if (isInViewport()) {
        reveal();
        observer.unobserve(el);
      }
    };

    syncVisible();
    const raf = window.requestAnimationFrame(syncVisible);
    window.addEventListener('resize', syncVisible, { passive: true });

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncVisible);
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: TRANSLATE_MAP[direction],
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
