'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import {
  KIND_CONFIGS,
  KIND_ORDER,
  accentClasses,
  type FormKind,
} from '@/components/admin/product-form/kinds';

export default function NewProductHubPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Add New Product</h1>
          <p className="text-sm text-gray-500">
            Choose a product type — each flow has fields, taxonomy, and SEO patterns tailored to it.
          </p>
        </div>
      </div>

      <Link
        href="/admin/products/new/navratna?directors_pick=1"
        className="mb-4 flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-5 py-4 text-purple-900 transition hover:bg-purple-100"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-purple-700 shadow-sm">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Director&apos;s Pick</h2>
            <p className="mt-0.5 text-xs text-purple-700">Create a curated pick with configurator enabled by default.</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5" />
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        {KIND_ORDER.map((kind) => (
          <KindCard key={kind} kind={kind} />
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-sm text-gray-600">
        <p className="font-semibold text-gray-800">Need a different kind of product?</p>
        <p className="mt-1">
          Services, downloadable consultations, and other special product types can be managed via the
          {' '}
          <Link href="/admin/products/import" className="font-medium text-amber-700 hover:underline">
            bulk CSV import
          </Link>{' '}
          tool or by editing an existing record.
        </p>
      </div>
    </div>
  );
}

function KindCard({ kind }: { kind: FormKind }) {
  const cfg = KIND_CONFIGS[kind];
  const accent = accentClasses(cfg.accent);
  return (
    <Link
      href={`/admin/products/new/${cfg.kind}`}
      className={`group flex flex-col gap-3 rounded-2xl border ${accent.border} bg-white p-5 transition-all ${accent.ring}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent.bg} text-2xl`}>
          {cfg.emoji}
        </div>
        <ArrowRight className={`h-5 w-5 ${accent.text} transition-transform group-hover:translate-x-1`} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{cfg.label}</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{cfg.description}</p>
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {cfg.subCategories.slice(0, 4).map((s) => (
          <span key={s.value} className={`rounded-full ${accent.bg} px-2 py-0.5 text-[10px] font-medium ${accent.text}`}>
            {s.label}
          </span>
        ))}
        {cfg.subCategories.length > 4 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            +{cfg.subCategories.length - 4} more
          </span>
        )}
      </div>
    </Link>
  );
}
