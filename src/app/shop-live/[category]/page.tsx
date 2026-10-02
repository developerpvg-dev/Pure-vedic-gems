// Live render of /shop/[category] for filtered/paginated URLs (see shopRoutePath in proxy.ts).
export { default, generateMetadata } from '@/app/shop/[category]/category-page';

export const dynamic = 'force-dynamic';
