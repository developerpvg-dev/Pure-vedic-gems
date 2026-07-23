import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicClient } from '@/lib/supabase/public';
import {
  resolveConfiguratorOptionRules,
  type ConfiguratorOptionRules,
} from '@/lib/utils/configurator-rules';

const QuerySchema = z.object({
  product_id: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = QuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const supabase = createPublicClient();
  const productId = parsed.data.product_id;

  const [productResult, rulesResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, category, sub_category, configurator_enabled')
      .eq('id', productId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('product_option_rules')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle(),
  ]);

  if (productResult.error || !productResult.data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const product = productResult.data as {
    id: string;
    category: string;
    sub_category: string | null;
    configurator_enabled: boolean;
  };

  const rules: ConfiguratorOptionRules = resolveConfiguratorOptionRules(
    product,
    rulesResult.data
  );

  return NextResponse.json(
    {
      product_id: productId,
      rules,
      source: rulesResult.data ? 'product_option_rules' : 'product_defaults',
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    }
  );
}