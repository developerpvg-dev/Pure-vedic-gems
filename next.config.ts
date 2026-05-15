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
  ]
    .filter(Boolean)
    .join(' '),
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' blob: data: https://*.supabase.co https://cdn.sanity.io https://images.unsplash.com",
  "media-src 'self' blob: data: https://*.supabase.co https://cdn.sanity.io",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://cdn.sanity.io https://*.api.sanity.io https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com",
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
    ],
  },

  async headers() {
    return [
      // Long-lived cache for all static assets in /public
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
