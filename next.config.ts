import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';

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
  "img-src 'self' blob: data: https://*.supabase.co https://cdn.sanity.io https://images.unsplash.com https://www.google-analytics.com https://img.youtube.com https://i.ytimg.com",
  "media-src 'self' blob: data: https://*.supabase.co https://cdn.sanity.io",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://cdn.sanity.io https://*.api.sanity.io https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://www.google-analytics.com https://region1.google-analytics.com",
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

  webpack: (config) => {
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
    return config;
  },

  images: {
    qualities: [75, 85, 90, 95],
    minimumCacheTTL: 86400, // 1 day for Next.js optimized images
    formats: ['image/webp'],
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

      // Legacy yagya / pooja payment & landing pages -> migrated yagya pages.
      // Each source has a trailing-slash variant because old WP URLs ended with "/".
      ...[
        // Budh
        ['/budha-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/budh-shanti-yagya-by-beej-mantra'],
        ['/budha-shanti-yagya-payment-page', '/vedic-yagyas/budh-shanti-yagya'],
        // Chandra
        ['/chandra-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/chandra-shanti-yagya-with-beej-mantra'],
        // Durga Saptashati family
        ['/durga-homam', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptshati-path-bhaint-prasad-offering-maa-kamakhya-temple-payment', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptshati-path-bhaint-prasad-offering-maa-kamakhya-temple', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptshati-path-bhaint-prasad-offering-maa-vaishno-devi-darbar-payment', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durga-saptshati-path-bhaint-prasad-offering-maa-vaishno-devi-darbar', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/durgasapshati-sankalpa-path-and-yagya', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/navratre-special-sankalpa', '/vedic-yagyas/durga-saptashati-yagya'],
        ['/group-navratri-puja-21st-september-29th-september', '/vedic-yagyas-service'],
        // Guru
        ['/guru-shanti-yagya-payment-page', '/vedic-yagyas/vedic-guru-shanti-yagya'],
        // Ketu
        ['/ketu-shanti-yagya-by-beej-mantra-payment-page', '/vedic-yagyas/ketu-shanti-yagya-beej-mantra'],
        // MahaMrityunjay
        ['/mahamrityunjay-yagya-pooja-payment-page-11000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja11000-jaap'],
        ['/mahamrityunjay-yagya-pooja-payment-page-31000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja-31000-jaap'],
        ['/mahamrityunjay-yagya-pooja-payment-page-51000-jaap', '/vedic-yagyas/mahamritunjay-yagya-pooja-51000-jaap'],
        ['/mahamrityunjay-yagya-pooja-payment-page', '/vedic-yagyas/mahamritunjay-yagya-pooja'],
        // Shukra
        ['/shukra-shanti-yagya', '/vedic-yagyas/shukra-shanti-yagya-2'],
        // Surya
        ['/vedic-surya-shanti-yagya', '/vedic-yagyas/surya-shanti-yagya'],
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
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Legacy Pearl (Moti) SEO landing pages -> newly rebuilt Pearl quality guide.
      ...[
        '/astrological-pearls-gemstone-in-the-philippines',
        '/authenticity-well-being-and-lunar-charm-of-pearl-gemstone-in-switzerland',
        '/buy-100-authentic-pearls-online-in-canada',
        '/buy-100-authentic-pearls-online-in-uk',
        '/buy-100-natural-pearls-online-in-london',
        '/pearl-gemstone-complete-guide-for-people-in-australia',
        '/why-wear-pearl-moon-gemstone-astrological-benefits-healing-and-prosperity',
      ].flatMap((source) => [
        { source, destination: '/knowledge/gem-qualities/pearl', statusCode: 301 },
        { source: `${source}/`, destination: '/knowledge/gem-qualities/pearl', statusCode: 301 },
      ]),

      // Legacy geo-targeted / duplicate gemstone SEO landing pages and editorial
      // gem articles -> the single canonical quality guide for that gem.
      // (301 consolidation preserves link equity without thin doorway duplicates.)
      ...[
        // Blue Sapphire (Neelam)
        ['/astrological-blue-sapphire-gemstone-in-philippines', 'blue-sapphire'],
        ['/blue-sapphire-gemstone-a-complete-guide-for-people-in-australia', 'blue-sapphire'],
        ['/blue-sapphire-gemstone-in-dubai-significance-strength-and-fortune', 'blue-sapphire'],
        ['/blue-sapphire-gemstone-in-switzerland-a-gemstone-of-wisdom-grace-and-strength', 'blue-sapphire'],
        ['/blue-sapphire-gemstone-in-usa', 'blue-sapphire'],
        ['/buy-100-authentic-blue-sapphire-online-in-london', 'blue-sapphire'],
        ['/buy-authentic-blue-sapphire-online-in-canada', 'blue-sapphire'],
        ['/discover-the-irresistible-and-incredible-magic-of-authentic-astrological-blue-sapphire-gemstone-in-uk', 'blue-sapphire'],
        // Yellow Sapphire (Pukhraj)
        ['/astrological-yellow-sapphire-gemstone-in-switzerland', 'yellow-sapphire'],
        ['/authentic-yellow-sapphire-online-in-canada', 'yellow-sapphire'],
        ['/buy-100-authentic-yellow-sapphire-online-in-london', 'yellow-sapphire'],
        ['/buy-authentic-yellow-sapphire-online-in-uk', 'yellow-sapphire'],
        ['/harness-the-celestial-power-of-yellow-sapphire-gemstone-in-the-usa', 'yellow-sapphire'],
        ['/unlocking-prosperity-and-wisdom-the-significance-of-the-yellow-sapphire-gemstone-in-dubai', 'yellow-sapphire'],
        ['/yellow-sapphire-gemstone-guide-in-australia', 'yellow-sapphire'],
        ['/yellow-sapphire-gemstone-in-the-philippines', 'yellow-sapphire'],
        // White Sapphire (Safed Pukhraj) — also legacy diamond page
        ['/buy-100-authentic-white-sapphire-in-canada', 'white-sapphire'],
        ['/buy-100-authentic-white-sapphire-online-in-london', 'white-sapphire'],
        ['/buy-100-authentic-white-sapphire-online-in-uk', 'white-sapphire'],
        ['/diamond', 'white-sapphire'],
        ['/harness-the-celestial-power-of-white-sapphire-gemstone-in-the-usa', 'white-sapphire'],
        ['/white-sapphire-gemstone-benefits-astrology-healing-and-complete-buying-guide-in-philippines', 'white-sapphire'],
        ['/white-sapphire-gemstone-guide-for-beginners-in-australia', 'white-sapphire'],
        ['/why-wear-white-sapphire-gemstone-venus-gemstone-astrological-benefits-healing-and-prosperity', 'white-sapphire'],
        // Emerald (Panna)
        ['/astrological-emerald-gemstone-in-philippines', 'emerald'],
        ['/buy-100-authentic-emerald-online-in-canada', 'emerald'],
        ['/buy-100-authentic-emerald-online-in-london', 'emerald'],
        ['/buy-100-authentic-emerald-online-in-uk', 'emerald'],
        ['/emerald-gemstone-guide-for-beginners-in-australia', 'emerald'],
        ['/emerald-gemstone-panna-the-astrological-gem-of-mercury-and-its-profound-benefits', 'emerald'],
        ['/the-emerald-gemstone-panna-switzerlands-green-portal-to-wisdom-calm-and-expression', 'emerald'],
        // Ruby (Manik)
        ['/astrological-ruby-gemstone-in-philippines', 'ruby'],
        ['/buy-100-authentic-ruby-gemstone-online-in-london', 'ruby'],
        ['/buy-100-authentic-ruby-online-in-canada', 'ruby'],
        ['/buy-authentic-ruby-online-in-uk', 'ruby'],
        ['/ruby-gemstone-for-australian-gemstone-lovers', 'ruby'],
        ['/ruby-manikya-gemstone-wearing-solar-gemstone', 'ruby'],
        ['/solar-brilliance-swiss-ruby-gemstones-certification-and-well-being', 'ruby'],
        // Red Coral (Moonga)
        ['/buy-100-authentic-red-coral-online-in-canada', 'red-coral'],
        ['/buy-100-authentic-red-coral-online-in-london', 'red-coral'],
        ['/buy-100-authentic-red-coral-online-in-uk', 'red-coral'],
        ['/red-coral-gemstone-in-the-philippines', 'red-coral'],
        ['/red-coral-moonga-gemstone-of-mars', 'red-coral'],
        ['/red-coral-stone-moonga-the-comprehensive-benefits-of-wearing-the-gem-of-mars', 'red-coral'],
        // Hessonite (Gomed / Rahu)
        ['/astrological-hessonite-gemstone-in-philippines-benefits-healing-and-buying-guide', 'hessonite'],
        ['/buy-100-authentic-hessonite-online-in-canada', 'hessonite'],
        ['/buy-100-authentic-hessonite-online-in-london', 'hessonite'],
        ['/buy-100-authentic-hessonite-online-in-uk', 'hessonite'],
        ['/hessonite-gemstone-complete-and-simple-guide-for-people-in-australia', 'hessonite'],
        ['/hessonite-gemstone-switzerlands-astrological-treasure', 'hessonite'],
        ['/hessonite-in-the-usa-an-overview', 'hessonite'],
        ['/unveiling-mystical-energy-signification-of-the-hessonite-gemstone-in-dubai', 'hessonite'],
        // Cat's Eye (Lehsunia / Ketu)
        ['/astrological-catseye-gemstone-in-switzerland', 'catseye'],
        ['/buy-100-authentic-cats-eye-in-london', 'catseye'],
        ['/buy-100-authentic-cats-eye-online-in-uk', 'catseye'],
        ['/cats-eye-gemstone-lehsunia-in-canada', 'catseye'],
        ['/catseye-gemstone-complete-guide-for-people-in-australia', 'catseye'],
        ['/harness-the-celestial-power-of-catseye-gemstone-in-the-usa', 'catseye'],
        ['/the-gemstone-of-ketu-protection-intuition-spiritual-power-in-dubai', 'catseye'],
        // Opal (Upala / Venus)
        ['/astrological-opal-gemstone-in-philippines', 'opal'],
        ['/opal-gemstone-complete-guide-for-people-in-australia', 'opal'],
        ['/opal-gemstone-in-switzerland-a-gemstone-of-love-light-and-creative-energy', 'opal'],
        ['/opal-upal-gemstone-venus-gemstone-ring', 'opal'],
      ].flatMap(([source, gem]) => [
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
        ['/astrological-gemstone-recommendation-for-success-in-various-areas-of-life', '/tools/recommendation'],
        ['/best-astrologer', '/consultation'],
        ['/health-benefits-of-yoga', '/blog'],
        ['/mantra-for-confidence-and-inner-strength', '/blog'],
        ['/pure-vedic-gems-vedic-sciences', '/about'],
        ['/pure-vedic-science', '/about'],
        ['/pvg-rewards-points', '/'],
        ['/unveiling-the-mystical-connection-between-gemstones-rudrakshas-and-the-nine-forms-of-goddess-durga', '/vedic-yagyas/durga-saptashati-yagya'],
      ].flatMap(([source, destination]) => [
        { source, destination, statusCode: 301 },
        { source: `${source}/`, destination, statusCode: 301 },
      ]),

      // Legacy obsolete / internal pages (thank-you, old forms, sitemap, job post)
      // -> safe destinations to avoid dead 404s for any stray inbound links.
      ...[
        ['/certificate-banner', '/lab-certificate'],
        ['/gemstone-recommendation-old-form', '/tools/recommendation'],
        ['/thank-you-for-gems-recommendation', '/tools/recommendation'],
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  widenClientFileUpload: true,
});
