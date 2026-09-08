'use client';

/** Clears the fixed scroll-to-top control plus rail gap. */
const STICKY_CONTACT_BOTTOM_OFFSET = 'calc(env(safe-area-inset-bottom, 0px) + 82px)';
const STICKY_CONTACT_BOTTOM_OFFSET_MOBILE = 'calc(env(safe-area-inset-bottom, 0px) + 76px)';

export function StickyContactRail() {
  return (
    <>
      <style>{`
        .pvg-sticky-contact-rail {
          position: fixed !important;
          top: auto !important;
          bottom: ${STICKY_CONTACT_BOTTOM_OFFSET} !important;
          left: auto !important;
          right: 14px !important;
          z-index: 920 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 12px !important;
          width: fit-content !important;
          padding: 8px !important;
          margin: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          overflow: visible !important;
          pointer-events: none;
        }

        .pvg-sticky-contact-link {
          pointer-events: auto;
          position: relative !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          padding: 0 !important;
          border: 0 !important;
          border-radius: 50% !important;
          color: #fff !important;
          text-decoration: none !important;
          overflow: visible !important;
          transition: filter 0.15s ease !important;
          -webkit-tap-highlight-color: transparent;
          /* Soft attention cue — brief nudge, long pause */
          animation: pvg-fab-shake 2.8s ease-in-out infinite,
            pvg-fab-glow-maroon 2.2s ease-out infinite !important;
        }

        .pvg-sticky-contact-call {
          background: linear-gradient(145deg, #9c1e1e 0%, #7a1515 48%, #4d0a0a 100%) !important;
        }

        .pvg-sticky-contact-whatsapp {
          background: #25d366 !important;
          animation: pvg-fab-shake 2.8s ease-in-out 0.5s infinite,
            pvg-fab-glow-green 2.2s ease-out 0.3s infinite !important;
        }

        .pvg-sticky-contact-ring {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 2px solid currentColor;
          opacity: 0;
          pointer-events: none;
          z-index: 0;
          animation: pvg-fab-ring 2.2s ease-out infinite !important;
        }

        .pvg-sticky-contact-ring--delay {
          animation-delay: 1.1s !important;
        }

        .pvg-sticky-contact-call .pvg-sticky-contact-ring {
          color: #7a1515;
        }

        .pvg-sticky-contact-whatsapp .pvg-sticky-contact-ring {
          color: #25d366;
        }

        .pvg-sticky-contact-link:hover {
          animation-play-state: paused !important;
          filter: brightness(1.08);
          transform: scale(1.08) !important;
        }

        .pvg-sticky-contact-link:hover .pvg-sticky-contact-ring {
          animation-play-state: paused !important;
        }

        .pvg-sticky-contact-link:active {
          transform: scale(0.95) !important;
        }

        .pvg-sticky-contact-link svg {
          width: 22px !important;
          height: 22px !important;
          fill: currentColor !important;
          stroke: none !important;
          position: relative;
          z-index: 1;
        }

        .pvg-sticky-contact-call svg {
          transform: rotate(-20deg);
        }

        .pvg-sticky-contact-badge {
          position: absolute;
          top: -2px;
          left: -2px;
          z-index: 2;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: #ff2d55;
          border: 2px solid #fff;
          color: #fff;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 9px;
          font-weight: 700;
          line-height: 12px;
          text-align: center;
          box-shadow: 0 2px 6px rgba(255, 45, 85, 0.35);
          pointer-events: none;
          animation: pvg-fab-badge 1.6s ease-in-out infinite !important;
        }

        @keyframes pvg-fab-shake {
          0%, 78%, 100% { transform: translate(0, 0) rotate(0deg); }
          82% { transform: translate(-2px, 0) rotate(-5deg); }
          86% { transform: translate(2px, 0) rotate(5deg); }
          90% { transform: translate(-1px, 0) rotate(-3deg); }
          94% { transform: translate(1px, 0) rotate(2deg); }
        }

        @keyframes pvg-fab-glow-maroon {
          0% { box-shadow: 0 0 0 0 rgba(122, 21, 21, 0.4), 0 6px 16px rgba(122, 21, 21, 0.35); }
          70% { box-shadow: 0 0 0 10px rgba(122, 21, 21, 0), 0 6px 16px rgba(122, 21, 21, 0.35); }
          100% { box-shadow: 0 0 0 0 rgba(122, 21, 21, 0), 0 6px 16px rgba(122, 21, 21, 0.35); }
        }

        @keyframes pvg-fab-glow-green {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4), 0 6px 16px rgba(37, 211, 102, 0.35); }
          70% { box-shadow: 0 0 0 10px rgba(37, 211, 102, 0), 0 6px 16px rgba(37, 211, 102, 0.35); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0), 0 6px 16px rgba(37, 211, 102, 0.35); }
        }

        @keyframes pvg-fab-ring {
          0% { transform: scale(1); opacity: 0.45; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        @keyframes pvg-fab-badge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .pvg-sticky-contact-link {
            width: 48px !important;
            height: 48px !important;
            min-width: 48px !important;
          }

          .pvg-sticky-contact-link svg {
            width: 24px !important;
            height: 24px !important;
          }
        }

        @media (max-width: 767px) {
          .pvg-sticky-contact-rail {
            bottom: ${STICKY_CONTACT_BOTTOM_OFFSET_MOBILE} !important;
            right: max(10px, env(safe-area-inset-right, 0px)) !important;
            gap: 10px !important;
          }

          .pvg-sticky-contact-link {
            width: 48px !important;
            height: 48px !important;
            min-width: 48px !important;
          }

          .pvg-sticky-contact-link svg {
            width: 24px !important;
            height: 24px !important;
          }
        }
      `}</style>

      <div className="pvg-sticky-contact-rail" aria-label="Quick contact actions">
        <a href="tel:+919310172512" className="pvg-sticky-contact-link pvg-sticky-contact-call" aria-label="Call us">
          <span className="pvg-sticky-contact-ring" aria-hidden="true" />
          <span className="pvg-sticky-contact-ring pvg-sticky-contact-ring--delay" aria-hidden="true" />
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </a>

        <a
          href="https://wa.me/919310172512"
          className="pvg-sticky-contact-link pvg-sticky-contact-whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
        >
          <span className="pvg-sticky-contact-ring" aria-hidden="true" />
          <span className="pvg-sticky-contact-ring pvg-sticky-contact-ring--delay" aria-hidden="true" />
          <span className="pvg-sticky-contact-badge" aria-hidden="true">
            2
          </span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.52 3.48A11.8 11.8 0 0 0 12.13 0C5.58 0 .25 5.34.25 11.9c0 2.09.55 4.14 1.58 5.94L0 24l6.34-1.66a11.9 11.9 0 0 0 5.79 1.48h.01c6.55 0 11.88-5.34 11.88-11.9 0-3.17-1.23-6.14-3.5-8.44ZM12.13 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.22-3.76.99 1-3.67-.24-.38a9.86 9.86 0 0 1-1.52-5.24c0-5.46 4.44-9.9 9.91-9.9 2.64 0 5.11 1.03 6.98 2.91a9.82 9.82 0 0 1 2.9 6.99c0 5.46-4.44 9.9-9.9 9.9Zm5.43-7.42c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.19.3-.76.97-.93 1.17-.17.19-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.77-1.65-2.06-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.19.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.38-.28.29-1.04 1.01-1.04 2.47s1.06 2.88 1.21 3.08c.15.19 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.72.22 1.37.19 1.89.11.57-.08 1.77-.72 2.02-1.42.25-.69.25-1.28.18-1.41-.08-.12-.28-.19-.57-.34Z" />
          </svg>
        </a>
      </div>
    </>
  );
}
