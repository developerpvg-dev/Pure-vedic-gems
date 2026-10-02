import ShopPage from './shop-page';

export { generateMetadata } from './shop-page';

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

// Cached copy ignores the query string; proxy.ts sends filtered/paginated URLs to /shop-live.
export default function Page() {
  return <ShopPage searchParams={Promise.resolve({})} />;
}
