'use client';

import Image from 'next/image';
import { LAB_LOGOS } from '@/lib/constants/trust-credentials';
import { toPublicAssetUrl } from '@/lib/site-static';

function MarqueeRow({ copyIndex }: { copyIndex: number }) {
  return (
    <div className="pvg-cred-marquee-row">
      <div className="pvg-cred-marquee-logo pvg-cred-marquee-bis">
        <Image
          src={toPublicAssetUrl('/home/heri/bis.jpg')}
          alt="BIS Hallmarked — Govt. Certified Purity, HUID Verifiable"
          width={48}
          height={48}
          className="pvg-cred-marquee-logo-img pvg-cred-marquee-bis-img"
        />
      </div>

      {LAB_LOGOS.map((lab) => (
        <div key={`${copyIndex}-${lab.name}`} className="pvg-cred-marquee-logo">
          <Image
            src={lab.logo}
            alt={`${lab.name} certification`}
            width={96}
            height={40}
            className="pvg-cred-marquee-logo-img"
          />
        </div>
      ))}
    </div>
  );
}

export function CredentialsMarqueeBanner() {
  return (
    <>
      <style>{`
        @keyframes pvgCredMarqueeRun {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .pvg-cred-marquee-inner {
          display: inline-flex !important;
          align-items: center !important;
          width: max-content !important;
          min-width: max-content !important;
          flex-wrap: nowrap !important;
          will-change: transform;
          animation: pvgCredMarqueeRun 32s linear infinite !important;
        }
        .pvg-cred-marquee:hover .pvg-cred-marquee-inner {
          animation-play-state: paused !important;
        }
      `}</style>

      <section className="pvg-cred-marquee" aria-label="BIS hallmark and gem lab certifications">
        <div className="pvg-cred-marquee-inner">
          <MarqueeRow copyIndex={0} />
          <MarqueeRow copyIndex={1} />
        </div>
      </section>
    </>
  );
}
