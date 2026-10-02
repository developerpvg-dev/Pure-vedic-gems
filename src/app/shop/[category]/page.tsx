import CategoryPage from './category-page';

export { generateMetadata } from './category-page';

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

/** Empty list = no build-time pages, but each category is cached on first visit (without it the route renders every request). */
export function generateStaticParams() {
  return [];
}

// Cached copy ignores the query string; proxy.ts sends filtered/paginated URLs to /shop-live.
export default function Page({ params }: { params: Promise<{ category: string }> }) {
  return <CategoryPage params={params} searchParams={Promise.resolve({})} />;
}
