'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useSavedItems } from '@/lib/hooks/useSavedItems';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  className?: string;
  iconClassName?: string;
  stopPropagation?: boolean;
}

export function WishlistButton({
  productId,
  productName,
  className,
  iconClassName,
  stopPropagation = true,
}: WishlistButtonProps) {
  const { isSaved, toggleSaved, isLoading } = useSavedItems();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saved = isSaved(productId);

  const openLogin = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('auth', 'login');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }

    const result = await toggleSaved(productId);

    if (result.status === 'auth_required') {
      toast.info('Sign in to save gems', {
        description: 'Your saved gems stay available across devices.',
        action: { label: 'Sign in', onClick: openLogin },
      });
      return;
    }

    if (result.status === 'error') {
      toast.error(result.error ?? 'Could not update saved gems');
      return;
    }

    trackStorefrontEvent('wishlist_toggle', {
      product_id: productId,
      saved: result.status === 'added',
    });

    toast.success(result.status === 'added' ? 'Saved to your gems' : 'Removed from saved gems', {
      description: productName,
      action: result.status === 'added' ? { label: 'View Saved', onClick: () => router.push('/account/saved') } : undefined,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={saved ? 'Remove from saved gems' : 'Save gem'}
      aria-pressed={saved}
      className={cn(
        'flex items-center justify-center rounded-lg border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)] disabled:cursor-wait disabled:opacity-60',
        saved && 'border-[var(--pvg-accent)] text-[var(--pvg-accent)]',
        className
      )}
    >
      <Heart className={cn('h-4 w-4', iconClassName)} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}