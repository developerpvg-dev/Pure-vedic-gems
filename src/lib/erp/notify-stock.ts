import { createInAppNotifications } from '@/lib/notifications/in-app';

/** One summary notification per event — stock managers + owners/admins. */
export async function notifyStockManagers(input: {
  type: 'stock_sold_offline' | 'stock_need_add' | 'stock_sold_online';
  title: string;
  message: string;
  href?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const href = input.href ?? '/admin/erp-sync';
  const base = {
    audience: 'admin' as const,
    type: input.type,
    title: input.title,
    message: input.message,
    href,
    entityType: 'erp_sync',
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
  };

  // ponytail: one row per role; null recipient_role would also reach designers
  return createInAppNotifications([
    { ...base, recipientRole: 'stock_manager' },
    { ...base, recipientRole: 'owner' },
    { ...base, recipientRole: 'admin' },
  ]);
}

export async function notifyStockManagersAfterExcelSync(input: {
  stockCategoryLabel: string;
  soldOfflineStillLive: number;
  missingOnWebsite: number;
}) {
  const jobs: Array<ReturnType<typeof notifyStockManagers>> = [];

  if (input.soldOfflineStillLive > 0) {
    jobs.push(
      notifyStockManagers({
        type: 'stock_sold_offline',
        title: 'Sold offline — still live on website',
        message: `${input.stockCategoryLabel}: ${input.soldOfflineStillLive} product(s) need mark sold/reserved.`,
        href: '/admin/erp-sync?tab=sold-offline',
        metadata: {
          stockCategoryLabel: input.stockCategoryLabel,
          count: input.soldOfflineStillLive,
        },
      })
    );
  }

  if (input.missingOnWebsite > 0) {
    jobs.push(
      notifyStockManagers({
        type: 'stock_need_add',
        title: 'In store — not on website',
        message: `${input.stockCategoryLabel}: ${input.missingOnWebsite} tag(s) to add on the website.`,
        href: '/admin/erp-sync?tab=add',
        metadata: {
          stockCategoryLabel: input.stockCategoryLabel,
          count: input.missingOnWebsite,
        },
      })
    );
  }

  await Promise.all(jobs);
}
