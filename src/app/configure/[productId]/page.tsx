import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import ConfiguratorClient from '../ConfiguratorClient';
import type { ProductCard } from '@/lib/types/product';

interface Props {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, category')
    .eq('id', productId)
    .single();

  const name = product?.name ?? 'Configure';
  return {
    title: `Configure ${name} | PureVedicGems`,
    description: `Design custom jewelry with ${name}. Choose setting, metal, certification, and energization.`,
  };
}

/**
 * /configure/[productId] — Start configurator with a pre-selected gemstone.
 * Product is fetched server-side and passed to the client component.
 */
export default async function ConfigureProductPage({ params }: Props) {
  const { productId } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select(
      'id, slug, name, category, sub_category, price, price_per_carat, compare_price, carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url, in_stock, featured, is_directors_pick, treatment, planet, created_at'
    )
    .eq('id', productId)
    .eq('in_stock', true)
    .single();

  if (!product) {
    notFound();
  }

  return <ConfiguratorClient preselectedProduct={product as ProductCard} />;
}
