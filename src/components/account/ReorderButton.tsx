'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import type { CartItemInput } from '@/lib/validators/cart';

interface ReorderResponse {
  items: CartItemInput[];
  unavailable: Array<{ product_id: string | null; name: string; reason: string }>;
}

export function ReorderButton({ orderId }: { orderId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  async function handleReorder() {
    setIsLoading(true);
    const response = await fetch('/api/account/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    }).catch(() => null);
    setIsLoading(false);

    if (!response?.ok) {
      const data = await response?.json().catch(() => null) as { error?: string } | null;
      toast.error(data?.error ?? 'Could not prepare reorder');
      return;
    }

    const data = await response.json() as ReorderResponse;
    data.items.forEach((item) => addItem({
      product_id: item.product_id,
      sku: item.sku,
      tag_number: item.tag_number ?? null,
      name: item.name,
      category: item.category,
      image_url: item.image_url,
      price: item.price,
      quantity: item.quantity,
      carat_weight: item.carat_weight ?? null,
      origin: item.origin ?? null,
      configuration_id: item.configuration_id ?? undefined,
      configuration_summary: item.configuration_summary ?? undefined,
      configuration_snapshot: item.configuration_snapshot,
      configuration_edit_url: item.configuration_edit_url ?? undefined,
      delivery_eta_label: item.delivery_eta_label ?? undefined,
    }));

    if (data.items.length > 0) {
      toast.success('Eligible items added to cart', {
        description: data.unavailable.length > 0 ? `${data.unavailable.length} item needs support review.` : undefined,
        action: { label: 'View Cart', onClick: () => router.push('/cart') },
      });
      router.refresh();
    } else {
      toast.info('No items could be reordered', {
        description: data.unavailable[0]?.reason ?? 'This order contains custom or unavailable products.',
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--pvg-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--pvg-primary)] transition hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)] disabled:cursor-wait disabled:opacity-60"
    >
      <RefreshCw className={isLoading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
      Reorder
    </button>
  );
}