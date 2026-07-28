/**
 * Build a dated admin timeline from tracking events + known order timestamps.
 * Dedupes by status key, keeps earliest event_time per status.
 */

export type TrackingEventRow = {
  status: string;
  event_time: string;
  note?: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
};

export type AdminTimelineEntry = {
  key: string;
  label: string;
  at: string;
  note?: string | null;
  source: 'event' | 'field';
};

function fmtLabel(status: string, labels: Record<string, string>) {
  return labels[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildAdminOrderTimeline(input: {
  createdAt: string;
  statusLabels: Record<string, string>;
  events?: TrackingEventRow[];
  designCompletedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  productsMarkedSoldAt?: string | null;
  paymentVerifiedAt?: string | null;
}): AdminTimelineEntry[] {
  const byKey = new Map<string, AdminTimelineEntry>();

  const put = (entry: AdminTimelineEntry) => {
    const existing = byKey.get(entry.key);
    if (!existing || new Date(entry.at).getTime() < new Date(existing.at).getTime()) {
      byKey.set(entry.key, entry);
    }
  };

  put({
    key: 'placed',
    label: 'Order placed',
    at: input.createdAt,
    source: 'field',
  });

  if (input.paymentVerifiedAt) {
    put({
      key: 'payment_verified',
      label: 'Payment verified',
      at: input.paymentVerifiedAt,
      source: 'field',
    });
  }

  for (const event of input.events ?? []) {
    if (!event.status || !event.event_time) continue;
    put({
      key: event.status,
      label: fmtLabel(event.status, input.statusLabels),
      at: event.event_time,
      note: event.note,
      source: 'event',
    });
  }

  if (input.designCompletedAt) {
    put({
      key: 'design_completed',
      label: fmtLabel('design_completed', input.statusLabels),
      at: input.designCompletedAt,
      source: 'field',
    });
  }

  if (input.shippedAt) {
    put({
      key: 'shipped',
      label: fmtLabel('shipped', input.statusLabels),
      at: input.shippedAt,
      source: 'field',
    });
  }

  if (input.deliveredAt) {
    put({
      key: 'delivered',
      label: fmtLabel('delivered', input.statusLabels),
      at: input.deliveredAt,
      source: 'field',
    });
  }

  if (input.productsMarkedSoldAt) {
    put({
      key: 'marked_sold',
      label: 'Items marked sold',
      at: input.productsMarkedSoldAt,
      source: 'field',
    });
  }

  return Array.from(byKey.values()).sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}

export function formatTimelineDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTimelineDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
