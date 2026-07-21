'use client';

import { X } from 'lucide-react';
import ConfiguratorClient from '@/app/configure/ConfiguratorClient';
import type { ConfiguredOrderResult } from '@/components/configurator/PriceSummary';
import type { ProductCard } from '@/lib/types/product';
import '@/app/configure/configurator-page.css';

/**
 * Full storefront configurator embedded for admin offline POS.
 * With a product: starts at setting type. Without: full category → browse → configure.
 */
export function AdminPosConfigurator({
  product,
  comboProductIds = [],
  onConfigured,
  onClose,
}: {
  product?: ProductCard | null;
  comboProductIds?: string[];
  onConfigured: (result: ConfiguredOrderResult) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-[90] inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md hover:bg-stone-50 sm:right-5 sm:top-5"
        aria-label="Close configurator"
      >
        <X className="h-5 w-5" />
      </button>
      <ConfiguratorClient
        preselectedProduct={product ?? null}
        comboProductIds={comboProductIds}
        onConfigured={onConfigured}
        submitLabel="Add to order"
      />
    </div>
  );
}
