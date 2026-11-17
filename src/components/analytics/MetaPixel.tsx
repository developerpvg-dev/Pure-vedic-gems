'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

/** ponytail: delay Meta Pixel until idle/interaction — biggest third-party main-thread cost on homepage. */
export function MetaPixel() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!PIXEL_ID) return undefined;
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const onInteract = () => arm();
    const timeoutId = window.setTimeout(arm, 4000);
    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    window.addEventListener('pointerdown', onInteract, { once: true });
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('pointerdown', onInteract);
    };
  }, []);

  if (!PIXEL_ID || !ready) return null;

  return (
    <>
      <Script id="pvg-meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
