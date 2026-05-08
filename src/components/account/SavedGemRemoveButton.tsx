'use client';

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useSavedItems } from '@/lib/hooks/useSavedItems';

export function SavedGemRemoveButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const { toggleSaved, isLoading } = useSavedItems();

  async function removeSaved() {
    const result = await toggleSaved(productId);
    if (result.status === 'removed') {
      toast.success('Removed from saved gems', { description: productName });
      router.refresh();
      return;
    }
    toast.error(result.error ?? 'Could not remove saved gem');
  }

  return (
    <button
      type="button"
      onClick={removeSaved}
      disabled={isLoading}
      className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-white/90 text-brand-accent shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
      aria-label="Remove saved gem"
    >
      <Heart className="h-4 w-4" fill="currentColor" />
    </button>
  );
}