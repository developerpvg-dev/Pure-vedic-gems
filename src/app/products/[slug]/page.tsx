import { notFound, redirect } from 'next/navigation';
import { productHref } from '@/lib/categories/storefront';
import { createOptionalPublicClient } from '@/lib/supabase/public';

type Ctx = { params: Promise<{ slug: string }> };

/** Legacy /products/:slug → canonical /shop/{category}/{slug} (recommendation BUY links). */
export default async function LegacyProductRedirect({ params }: Ctx) {
  const { slug } = await params;
  const supabase = createOptionalPublicClient();
  if (!supabase || !slug) notFound();

  const { data } = await supabase
    .from('products')
    .select('slug, category, sub_category')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!data?.slug) notFound();
  redirect(productHref(data));
}
