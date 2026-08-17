'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { BlogGemTile } from '@/lib/blog/blog-rail-data';

const MOBILE_MAX = 1023;

function dismissKey(kind: string) {
  return `pvg-blog-shop-popup-dismissed:${kind}`;
}

export function BlogShopPopup({
  kind,
  title,
  href,
  gems,
}: {
  kind: string;
  title: string;
  href: string;
  gems: BlogGemTile[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (gems.length === 0) return;
    if (localStorage.getItem(dismissKey(kind))) return;

    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    if (!mq.matches) return;

    const timer = window.setTimeout(() => {
      if (!window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches) return;
      if (localStorage.getItem(dismissKey(kind))) return;
      setOpen(true);
    }, 15_000);

    return () => window.clearTimeout(timer);
  }, [kind, gems.length]);

  function dismiss() {
    localStorage.setItem(dismissKey(kind), 'true');
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      localStorage.setItem(dismissKey(kind), 'true');
      setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, kind]);

  if (!open) return null;

  return createPortal(
    <div className="pvg-blog-popup-backdrop" role="presentation" onMouseDown={dismiss}>
      <section
        className="pvg-blog-popup pvg-blog-popup--shop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-shop-popup-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="pvg-blog-popup-close" aria-label="Close shop popup" onClick={dismiss}>
          <X aria-hidden="true" />
        </button>
        <h2 id="blog-shop-popup-heading">{title}</h2>
        <p>Browse certified gemstones from our collection.</p>
        <div className="pvg-blog-popup-gem-grid">
          {gems.map((gem) => (
            <Link key={gem.id} href={gem.href} className="pvg-blog-popup-gem-item" onClick={dismiss}>
              <span className="pvg-blog-popup-gem-thumb">
                {gem.image ? (
                  <Image src={gem.image} alt={gem.name} fill sizes="64px" className="object-contain" />
                ) : (
                  <span
                    className="pvg-blog-gem-thumb-fallback"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${gem.color ?? '#B8861E'}, #6B4800 55%, #2A1800 100%)`,
                    }}
                    aria-hidden="true"
                  />
                )}
              </span>
              <span>{gem.name}</span>
            </Link>
          ))}
        </div>
        <Link href={href} className="pvg-blog-gem-cta" onClick={dismiss}>
          View Full Collection
        </Link>
      </section>
    </div>,
    document.body,
  );
}
