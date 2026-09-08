'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HEADER_STORE_LOCATIONS } from '@/lib/constants/company-addresses';

type Variant = 'nav' | 'mobile';

/** Catalog / product surfaces only — hide on home, blog, about, etc. */
function isProductStorefrontPath(pathname: string) {
  return /^\/(shop|gemstones|rudraksha|products)(\/|$)/.test(pathname);
}

function GoogleMapsPin({ size }: { size: number }) {
  return (
    <Image
      src="/icons/google-maps-pin.png"
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: 'block', width: size, height: size, objectFit: 'contain' }}
    />
  );
}

export function StoreLocationSelector({ variant = 'nav' }: { variant?: Variant }) {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const isMobile = variant === 'mobile';
  const pinSize = isMobile ? 38 : 42;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!isProductStorefrontPath(pathname)) return null;

  return (
    <div
      ref={rootRef}
      className={`pvg-loc-root pvg-loc-${variant}`}
      style={{ position: 'relative', flexShrink: 0, marginTop: 6 }}
    >
      <style>{`
        @keyframes pvg-loc-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .pvg-loc-bob {
          animation: pvg-loc-bob 1.35s ease-in-out infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .pvg-loc-bob { animation: none; }
        }
      `}</style>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Store locations"
        title="Our stores"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: pinSize + 4,
          height: pinSize + 4,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        <span className="pvg-loc-bob" style={{ display: 'inline-flex' }}>
          <GoogleMapsPin size={pinSize} />
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Store locations"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 1300,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            minWidth: 240,
            maxWidth: 'min(300px, calc(100vw - 24px))',
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: 6,
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            color: '#1a1a1a',
          }}
        >
          {HEADER_STORE_LOCATIONS.map((store, index) => (
            <li key={store.id} role="option">
              <a
                href={store.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderTop: index === 0 ? 'none' : '1px dashed #e8e8e8',
                  color: '#1a1a1a',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "'Roboto', sans-serif",
                }}
              >
                <GoogleMapsPin size={18} />
                <span>{store.label}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
