'use client';

import { useEffect, useState } from 'react';

/** Shop/product pages — fixed circular back-to-top on the left (clears WhatsApp rail). */
export function BackToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 220);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        .pvg-shop-scroll-top {
          position: fixed;
          z-index: 980;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border: 0;
          background: linear-gradient(145deg, #9c1e1e 0%, #7a1515 48%, #4d0a0a 100%);
          color: #fff;
          box-shadow: 0 8px 24px rgba(122, 21, 21, 0.48);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          left: 14px;
          right: auto;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
          border-radius: 50%;
          transform: translateY(10px);
        }
        .pvg-shop-scroll-top.is-visible {
          opacity: 1;
          pointer-events: auto;
          transform: none;
        }
        .pvg-shop-scroll-top:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 30px rgba(122, 21, 21, 0.55);
        }
        .pvg-shop-scroll-top:active {
          transform: scale(0.94);
        }
        .pvg-shop-scroll-top svg {
          width: 22px;
          height: 22px;
          stroke: currentColor;
          stroke-width: 2.5;
          fill: none;
        }
        @media (max-width: 767px) {
          .pvg-shop-scroll-top {
            left: max(10px, env(safe-area-inset-left, 0px));
            bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
            width: 48px;
            height: 48px;
          }
          .pvg-shop-scroll-top svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`pvg-shop-scroll-top${show ? ' is-visible' : ''}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </>
  );
}
