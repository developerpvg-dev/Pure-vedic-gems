'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { KIND_CONFIGS, KIND_ORDER } from '@/components/admin/product-form/kinds';

export default function NewProductHubPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add product</h1>
          <p className="text-sm text-gray-500">Choose a product type to continue.</p>
        </div>
      </div>

      <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {KIND_ORDER.map((kind) => {
          const cfg = KIND_CONFIGS[kind];
          return (
            <li key={kind}>
              <Link
                href={`/admin/products/new/${cfg.kind}`}
                className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>
                    {cfg.emoji}
                  </span>
                  <span className="font-medium text-gray-900">{cfg.shortLabel}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-600" />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-3">
        <Link
          href="/admin/directors-pick"
          className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-5 py-3.5 text-purple-900 transition hover:bg-purple-100"
        >
          <div className="flex items-center gap-2.5">
            <Star className="h-4 w-4 text-purple-700" />
            <span className="text-sm font-medium">Manage Director&apos;s Pick</span>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="text-center text-xs text-gray-500">
          Bulk import?{' '}
          <Link href="/admin/products/import" className="font-medium text-amber-700 hover:underline">
            CSV import
          </Link>
        </p>
      </div>
    </div>
  );
}
