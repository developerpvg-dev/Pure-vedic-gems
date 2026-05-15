import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { createInAppNotification } from '@/lib/notifications/in-app';

export const LOW_STOCK_THRESHOLD = 5;

type LowStockProduct = {
  id: string;
  sku?: string | null;
  name: string;
  category?: string | null;
  stock_quantity: number | null;
};

export async function notifyLowStockProduct(product: LowStockProduct, source: string = 'stock_update') {
  const stockQuantity = Number(product.stock_quantity ?? 0);
  if (stockQuantity >= LOW_STOCK_THRESHOLD) return;

  const db = asUntypedSupabase(createAdminClient());
  const message = `${product.name}${product.sku ? ` (${product.sku})` : ''} has ${stockQuantity} unit${stockQuantity === 1 ? '' : 's'} left.`;
  const metadata = {
    sku: product.sku ?? null,
    category: product.category ?? null,
    stock_quantity: stockQuantity,
    threshold: LOW_STOCK_THRESHOLD,
    source,
  };

  const { data: existing } = await db
    .from<{ id: string }>('in_app_notifications')
    .select('id')
    .eq('audience', 'admin')
    .eq('type', 'low_stock_product')
    .eq('entity_type', 'product')
    .eq('entity_id', product.id)
    .is('read_at', null)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('in_app_notifications')
      .update({
        title: stockQuantity <= 0 ? 'Product out of stock' : 'Low stock warning',
        message,
        href: '/admin/products?stock=low',
        metadata,
      })
      .eq('id', existing.id)
      .then(null, () => undefined);
    return;
  }

  await createInAppNotification({
    audience: 'admin',
    type: 'low_stock_product',
    title: stockQuantity <= 0 ? 'Product out of stock' : 'Low stock warning',
    message,
    href: '/admin/products?stock=low',
    entityType: 'product',
    entityId: product.id,
    metadata,
  });
}