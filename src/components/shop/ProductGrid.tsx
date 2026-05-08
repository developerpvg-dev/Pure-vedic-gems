import Link from 'next/link';
import { Gem } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductCard as ProductCardType } from '@/lib/types/product';

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--pvg-border)]">
      {/* 5:6 image skeleton */}
      <div className="relative w-full" style={{ paddingBottom: '120%' }}>
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-2/3 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-5 w-2/5 rounded" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-gold-light">
        <Gem className="h-9 w-9 text-[var(--pvg-accent)]" />
      </div>
      <h3 className="font-heading mb-2 text-xl text-[var(--pvg-primary)]">
        No Matching Products
      </h3>
      <p className="max-w-xs text-sm text-[var(--pvg-muted)]">
        Adjust your filters, clear the search term, or request help sourcing a similar gemstone.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/shop"
          className="rounded-lg bg-brand-primary px-5 py-2 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)] transition hover:bg-brand-accent hover:text-[var(--pvg-primary)]"
        >
          Clear Filters
        </Link>
        <Link
          href="/consultation"
          className="rounded-lg border border-[var(--pvg-primary)] px-5 py-2 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-primary)] transition hover:bg-brand-primary hover:text-[var(--pvg-bg)]"
        >
          Ask an Expert
        </Link>
      </div>
    </div>
  );
}

// ─── ProductGrid ─────────────────────────────────────────────────────────────

interface ProductGridProps {
  products: ProductCardType[];
  loading?: boolean;
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
}

export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 12,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-3">
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        : products.length === 0
        ? <EmptyState />
        : products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
    </div>
  );
}
