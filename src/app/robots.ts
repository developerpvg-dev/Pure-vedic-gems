import type { MetadataRoute } from 'next';
import { absoluteUrl, getSiteUrl } from '@/lib/utils/seo';

const isProduction =
  process.env.NEXT_PUBLIC_SITE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production';

export default function robots(): MetadataRoute.Robots {
  // Block all crawling on staging / preview deployments
  if (!isProduction) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host: getSiteUrl(),
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/cart',
          '/checkout',
          '/order-confirmation/',
          '/studio/',
          '/configure/',
          '/*?*min_price=',
          '/*?*max_price=',
          '/*?*sort_by=',
          '/*?*per_page=',
          '/*?*page=',
          '/*?*preview=',
        ],
      },
    ],
    host: getSiteUrl(),
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
