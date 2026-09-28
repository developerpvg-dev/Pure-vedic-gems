'use client';

import dynamic from 'next/dynamic';

// Config is loaded inside the client-only import: a static import drags the whole `sanity`
// package (~6MB) into the server bundle, which counts against the Workers 64MiB limit.
const Studio = dynamic(
  () =>
    Promise.all([import('next-sanity/studio'), import('@/sanity/config')]).then(
      ([{ NextStudio }, { default: config }]) =>
        function Studio() {
          return <NextStudio config={config} />;
        },
    ),
  { ssr: false },
);

export default function StudioPage() {
  return <Studio />;
}
