// Live render of /shop/[category]/[slug] for filtered/paginated URLs (see shopRoutePath in proxy.ts).
export { default, generateMetadata } from '@/app/shop/[category]/[slug]/product-page';

export const dynamic = 'force-dynamic';
