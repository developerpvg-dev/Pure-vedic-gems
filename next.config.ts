import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';

// P2–P11 + flat shop-category redirects live in src/lib/legacy-redirects.ts
// (proxy lookup) — next.config redirects hit Vercel's deploy route ceiling.

const isProduction = process.env.NODE_ENV === 'production';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isProduction ? '' : "'unsafe-eval'",
    'https://checkout.razorpay.com',
    'https://*.razorpay.com',
    'https://www.googletagmanager.com',
  ]
    .filter(Boolean)
    .join(' '),
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' blob: data: https://*.supabase.co https://cdn.sanity.io https://images.unsplash.com https://www.google-analytics.com https://img.youtube.com https://i.ytimg.com https://flagcdn.com",
  "media-src 'self' blob: data: https://*.supabase.co https://cdn.sanity.io",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://cdn.sanity.io https://sanity-cdn.com https://*.api.sanity.io https://api.sanity.io https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://www.google-analytics.com https://region1.google-analytics.com",
  isProduction ? 'upgrade-insecure-requests' : '',
]
  .filter(Boolean)
  .join('; ');

// Resolve tailwindcss explicitly to this project's node_modules.
// Without this, Node module resolution walks up to C:\Users\himan\package.json
// and finds the wrong tailwindcss version in C:\Users\himan\node_modules.
const projectNodeModules = path.resolve(__dirname, 'node_modules');
const tailwindcssPath = path.resolve(projectNodeModules, 'tailwindcss');
const tailwindcssIndexPath = path.resolve(tailwindcssPath, 'index.css');
const twAnimateCssPath = path.resolve(projectNodeModules, 'tw-animate-css', 'dist', 'tw-animate.css');
const shadcnTailwindCssPath = path.resolve(projectNodeModules, 'shadcn', 'dist', 'tailwind.css');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],

  // Chromium binary is ~70MB compressed / way over Vercel’s 250MB function limit if traced in.
  // pdf.ts downloads the pack from GitHub on cold start instead (CHROMIUM_REMOTE_EXEC_PATH).
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  outputFileTracingExcludes: {
    '/api/admin/recommendations/[id]/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/admin/recommendations/[id]/send': ['./node_modules/@sparticuz/chromium/bin/**'],
  },

  experimental: {
    // Stops Turbopack from ballooning a multi-GB filesystem cache during local dev.
    turbopackFileSystemCacheForDev: false,
  },

  turbopack: {
    root: __dirname,
    resolveAlias: {
      // NOTE: do NOT alias 'tailwindcss' here — @tailwindcss/postcss intercepts
      // '@import "tailwindcss"' itself. Adding a CSS alias for it causes Turbopack
      // to resolve the raw index.css before PostCSS runs, which corrupts the output.
      'tw-animate-css': twAnimateCssPath,
      'shadcn/tailwind.css': shadcnTailwindCssPath,
    },
  },

  webpack: (config, { dev }) => {
    // Force tailwindcss to resolve from this project's node_modules
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: tailwindcssIndexPath,
      'tailwindcss/index.css': tailwindcssIndexPath,
      'tw-animate-css': twAnimateCssPath,
      'shadcn/tailwind.css': shadcnTailwindCssPath,
    };
    // Prioritise project-local node_modules before climbing the directory tree
    config.resolve.modules = [projectNodeModules, 'node_modules'];
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
    }
    return config;
  },

  images: {
    // ponytail: skip Vercel Image Optimization bill; serve Supabase/Sanity URLs as-is.
    // Re-enable (remove unoptimized) or add a CDN loader if LCP from images gets bad.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },

  async rewrites() {
    return [
      // Legacy WP product-category URLs map to current shop routes (no redirect — keep old URLs working)
      // /product-category/navratan/<gem>           -> listing  /shop/<gem>
      // /product-category/navratan/<gem>/<product> -> PDP      /shop/navaratna/<product>
      // Legacy slug variants first (catseye -> cats-eye)
      { source: '/product-category/navratan/catseye/:path*', destination: '/shop/cats-eye/:path*' },
      { source: '/shop/navratan/catseye/:path*', destination: '/shop/cats-eye/:path*' },
      { source: '/product-category/navratan/catseye', destination: '/shop/cats-eye' },
      { source: '/shop/navratan/catseye', destination: '/shop/cats-eye' },
      { source: '/product-category/navratan/:slug', destination: '/shop/:slug' },
      { source: '/product-category/navratan/:slug/', destination: '/shop/:slug' },
      { source: '/product-category/navratan/:slug/:product', destination: '/shop/navaratna/:product' },
      { source: '/product-category/navratan/:slug/:product/', destination: '/shop/navaratna/:product' },
      // Legacy WP "shop" subcategory URLs
      { source: '/shop/navratan/:slug', destination: '/shop/:slug' },
      { source: '/shop/navratan/:slug/', destination: '/shop/:slug' },
      { source: '/shop/navratan/:slug/:product', destination: '/shop/navaratna/:product' },
      { source: '/shop/navratan/:slug/:product/', destination: '/shop/navaratna/:product' },
      // Legacy WP direct product permalinks
      { source: '/product/:slug', destination: '/shop/navaratna/:slug' },
      { source: '/product/:slug/', destination: '/shop/navaratna/:slug' },
    ];
  },

  async redirects() {
    return [
      { source: '/terms-and-conditions', destination: '/policies/terms', statusCode: 301 },
      { source: '/terms-and-conditions/', destination: '/policies/terms', statusCode: 301 },
      { source: '/returns-policy', destination: '/policies/returns', statusCode: 301 },
      { source: '/returns-policy/', destination: '/policies/returns', statusCode: 301 },
      { source: '/shipping-policy', destination: '/policies/shipping', statusCode: 301 },
      { source: '/shipping-policy/', destination: '/policies/shipping', statusCode: 301 },
      { source: '/privacy-policy', destination: '/policies/privacy', statusCode: 301 },
      { source: '/privacy-policy/', destination: '/policies/privacy', statusCode: 301 },
      { source: '/disclaimer', destination: '/policies/legal-notice', statusCode: 301 },
      { source: '/disclaimer/', destination: '/policies/legal-notice', statusCode: 301 },

      // Pitambari + flat /shop/{parent}/{category} redirects: src/lib/legacy-redirects.ts

      // Legacy yagya / pooja / havan / events pages -> product page if known, else main catalog.
      // Each source has a trailing-slash variant because old WP URLs ended with "/".
      // Generated from yagyas-seed.json + redirect audit (content, events, blogs, tags).
      ...[
        ['/budh-shanti-yagya', '/vedic-yagyas/budh-shanti-yagya'],
        ['/budh-shanti-yagya-by-beej-mantra', '/vedic-yagyas/budh-shanti-yagya-by-beej-mantra'],
        ['/budha-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/budh-shanti-yagya-by-beej-mantra'],
        ['/budha-shanti-yagya-payment-page', '/vedic-yagyas/budh-shanti-yagya'],
        ['/chandra-shanti-yagya', '/vedic-yagyas/chandra-shanti-yagya'],
        ['/chandra-shanti-yagya-2', '/vedic-yagyas/chandra-shanti-yagya'],
        ['/chandra-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/chandra-shanti-yagya-with-beej-mantra'],
        ['/chandra-shanti-yagya-with-beej-mantra', '/vedic-yagyas/chandra-shanti-yagya-with-beej-mantra'],
        ['/durga-homam', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptashati-yagya', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptashati-yagya-payments-page', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptshati-path-bhaint-prasad-offering-maa-kamakhya-temple', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptshati-path-bhaint-prasad-offering-maa-kamakhya-temple-payment', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptshati-path-bhaint-prasad-offering-maa-vaishno-devi-darbar', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptshati-path-bhaint-prasad-offering-maa-vaishno-devi-darbar-payment', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durgasapshati-sankalpa-path-and-yagya', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events_cat/chaitra-navratre-yagya-2022', '/vedic-yagyas-service'],
        ['/events_cat/chaitra-navratre-yagya-2024', '/vedic-yagyas-service'],
        ['/events_cat/chaitra-navratre-yagya-2025', '/vedic-yagyas-service'],
        ['/events_cat/durga-saptashati-yagya-navratre-celebrations-2019', '/vedic-yagyas-service'],
        ['/events_cat/guru-chandal-dosh-shanti-yagya-and-path', '/vedic-yagyas-service'],
        ['/events_cat/maa-pratyangira-devi-yagya', '/vedic-yagyas-service'],
        ['/events_cat/mahashivratri-rudrabhishek-2025', '/vedic-yagyas-service'],
        ['/events_cat/navchandi-path-and-yagya-2020', '/vedic-yagyas-service'],
        ['/events_cat/rudra-abhishek-pooja-2021', '/vedic-yagyas-service'],
        ['/events_cat/rudrabhishek-pooja-2021', '/vedic-yagyas-service'],
        ['/events_cat/rudrabhishek-pooja-2021-1', '/vedic-yagyas-service'],
        ['/events_cat/rudrabhishek-pooja-2022', '/vedic-yagyas-service'],
        ['/events_cat/rudrabhishek-pooja-2024', '/vedic-yagyas-service'],
        ['/events_cat/shardiya-navratre-yagya-2021', '/vedic-yagyas-service'],
        ['/events_cat/shardiya-navratre-yagya-2022', '/vedic-yagyas-service'],
        ['/events_cat/shardiya-navratre-yagya-2023', '/vedic-yagyas-service'],
        ['/events_cat/shardiya-navratre-yagya-2024', '/vedic-yagyas-service'],
        ['/events/chaitra-navratre-yagya', '/vedic-yagyas-service'],
        ['/events/chaitra-navratre-yagya-2', '/vedic-yagyas-service'],
        ['/events/chaitra-navratre-yagya-3', '/vedic-yagyas-service'],
        ['/events/chaitra-navratre-yagya-4', '/vedic-yagyas-service'],
        ['/events/chaitra-navratre-yagya-5', '/vedic-yagyas-service'],
        ['/events/chaitra-navratre-yagya-6', '/vedic-yagyas-service'],
        ['/events/chaitra-navratre-yagya-7', '/vedic-yagyas-service'],
        ['/events/durga-sapshati-yagya', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/durga-saptashati-yagya-navratre-celebrations-2019', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/durga-saptashati-yagya-navratre-celebrations-2019-2', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/durga-saptashati-yagya-navratre-celebrations-2019-3', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/durga-saptashati-yagya-navratre-celebrations-2019-4', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/durga-saptashati-yagya-navratre-celebrations-2019-5', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/guru-chandal-dosh-shanti-yagya-and-path', '/vedic-yagyas-service'],
        ['/events/guru-chandal-dosh-shanti-yagya-and-path-2', '/vedic-yagyas-service'],
        ['/events/guru-chandal-dosh-shanti-yagya-and-path-3', '/vedic-yagyas-service'],
        ['/events/guru-chandal-dosh-shanti-yagya-and-path-4', '/vedic-yagyas-service'],
        ['/events/maa-pratyangira-devi-yagya', '/vedic-yagyas-service'],
        ['/events/maa-pratyangira-devi-yagya-2', '/vedic-yagyas-service'],
        ['/events/maa-pratyangira-devi-yagya-stuti', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-10', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-11', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-12', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-13', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-14', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-15', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-2', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-3', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-4', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-5', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-6', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-7', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-8', '/vedic-yagyas-service'],
        ['/events/navchandi-path-and-yagya-9', '/vedic-yagyas-service'],
        ['/events/rudrabhishek-pooja', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/events/rudrabhishek-pooja-2021', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/events/rudrabhishek-pooja-2021-2', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/events/rudrabhishek-pooja-2021-3', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/events/rudrabhishek-pooja-2021-4', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/events/rudrabhishek-pooja-2021-5', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/events/rudrabhishek-pooja-2022', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/events/rudrabhishek-pooja-2024', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/events/saptashati-path-and-yagya', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/saptashati-path-and-yagya-2', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/saptashati-path-and-yagya-3', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/saptashati-path-and-yagya-4', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/saptashati-path-and-yagya-5', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/saptashati-path-and-yagya-6', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/saptashati-path-and-yagya-7', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/saptashati-path-and-yagya-8', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/saptashati-path-and-yagya-9', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/events/shardiya-navratre-yagya', '/vedic-yagyas-service'],
        ['/events/shardiya-navratre-yagya-2', '/vedic-yagyas-service'],
        ['/group-navratri-puja-21st-september-29th-september', '/vedic-yagyas-service'],
        ['/guru-shanti-yagya-by-beej-mantra', '/vedic-yagyas/guru-shanti-yagya-by-beej-mantra'],
        ['/guru-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/guru-shanti-yagya-by-beej-mantra'],
        ['/guru-shanti-yagya-payment-page', '/vedic-yagyas/vedic-guru-shanti-yagya'],
        ['/ketu-shanti-yagya', '/vedic-yagyas/ketu-shanti-yagya'],
        ['/ketu-shanti-yagya-2', '/vedic-yagyas/ketu-shanti-yagya'],
        ['/ketu-shanti-yagya-beej-mantra', '/vedic-yagyas/ketu-shanti-yagya-beej-mantra'],
        ['/ketu-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/ketu-shanti-yagya-beej-mantra'],
        ['/livepuja', '/vedic-yagyas-service'],
        ['/mahamritunjay-yagya-pooja', '/vedic-yagyas/mahamritunjay-yagya-pooja'],
        ['/mahamritunjay-yagya-pooja-31000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja-31000-jaap'],
        ['/mahamritunjay-yagya-pooja-51000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja-51000-jaap'],
        ['/mahamritunjay-yagya-pooja11000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja11000-jaap'],
        ['/mahamrityunjay-yagya-pooja-payment-page', '/vedic-yagyas/mahamritunjay-yagya-pooja'],
        ['/mahamrityunjay-yagya-pooja-payment-page-11000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja11000-jaap'],
        ['/mahamrityunjay-yagya-pooja-payment-page-31000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja-31000-jaap'],
        ['/mahamrityunjay-yagya-pooja-payment-page-51000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja-51000-jaap'],
        ['/mangal-shanti-yagya', '/vedic-yagyas/mangal-shanti-yagya'],
        ['/mangal-shanti-yagya-2', '/vedic-yagyas/mangal-shanti-yagya'],
        ['/mangal-shanti-yagya-beej-mantra', '/vedic-yagyas/mangal-shanti-yagya-beej-mantra'],
        ['/mangal-shanti-yagya-beej-mantra-payment-page', '/vedic-yagyas/mangal-shanti-yagya-beej-mantra'],
        ['/navratre-special-sankalpa', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/our_services/ancient-genuine-vedic-remedies-mantra-yagya-yantra-rudraksha-ratna-dharana', '/vedic-yagyas-service'],
        ['/rahu-shanti-yagya', '/vedic-yagyas/rahu-shanti-yagya'],
        ['/rahu-shanti-yagya-beej-mantra', '/vedic-yagyas/rahu-shanti-yagya-beej-mantra'],
        ['/rahu-shanti-yagya-beej-mantra-payment-page', '/vedic-yagyas/rahu-shanti-yagya-beej-mantra'],
        ['/rahu-shanti-yagya-payment-page', '/vedic-yagyas/rahu-shanti-yagya'],
        ['/shani-shanti-yagya', '/vedic-yagyas/shani-shanti-yagya'],
        ['/shani-shanti-yagya-2', '/vedic-yagyas/shani-shanti-yagya'],
        ['/shani-shanti-yagya-by-beej-mantra', '/vedic-yagyas/shani-shanti-yagya-by-beej-mantra'],
        ['/shani-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/shani-shanti-yagya-by-beej-mantra'],
        ['/shukra-shanti-yagya', '/vedic-yagyas/shukra-shanti-yagya-2'],
        ['/shukra-shanti-yagya-2', '/vedic-yagyas/shukra-shanti-yagya-2'],
        ['/shukra-shanti-yagya-by-beej-mantra', '/vedic-yagyas/shukra-shanti-yagya-by-beej-mantra'],
        ['/shukra-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/shukra-shanti-yagya-by-beej-mantra'],
        ['/surya-shanti-yagya', '/vedic-yagyas/surya-shanti-yagya'],
        ['/surya-shanti-yagya-by-beej-mantra', '/vedic-yagyas/surya-shanti-yagya-by-beej-mantra'],
        ['/surya-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/surya-shanti-yagya-by-beej-mantra'],
        ['/surya-shanti-yagya-payment-page', '/vedic-yagyas/surya-shanti-yagya'],
        ['/tag/astrology-based-yagya', '/vedic-yagyas-service'],
        ['/tag/authentic-online-yagya', '/vedic-yagyas-service'],
        ['/tag/authentic-yagya-services', '/vedic-yagyas-service'],
        ['/tag/choose-right-yagya', '/vedic-yagyas-service'],
        ['/tag/disease-relief-yagya', '/vedic-yagyas-service'],
        ['/tag/gemstone-after-yagya', '/vedic-yagyas-service'],
        ['/tag/gemstone-or-rudraksha-or-yagya', '/vedic-yagyas-service'],
        ['/tag/gemstones-vs-rudraksha-vs-yagya', '/vedic-yagyas-service'],
        ['/tag/havan-in-vedic-astrology', '/vedic-yagyas-service'],
        ['/tag/havan-ingredients', '/vedic-yagyas-service'],
        ['/tag/havan-samagri', '/vedic-yagyas-service'],
        ['/tag/havan-vidhi-in-vedic-astrology', '/vedic-yagyas-service'],
        ['/tag/health-yagya-benefits', '/vedic-yagyas-service'],
        ['/tag/how-to-book-yagya-online', '/vedic-yagyas-service'],
        ['/tag/how-yagya-is-performed', '/vedic-yagyas-service'],
        ['/tag/maha-mrityunjaya-yagya-benefits', '/vedic-yagyas-service'],
        ['/tag/maha-mrityunjaya-yagya-online', '/vedic-yagyas-service'],
        ['/tag/mrityunjaya-mantra', '/vedic-yagyas-service'],
        ['/tag/navagraha-shanti-yagya', '/vedic-yagyas-service'],
        ['/tag/online-grah-shanti-yagya', '/vedic-yagyas-service'],
        ['/tag/online-havan-benefits', '/vedic-yagyas-service'],
        ['/tag/online-health-yagya', '/vedic-yagyas-service'],
        ['/tag/online-vedic-yagya', '/vedic-yagyas-service'],
        ['/tag/online-yagya-astrology', '/vedic-yagyas-service'],
        ['/tag/online-yagya-booking', '/vedic-yagyas-service'],
        ['/tag/online-yagya-effectiveness', '/vedic-yagyas-service'],
        ['/tag/online-yagya-for-mental-peace', '/vedic-yagyas-service'],
        ['/tag/online-yagya-services', '/vedic-yagyas-service'],
        ['/tag/planetary-yagya-remedies', '/vedic-yagyas-service'],
        ['/tag/pure-yagya-samagri', '/vedic-yagyas-service'],
        ['/tag/rahu-ketu-shanti-yagya', '/vedic-yagyas-service'],
        ['/tag/remote-yagya-benefits', '/vedic-yagyas-service'],
        ['/tag/remote-yagya-effectiveness', '/vedic-yagyas-service'],
        ['/tag/remote-yagya-process', '/vedic-yagyas-service'],
        ['/tag/remote-yagya-rituals', '/vedic-yagyas-service'],
        ['/tag/rudrabhishek', '/vedic-yagyas-service'],
        ['/tag/rudraksha-yagya-by-pure-vedic-gems', '/vedic-yagyas-service'],
        ['/tag/sankalp-in-yagya', '/vedic-yagyas-service'],
        ['/tag/sankalpa-in-yagya', '/vedic-yagyas-service'],
        ['/tag/scientific-meaning-of-yagya', '/vedic-yagyas-service'],
        ['/tag/scientific-significance-of-yagya', '/vedic-yagyas-service'],
        ['/tag/shani-shanti-yagya', '/vedic-yagyas-service'],
        ['/tag/shani-shanti-yagya-benefits', '/vedic-yagyas-service'],
        ['/tag/shani-yagya-procedure', '/vedic-yagyas-service'],
        ['/tag/spiritual-benefits-of-yagya', '/vedic-yagyas-service'],
        ['/tag/spiritual-yagya-benefits', '/vedic-yagyas-service'],
        ['/tag/spiritual-yagya-online', '/vedic-yagyas-service'],
        ['/tag/spiritual-yagya-samagri', '/vedic-yagyas-service'],
        ['/tag/step-by-step-yagya-process', '/vedic-yagyas-service'],
        ['/tag/truth-behind-yagyas', '/vedic-yagyas-service'],
        ['/tag/vedic-healing-yagya', '/vedic-yagyas-service'],
        ['/tag/vedic-remedies-yagya', '/vedic-yagyas-service'],
        ['/tag/vedic-yagya', '/vedic-yagyas-service'],
        ['/tag/vedic-yagya-for-shani', '/vedic-yagyas-service'],
        ['/tag/vedic-yagya-guide', '/vedic-yagyas-service'],
        ['/tag/vedic-yagya-ingredients', '/vedic-yagyas-service'],
        ['/tag/vedic-yagya-procedure', '/vedic-yagyas-service'],
        ['/tag/vedic-yagya-significance', '/vedic-yagyas-service'],
        ['/tag/what-is-yagya', '/vedic-yagyas-service'],
        ['/tag/which-yagya-is-right-for-me', '/vedic-yagyas-service'],
        ['/tag/yagya-benefits', '/vedic-yagyas-service'],
        ['/tag/yagya-for-business-growth', '/vedic-yagyas-service'],
        ['/tag/yagya-for-career-problems', '/vedic-yagyas-service'],
        ['/tag/yagya-for-healing', '/vedic-yagyas-service'],
        ['/tag/yagya-for-health', '/vedic-yagyas-service'],
        ['/tag/yagya-for-immunity', '/vedic-yagyas-service'],
        ['/tag/yagya-for-marriage-delay', '/vedic-yagyas-service'],
        ['/tag/yagya-for-mental-peace', '/vedic-yagyas-service'],
        ['/tag/yagya-for-planetary-dosha', '/vedic-yagyas-service'],
        ['/tag/yagya-in-vedic-astrology', '/vedic-yagyas-service'],
        ['/tag/yagya-materials', '/vedic-yagyas-service'],
        ['/tag/yagya-meaning', '/vedic-yagyas-service'],
        ['/tag/yagya-meaning-and-method', '/vedic-yagyas-service'],
        ['/tag/yagya-myths-and-facts', '/vedic-yagyas-service'],
        ['/tag/yagya-samagri', '/vedic-yagyas-service'],
        ['/tag/yagya-samagri-benefits', '/vedic-yagyas-service'],
        ['/tag/yagya-samagri-importance', '/vedic-yagyas-service'],
        ['/tag/yagya-samagri-meaning', '/vedic-yagyas-service'],
        ['/tag/yagya-sankalpa-importance', '/vedic-yagyas-service'],
        ['/tag/yagya-therapy-benefits', '/vedic-yagyas-service'],
        ['/tag/yagya-vs-gemstone', '/vedic-yagyas-service'],
        ['/tag/yagya-without-kundli', '/vedic-yagyas-service'],
        // Nava Durga article rebuilt at the same legacy URL (see app/unveiling-the-mystical-...).
        ['/vedic-guru-shanti-yagya', '/vedic-yagyas/vedic-guru-shanti-yagya'],
        ['/vedic-rudrabhishek', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/vedic-rudrabhishek-paymentpage', '/vedic-yagyas/vedic-rudrabhishek'],
        ['/vedic-surya-shanti-yagya', '/vedic-yagyas/surya-shanti-yagya'],
        ['/videos/healing-our-planets-and-subconscious-body-through-gems-rudrakshas-and-yagya-science', '/vedic-yagyas-service'],
        ['/videos/how-yagya-science-works-on-our-karmas', '/vedic-yagyas-service'],
        ['/videos/ratan-rudraksha-aur-yagya-sabse-aasan-aur-prabhavshali-upaay-hai', '/vedic-yagyas-service'],
        ['/videos/yantra-rudraksha-aur-yagya-vigyaan-ka-asli-prabhaav-paane-ke-liye-in-baaton-ko-avashya-jaaniye', '/vedic-yagyas-service'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Retired knowledge section -> hub.
      ...['/knowledge/buying-guides'].flatMap((source) => [
        { source, destination: '/knowledge', statusCode: 301 },
        { source: `${source}/`, destination: '/knowledge', statusCode: 301 },
      ]),

      // Legacy gem quality / buy-online pages -> rebuilt knowledge guides.
      ...[
        ['/buy-online-blue-sapphire-gemstone', '/knowledge/gem-qualities/blue-sapphire'],
        ['/buy-online-yellow-sapphire-gemstone', '/knowledge/gem-qualities/yellow-sapphire'],
        ['/buy-online-ruby-gemstone', '/knowledge/gem-qualities/ruby'],
        ['/buy-online-emerald-gemstone', '/knowledge/gem-qualities/emerald'],
        ['/red-coral-qualities', '/knowledge/gem-qualities/red-coral'],
        ['/buy-online-catseye-gemstone', '/knowledge/gem-qualities/catseye'],
        ['/hessonite-qualites', '/knowledge/gem-qualities/hessonite'],
        ['/opal-qualities', '/knowledge/gem-qualities/opal'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Pearl geo landings rebuilt as live pages at the same URLs (see app/[slug]).
      // (was: 301 → /knowledge/gem-qualities/pearl)

      // Geo gem landings rebuilt as live SEO/AEO pages at same URLs (69 pages).
      // Only keep /diamond → white-sapphire quality (thin legacy shop stub, not rebuilt).
      ...[['/diamond', 'white-sapphire']].flatMap(([source, gem]) => [
        { source, destination: `/knowledge/gem-qualities/${gem}`, statusCode: 301 },
        { source: `${source}/`, destination: `/knowledge/gem-qualities/${gem}`, statusCode: 301 },
      ]),

      // Legacy Rudraksha geo guides -> canonical Rudraksha qualities page.
      ...[
        '/rudraksha-an-astrological-and-healing-bead-in-switzerland',
        '/rudraksha-complete-guide-for-people-in-australia',
      ].flatMap((source) => [
        { source, destination: '/knowledge/rudraksha-qualities', statusCode: 301 },
        { source: `${source}/`, destination: '/knowledge/rudraksha-qualities', statusCode: 301 },
      ]),

      // Legacy high-Mukhi Rudraksha editorial pages -> rebuilt knowledge guides.
      ...[
        ['/fifteen-15-mukhi-rudraksha', '/knowledge/rudraksha/15-mukhi'],
        ['/sixteen-mukhi-rudraksha', '/knowledge/rudraksha/16-mukhi'],
        ['/seventeen-mukhi-rudraksha', '/knowledge/rudraksha/17-mukhi'],
        ['/eighteen-18-mukhi-rudraksha', '/knowledge/rudraksha/18-mukhi'],
        ['/nineteen-19-mukhi-rudraksha', '/knowledge/rudraksha/19-mukhi'],
        ['/twenty-20-mukhi-rudraksha', '/knowledge/rudraksha/20-mukhi'],
        ['/twenty-one-mukhi-rudraksha', '/knowledge/rudraksha/21-mukhi'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Remaining legacy editorial / brand / misc pages -> closest relevant section.
      ...[
        ['/astrological-gemstone-recommendation-for-success-in-various-areas-of-life', '/gems-recommendations'],
        ['/best-astrologer', '/consultation'],
        ['/health-benefits-of-yoga', '/blog'],
        ['/mantra-for-confidence-and-inner-strength', '/blog'],
        ['/pure-vedic-gems-vedic-sciences', '/gems-recommendations'],
        ['/pure-vedic-science', '/about'],
        ['/pvg-rewards-points', '/'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Legacy geo consultation + regional astrology landings -> /consultation.
      // SEO from these pages is retained via consultation page meta + JSON-LD (not on-page copy).
      ...[
        '/astrological-consultation-in-abu-dhabi-professional-guidance-for-your-birth-chart',
        '/astrological-consultation-in-birmingham-kundli-guidance',
        '/best-astrological-consultation-in-california-expert-vedic-astrologer',
        '/best-astrological-consultation-in-new-york-and-expert-vedic-astrology-guidance',
        '/trusted-astrological-consultation-in-sharjah-personalised-vedic-guidance',
        '/natural-certified-blue-sapphire-gemstone-in-malaysia-benefits-astrology-buying-guide',
        '/natural-certified-emerald-gemstone-in-malaysia-benefits-astrology-buying-guide',
        '/natural-certified-hessonite-gemstone-in-malaysia-benefits-astrology-buying-guide',
        '/natural-certified-pearl-gemstone-in-malaysia-benefits-astrology-buying-guide',
        '/natural-certified-white-sapphire-gemstone-in-malaysia-benefits-astrology-buying-guide',
        '/natural-yellow-sapphire-gemstone-in-malaysia-benefits-astrology-buying-guide',
        '/red-coral-gemstone-in-malaysia-benefits-price-astrology-and-buying-guide',
        '/ruby-gemstone-in-malaysia-natural-certified-astrological-stone-for-confidence-success-and-wealth-growth',
        '/tag/astrological-consultation',
      ].flatMap((source) => [
        { source, destination: '/consultation', statusCode: 301 },
        { source: `${source}/`, destination: '/consultation', statusCode: 301 },
      ]),

      // Legacy geo "buy gem / rudraksha in CITY" landings → stone/rudraksha quality hubs.
      // SEO retained via destination page meta + JSON-LD (not on-page copy).
      ...[
        ['/buy-authentic-certified-rudraksha-in-california-trusted-rudraksha-dealer', '/knowledge/rudraksha-qualities'],
        ['/buy-natural-certified-blue-sapphire-gemstone-in-new-york', '/knowledge/gem-qualities/blue-sapphire'],
        ['/buy-natural-certified-blue-sapphire-in-abu-dhabi-neelam-buying-guide', '/knowledge/gem-qualities/blue-sapphire'],
        ['/buy-natural-certified-blue-sapphire-in-california-trusted-neelam-dealer', '/knowledge/gem-qualities/blue-sapphire'],
        ['/buy-natural-certified-blue-sapphire-in-texas-trusted-neelam-stone-dealer', '/knowledge/gem-qualities/blue-sapphire'],
        ['/buy-natural-certified-cats-eye-in-abu-dhabi-a-complete-buying-guide', '/knowledge/gem-qualities/catseye'],
        ['/buy-natural-certified-cats-eye-in-california-premium-lehsunia-dealer', '/knowledge/gem-qualities/catseye'],
        ['/buy-natural-certified-catseye-lehsunia-gemstone-in-new-york', '/knowledge/gem-qualities/catseye'],
        ['/buy-natural-certified-emerald-in-california-trusted-panna-stone-dealer', '/knowledge/gem-qualities/emerald'],
        ['/buy-natural-certified-emerald-panna-gemstone-in-new-york', '/knowledge/gem-qualities/emerald'],
        ['/buy-natural-certified-emeralds-in-abu-dhabi-a-complete-buying-guide', '/knowledge/gem-qualities/emerald'],
        ['/buy-natural-certified-emeralds-in-birmingham-expert-guide', '/knowledge/gem-qualities/emerald'],
        ['/buy-natural-certified-hessonite-gemstone-in-new-york-benefits-uses-buying-guide', '/knowledge/gem-qualities/hessonite'],
        ['/buy-natural-certified-hessonite-gomed-in-california-trusted-dealer', '/knowledge/gem-qualities/hessonite'],
        ['/buy-natural-certified-hessonite-in-abu-dhabi-a-complete-buying-guide', '/knowledge/gem-qualities/hessonite'],
        ['/buy-natural-certified-hessonite-in-birmingham-guide', '/knowledge/gem-qualities/hessonite'],
        ['/buy-natural-certified-opal-gemstones-in-new-york-genuine-opal-stones', '/knowledge/gem-qualities/opal'],
        ['/buy-natural-certified-opal-in-abu-dhabi-original-opal-buying-guide', '/knowledge/gem-qualities/opal'],
        ['/buy-natural-certified-opal-in-birmingham-buying-guide', '/knowledge/gem-qualities/opal'],
        ['/buy-natural-certified-opal-in-california-trusted-opal-dealer', '/knowledge/gem-qualities/opal'],
        ['/buy-natural-certified-pearl-in-birmingham-buying-guide', '/knowledge/gem-qualities/pearl'],
        ['/buy-natural-certified-pearl-in-california-trusted-pearl-dealer', '/knowledge/gem-qualities/pearl'],
        ['/buy-natural-certified-pearl-moti-gemstone-in-new-york', '/knowledge/gem-qualities/pearl'],
        ['/buy-natural-certified-pearls-in-abu-dhabi-a-complete-buying-guide', '/knowledge/gem-qualities/pearl'],
        ['/buy-natural-certified-red-coral-in-abu-dhabi-original-moonga-stone', '/knowledge/gem-qualities/red-coral'],
        ['/buy-natural-certified-red-coral-in-california-trusted-moonga-stone-dealer', '/knowledge/gem-qualities/red-coral'],
        ['/buy-natural-certified-red-coral-moonga-gemstone-in-new-york', '/knowledge/gem-qualities/red-coral'],
        ['/buy-natural-certified-ruby-in-abu-dhabi-a-smart-buyers-guide', '/knowledge/gem-qualities/ruby'],
        ['/buy-natural-certified-ruby-in-california-trusted-manik-dealer', '/knowledge/gem-qualities/ruby'],
        ['/buy-natural-certified-ruby-in-texas-genuine-manik-stone-dealer', '/knowledge/gem-qualities/ruby'],
        ['/buy-natural-certified-ruby-manik-gemstone-in-new-york', '/knowledge/gem-qualities/ruby'],
        ['/buy-natural-certified-rudraksha-in-abu-dhabi-genuine-rudraksha-beads', '/knowledge/rudraksha-qualities'],
        ['/buy-natural-certified-rudraksha-in-new-york-types-benefits-buying-guide', '/knowledge/rudraksha-qualities'],
        ['/buy-natural-certified-rudraksha-in-sharjah-complete-buying-guide', '/knowledge/rudraksha-qualities'],
        ['/buy-natural-certified-white-sapphire-gemstone-in-new-york', '/knowledge/gem-qualities/white-sapphire'],
        ['/buy-natural-certified-white-sapphire-in-abu-dhabi-a-complete-buying-guide', '/knowledge/gem-qualities/white-sapphire'],
        ['/buy-natural-certified-white-sapphire-in-birmingham-guide', '/knowledge/gem-qualities/white-sapphire'],
        ['/buy-natural-certified-white-sapphire-in-california', '/knowledge/gem-qualities/white-sapphire'],
        ['/buy-natural-certified-yellow-sapphire-in-abu-dhabi-pukhraj-buying-guide', '/knowledge/gem-qualities/yellow-sapphire'],
        ['/buy-natural-certified-yellow-sapphire-in-california-pukhraj', '/knowledge/gem-qualities/yellow-sapphire'],
        ['/buy-natural-certified-yellow-sapphire-in-texas-genuine-pukhraj-stone-dealer', '/knowledge/gem-qualities/yellow-sapphire'],
        ['/buy-natural-certified-yellow-sapphire-pukhraj-gemstone-in-new-york', '/knowledge/gem-qualities/yellow-sapphire'],
        ['/buy-original-certified-rudraksha-in-birmingham-guide', '/knowledge/rudraksha-qualities'],
        ['/cats-eye-gemstone-in-malaysia-natural-certified-ketu-stone-for-protection-spiritual-growth', '/knowledge/gem-qualities/catseye'],
        ['/cats-eye-gemstone-in-philippines-natural-certified-stone-for-protection-and-success', '/knowledge/gem-qualities/catseye'],
        ['/cats-eye-stone-in-birmingham-genuine-certified-buying-guide', '/knowledge/gem-qualities/catseye'],
        ['/find-the-perfect-natural-ruby-in-birmingham-buyers-guide', '/knowledge/gem-qualities/ruby'],
        ['/natural-certified-blue-sapphire-in-sharjah-complete-neelam-buying-guide', '/knowledge/gem-qualities/blue-sapphire'],
        ['/natural-certified-cats-eye-in-sharjah-complete-buying-guide', '/knowledge/gem-qualities/catseye'],
        ['/natural-certified-emerald-in-sharjah-complete-buying-guide', '/knowledge/gem-qualities/emerald'],
        ['/natural-certified-hessonite-in-sharjah-complete-buying-guide', '/knowledge/gem-qualities/hessonite'],
        ['/natural-certified-opal-in-sharjah-complete-buying-guide', '/knowledge/gem-qualities/opal'],
        ['/natural-certified-pearl-in-sharjah-complete-buying-guide', '/knowledge/gem-qualities/pearl'],
        ['/natural-certified-red-coral-in-birmingham-buying-guide', '/knowledge/gem-qualities/red-coral'],
        ['/natural-certified-red-coral-in-sharjah-complete-moonga-buying-guide', '/knowledge/gem-qualities/red-coral'],
        ['/natural-certified-ruby-in-sharjah-complete-ruby-buying-guide', '/knowledge/gem-qualities/ruby'],
        ['/natural-certified-white-sapphire-in-sharjah-complete-buying-guide', '/knowledge/gem-qualities/white-sapphire'],
        ['/natural-certified-yellow-sapphire-in-birmingham-expert-buying-guide', '/knowledge/gem-qualities/yellow-sapphire'],
        ['/natural-certified-yellow-sapphire-in-sharjah-complete-buying-guide', '/knowledge/gem-qualities/yellow-sapphire'],
        ['/opal-gemstone-in-malaysia-natural-certified-stone-for-love-healing-and-peace', '/knowledge/gem-qualities/opal'],
        ['/the-ultimate-guide-to-buying-natural-blue-sapphire-in-birmingham', '/knowledge/gem-qualities/blue-sapphire'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Legacy obsolete / internal pages (thank-you, old forms, sitemap, job post)
      // -> safe destinations to avoid dead 404s for any stray inbound links.
      ...[
        ['/certificate-banner', '/lab-certificate'],
        ['/gemstone-recommendation-old-form', '/gems-recommendations'],
        ['/thank-you-for-gems-recommendation', '/gems-recommendations'],
        ['/thank-you-pure-vedic-science-and-research-centre', '/about'],
        ['/thank-you-pure-vedic-science', '/about'],
        ['/telecaller-telesales-executive-pure-vedic-gems-pvt-ltd', '/contact'],
        ['/data-base-integration-of-enquiry-with-downloadable-excel-file', '/'],
        ['/thank-you', '/'],
        ['/thankyou-for-enquirys', '/'],
        ['/thank-you-for-enquiry', '/'],
        ['/sitemap', '/'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Legacy recommendation / remedies funnel pages -> consolidated SEO booking page.
      // Keep /gems-recommendations as the canonical page (no self-redirect).
      ...[
        ['/gemstone-recommendation', '/gems-recommendations'],
        ['/gemstone-recommendation-by-date-of-birth', '/gems-recommendations'],
        ['/gemstone-recommendation-date-of-birth', '/gems-recommendations'],
        ['/gemstone-recommendations-pure-vedic-science', '/gems-recommendations'],
        ['/online-rudraksha-recommendation', '/gems-recommendations'],
        // Google sitelink "Astrological Gemstones online"
        ['/astrological-gemstones-online', '/gems-recommendations'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Google sitelink "Rudraksha" still hits plural WP slug → shop hub.
      ...[['/rudrakshas', '/shop/rudraksha']].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Legacy core nav / footer pages from the old WordPress site -> new routes.
      ...[
        ['/about-us', '/about'],
        ['/about-vedic-astrology', '/knowledge/astrology'],
        ['/contact-us', '/contact'],
        ['/energized-gems', '/knowledge/energized-gems'],
        ['/gems-care', '/knowledge/gems-care'],
        ['/know-your-vedic-gems', '/knowledge/gemstones'],
        ['/nine-vedic-gems', '/knowledge/gemstones'],
        ['/how-to-measure-your-finger-for-ring', '/tools/ring-size-guide'],
        ['/treatments-and-enhancements-gemstones', '/knowledge/treatments'],
        ['/rudraksha-qualities', '/knowledge/rudraksha-qualities'],
        ['/buy-online-rudraksha', '/knowledge/rudraksha-qualities'],
        ['/rings-design', '/shop/jewelry'],
        ['/video', '/videos'],
        ['/videos-testimonials', '/videos'],
        ['/blogs', '/blog'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Additional legacy gem "qualities" slugs -> canonical quality guides.
      ...[
        ['/hessonite-qualities', 'hessonite'],
        ['/ruby-qualities', 'ruby'],
        ['/white-sapphire-gemstone-qualities', 'white-sapphire'],
      ].flatMap(([source, gem]) => [
        { source, destination: `/knowledge/gem-qualities/${gem}`, statusCode: 301 },
        { source: `${source}/`, destination: `/knowledge/gem-qualities/${gem}`, statusCode: 301 },
      ]),

      // Legacy bare gem category / listing pages -> storefront listings.
      ...[
        ['/blue-sapphire', '/shop/blue-sapphire'],
        ['/yellow-sapphire', '/shop/yellow-sapphire'],
        ['/catseye-gemstone', '/shop/cats-eye'],
        ['/emerald-gemstone', '/shop/emerald'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Legacy WP blog taxonomy + individual testimonial pages.
      { source: '/category/:slug', destination: '/blog', statusCode: 301 },
      { source: '/category/:slug/', destination: '/blog', statusCode: 301 },
      // Slugs only — do not redirect static assets like /testimonial/cardbg.png
      { source: '/testimonial/:slug([^/.]+)', destination: '/testimonials', statusCode: 301 },
      { source: '/testimonial/:slug([^/.]+)/', destination: '/testimonials', statusCode: 301 },

      // Legacy short Jupiter-house WP slugs → matching Sanity blog posts (post→post).
      ...[
        ['/blog/benefits-jupiter-10th-house-horoscope', '/blog/jupiter-in-the-10th-house-horoscope-benefits-of-jupiter-in-the-10th-house-of-horoscope'],
        ['/blog/benefits-jupiter-11th-house-horoscope', '/blog/jupiter-in-the-11th-house-horoscope-benefits-of-jupiter-in-the-11th-house-of-horoscope'],
        ['/blog/benefits-jupiter-12th-house-horoscope', '/blog/jupiter-in-the-12th-house-horoscope-benefits-of-jupiter-in-the-12th-house-of-horoscope'],
        ['/blog/benefits-jupiter-2nd-house-horoscope-2', '/blog/jupiter-in-the-2nd-house-horoscope-benefits-of-jupiter-in-the-2nd-house-of-horoscope'],
        ['/blog/benefits-jupiter-3rd-house-horoscope', '/blog/jupiter-in-the-3rd-house-horoscope-benefits-of-jupiter-in-the-3rd-house-of-horoscope'],
        ['/blog/benefits-jupiter-4th-house-horoscope-2', '/blog/jupiter-in-the-4th-house-horoscope-benefits-of-jupiter-in-the-4th-house-of-horoscope'],
        ['/blog/benefits-jupiter-5th-house-horoscope', '/blog/jupiter-in-the-5th-house-horoscope-benefits-of-jupiter-in-the-5th-house-of-horoscope'],
        ['/blog/benefits-jupiter-6th-house-horoscope', '/blog/jupiter-in-the-6th-house-horoscope-benefits-of-jupiter-in-the-6th-house-of-horoscope'],
        ['/blog/benefits-jupiter-7th-house-horoscope', '/blog/jupiter-in-the-7th-house-horoscope-benefits-of-jupiter-in-the-7th-house-of-horoscope'],
        ['/blog/benefits-jupiter-8th-house-horoscope', '/blog/jupiter-in-the-8th-house-horoscope-benefits-of-jupiter-in-the-8th-house-of-horoscope'],
        ['/blog/benefits-jupiter-9th-house-horoscope', '/blog/jupiter-in-the-9th-house-horoscope-benefits-of-jupiter-in-the-9th-house-of-horoscope'],
        ['/blog/benefits-of-jupiter-in-1st-house-of-horoscope', '/blog/jupiter-in-the-1st-house-horoscope-benefits-of-jupiter-in-the-1st-house-of-horoscope'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // P2–P11 leftover URLs: src/lib/legacy-redirects.ts (proxy Map) — keeps deploy under Vercel route caps.
      // Catch-alls still cover unmapped taxonomy URLs; Map runs first in proxy.

      // Legacy WP taxonomies / authors with no live routes
      { source: '/videos_cat/:path*', destination: '/videos', statusCode: 301 },
      { source: '/events_cat/:path*', destination: '/events-and-seminars', statusCode: 301 },
      { source: '/tag/:path*', destination: '/', statusCode: 301 },
      { source: '/author/:path*', destination: '/', statusCode: 301 },
      { source: '/product-tag/:path*', destination: '/shop', statusCode: 301 },
    ];
  },

  async headers() {
    return [
      // Long-lived cache for all static assets in /public
      {
        source: '/rudraksha-knowledge/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/gems-knowledge/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/home/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }, // 30 days
        ],
      },
      {
        source: '/labslogo/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/our_expets_img/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/stones_img/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/flags/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          ...(isProduction
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '0' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self "https://checkout.razorpay.com")',
          },
        ],
      },
    ];
  },
};

export default isProduction && process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      webpack: {
        treeshake: {
          removeDebugLogging: true,
        },
      },
      widenClientFileUpload: true,
    })
  : nextConfig;
