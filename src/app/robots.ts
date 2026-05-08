import type { MetadataRoute } from 'next';
import { absoluteUrl, getSiteUrl } from '@/lib/utils/seo';

export default function robots(): MetadataRoute.Robots {
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
