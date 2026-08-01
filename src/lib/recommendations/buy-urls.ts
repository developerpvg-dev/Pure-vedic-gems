import type { ProductRef, ReportBlock } from '@/lib/recommendations/blocks';
import { productHref } from '@/lib/categories/storefront';

type ProductRow = {
  id: string;
  slug: string;
  category: string | null;
  sub_category: string | null;
};

type ProductsQuery = {
  select: (cols: string) => {
    in: (col: string, values: string[]) => Promise<{ data: ProductRow[] | null; error: { message: string } | null }>;
  };
};

function visitProducts(blocks: ReportBlock[], fn: (p: ProductRef) => ProductRef): ReportBlock[] {
  return blocks.map((block) => {
    if (block.type === 'primaryStone') {
      return { ...block, stone: { ...block.stone, product: fn(block.stone.product) } };
    }
    if (block.type === 'additionalStones' || block.type === 'stoneGrid') {
      return { ...block, stones: block.stones.map((s) => ({ ...s, product: fn(s.product) })) };
    }
    if (block.type === 'tieredProducts') {
      return { ...block, tiers: block.tiers.map((t) => ({ ...t, product: fn(t.product) })) };
    }
    return block;
  });
}

/** Rebuild BUY links as /shop/{category}/{slug} (fixes legacy /products/:slug stored in reports). */
export function applyShopBuyUrls(blocks: ReportBlock[], siteUrl: string, products: ProductRow[]): ReportBlock[] {
  const site = siteUrl.replace(/\/$/, '');
  const byId = new Map(products.map((p) => [p.id, p]));
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return visitProducts(blocks, (product) => {
    const row =
      (product.productId ? byId.get(product.productId) : undefined) ||
      (product.slug ? bySlug.get(product.slug) : undefined);
    if (!row?.slug) return product;
    return {
      ...product,
      slug: row.slug,
      buyUrl: `${site}${productHref(row)}`,
    };
  });
}

export async function withShopBuyUrls(
  blocks: ReportBlock[],
  siteUrl: string,
  db: { from: (table: string) => ProductsQuery }
): Promise<ReportBlock[]> {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  visitProducts(blocks, (p) => {
    if (p.productId) ids.add(p.productId);
    if (p.slug) slugs.add(p.slug);
    return p;
  });
  if (!ids.size && !slugs.size) return blocks;

  const rows: ProductRow[] = [];
  const seen = new Set<string>();

  if (ids.size) {
    const { data, error } = await db.from('products').select('id, slug, category, sub_category').in('id', [...ids]);
    if (error) console.warn('[recommendations] buy url by id', error.message);
    for (const row of data ?? []) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
    }
  }

  if (slugs.size) {
    const { data, error } = await db.from('products').select('id, slug, category, sub_category').in('slug', [...slugs]);
    if (error) console.warn('[recommendations] buy url by slug', error.message);
    for (const row of data ?? []) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
    }
  }

  if (!rows.length) return blocks;
  return applyShopBuyUrls(blocks, siteUrl, rows);
}
