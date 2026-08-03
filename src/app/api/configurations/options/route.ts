import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicClient } from '@/lib/supabase/public';
import { DEFAULT_GEMSTONE_CERT_LAB_SLUGS } from '@/lib/utils/legacy-certificate-options';
import { DEFAULT_GEMSTONE_ENERGIZATION_SLUGS } from '@/lib/utils/legacy-energization-options';
import {
  resolveConfiguratorOptionRules,
  withDefaultConfiguratorAllowLists,
  type ConfiguratorOptionRules,
} from '@/lib/utils/configurator-rules';

const QuerySchema = z.object({
  product_id: z.string().uuid(),
});

async function loadDefaultAllowListIds(
  supabase: ReturnType<typeof createPublicClient>,
): Promise<{ certificationLabIds: string[]; energizationOptionIds: string[] }> {
  const [labsResult, energResult] = await Promise.all([
    supabase.from('certification_labs').select('id, legacy_slug').eq('is_active', true),
    supabase.from('energization_options').select('id, legacy_slug').eq('is_active', true),
  ]);

  const labsBySlug = new Map<string, string>();
  for (const row of labsResult.data ?? []) {
    if (row.legacy_slug) labsBySlug.set(String(row.legacy_slug), String(row.id));
  }
  const energBySlug = new Map<string, string>();
  for (const row of energResult.data ?? []) {
    if (row.legacy_slug) energBySlug.set(String(row.legacy_slug), String(row.id));
  }

  return {
    certificationLabIds: DEFAULT_GEMSTONE_CERT_LAB_SLUGS.map((slug) => labsBySlug.get(slug)).filter(
      (id): id is string => Boolean(id),
    ),
    energizationOptionIds: DEFAULT_GEMSTONE_ENERGIZATION_SLUGS.map((slug) =>
      energBySlug.get(slug),
    ).filter((id): id is string => Boolean(id)),
  };
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = QuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const supabase = createPublicClient();
  const productId = parsed.data.product_id;

  const [productResult, rulesResult, defaults] = await Promise.all([
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
    loadDefaultAllowListIds(supabase),
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

  const rules: ConfiguratorOptionRules = withDefaultConfiguratorAllowLists(
    resolveConfiguratorOptionRules(product, rulesResult.data),
    defaults,
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