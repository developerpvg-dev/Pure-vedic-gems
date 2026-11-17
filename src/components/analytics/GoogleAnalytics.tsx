'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();

/** ponytail: delay GA until idle/interaction so it stays off the critical path (PSI main-thread). */
export function GoogleAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GA_ID) return undefined;
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const onInteract = () => arm();
    const timeoutId = window.setTimeout(arm, 3500);
    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    window.addEventListener('pointerdown', onInteract, { once: true });
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('pointerdown', onInteract);
    };
  }, []);

  if (!GA_ID || !ready) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="pvg-ga4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
