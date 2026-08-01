import type { UntypedSupabase } from '@/lib/supabase/untyped';

/** Soft-delete trash: deleted_at set → hidden; hard-purged after retention. */
export const TRASH_RETENTION_DAYS = 30;

export function trashPurgeCutoffIso(now = new Date(), days = TRASH_RETENTION_DAYS) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function daysLeftInTrash(deletedAt: string, now = new Date(), days = TRASH_RETENTION_DAYS) {
  const expiresAt = new Date(deletedAt).getTime() + days * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiresAt - now.getTime()) / (24 * 60 * 60 * 1000)));
}

/** Clear non-cascade FK blockers, then hard-delete the product row. */
export async function hardDeleteProduct(db: UntypedSupabase, productId: string) {
  // ponytail: reviews/saved_items/configs lack ON DELETE CASCADE — clear them first
  for (const table of ['saved_items', 'reviews', 'product_configurations', 'cart_items'] as const) {
    const { error } = await db.from(table).delete().eq('product_id', productId);
    if (error) throw new Error(error.message ?? `Failed clearing ${table}`);
  }
  await db.from('enquiries').update({ product_id: null }).eq('product_id', productId);

  const { error } = await db.from('products').delete().eq('id', productId);
  if (error) throw new Error(error.message ?? 'Failed to permanently delete product');
}

export async function purgeExpiredTrashedProducts(db: UntypedSupabase, now = new Date()) {
  const cutoff = trashPurgeCutoffIso(now);
  const { data, error } = await db
    .from<{ id: string }[]>('products')
    .select('id')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff);
  if (error) throw new Error(error.message ?? 'Failed listing expired trash');

  let purged = 0;
  for (const row of data ?? []) {
    await hardDeleteProduct(db, row.id);
    purged += 1;
  }
  return purged;
}

// ponytail: one assert-based check — run via `npx tsx src/lib/products/trash.selfcheck.ts`
export function __trashSelfCheck() {
  const now = new Date('2026-08-01T12:00:00Z');
  const cutoff = trashPurgeCutoffIso(now, 30);
  if (cutoff !== '2026-07-02T12:00:00.000Z') throw new Error(`cutoff wrong: ${cutoff}`);
  if (daysLeftInTrash('2026-07-20T12:00:00Z', now, 30) !== 18) throw new Error('daysLeft wrong');
  if (daysLeftInTrash('2026-07-01T12:00:00Z', now, 30) !== 0) throw new Error('expired should be 0');
}
