import type { MetadataRoute } from 'next';
import { absoluteUrl, getSiteUrl } from '@/lib/utils/seo';
import { isProductionDeploy } from '@/lib/deploy-env';

export default function robots(): MetadataRoute.Robots {
  // Block all crawling on staging / preview deployments
  if (!isProductionDeploy()) {
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
          '/*?*min_price_per_carat=',
          '/*?*max_price_per_carat=',
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
