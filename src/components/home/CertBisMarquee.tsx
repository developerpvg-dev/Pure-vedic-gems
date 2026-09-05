'use client';

import { toPublicAssetUrl } from '@/lib/site-static';

function BisCore({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      className={duplicate ? 'cert-bis-bar-core cert-bis-bar-core--dup' : 'cert-bis-bar-core'}
      aria-hidden={duplicate || undefined}
    >
      <img
        className="cert-bis-logo"
        src={toPublicAssetUrl('/home/heri/bis.jpg')}
        alt=""
        width={20}
        height={18}
        loading="lazy"
        decoding="async"
      />
      <p className="cert-bis-bar-copy">
        <strong>BIS Hallmarked</strong>
        <span className="cert-bis-bar-sep" aria-hidden="true">
          —
        </span>
        <span>Govt. Certified Purity for Gold &amp; Silver</span>
      </p>
    </div>
  );
}

/** Desktop: static centered note. Mobile: right→left marquee. */
export function CertBisMarquee() {
  return (
    <>
      <style>{`
        @keyframes certBisMarqueeRtl {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }

        .cert-bis-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          margin-top: 36px;
          padding: 14px 0 2px;
        }

        .cert-bis-bar-rule {
          flex: 1 1 auto;
          height: 1px;
          min-width: 20px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.65;
        }

        .cert-bis-bar-viewport {
          flex: 0 1 auto;
          min-width: 0;
          overflow: visible;
        }

        .cert-bis-bar-track {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cert-bis-bar-core {
          display: inline-flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: center;
          gap: 9px;
          flex: 0 0 auto;
        }

        .cert-bis-bar-core--dup {
          display: none;
        }

        .cert-bis-logo {
          display: block;
          width: 20px;
          height: 18px;
          flex: 0 0 auto;
          object-fit: cover;
          object-position: 50% 12%;
        }

        .cert-bis-bar-copy {
          display: inline;
          margin: 0;
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: clamp(0.8rem, 1vw, 0.92rem);
          line-height: 1.35;
          letter-spacing: 0.03em;
          color: var(--muted);
          white-space: nowrap;
        }

        .cert-bis-bar-copy strong {
          font-family: var(--font-display), Georgia, 'Times New Roman', serif;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--maroon-deep);
        }

        .cert-bis-bar-sep {
          margin: 0 0.35em;
          color: var(--gold);
          opacity: 0.85;
        }

        @media (max-width: 1024px) {
          .cert-bis-bar {
            margin-top: 28px;
            gap: 0;
            padding: 10px 0 2px;
          }

          .cert-bis-bar-rule {
            display: none !important;
          }

          .cert-bis-bar-viewport {
            flex: 1 1 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
            -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
          }

          .cert-bis-bar-track {
            display: inline-flex !important;
            justify-content: flex-start !important;
            width: max-content !important;
            min-width: max-content !important;
            flex-wrap: nowrap !important;
            will-change: transform;
            animation: certBisMarqueeRtl 14s linear infinite !important;
          }

          .cert-bis-bar-core {
            padding: 0 32px;
          }

          .cert-bis-bar-core--dup {
            display: inline-flex !important;
          }

          .cert-bis-logo {
            width: 18px;
            height: 16px;
          }

          .cert-bis-bar-copy {
            font-size: 0.78rem;
            letter-spacing: 0.02em;
          }
        }
      `}</style>

      <div className="cert-bis-bar" role="note" aria-label="BIS Hallmarked jewellery">
        <span className="cert-bis-bar-rule" aria-hidden="true" />
        <div className="cert-bis-bar-viewport">
          <div className="cert-bis-bar-track">
            <BisCore />
            <BisCore duplicate />
          </div>
        </div>
        <span className="cert-bis-bar-rule" aria-hidden="true" />
      </div>
    </>
  );
}
