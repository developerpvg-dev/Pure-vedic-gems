'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { ProductForm } from '@/components/admin/product-form/ProductForm';
import { detectKindFromProduct } from '@/components/admin/product-form/kinds';

export const dynamic = 'force-dynamic';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditPageProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        if (!res.ok) {
          setError('Failed to load product.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        const p = (data.product ?? data) as Record<string, unknown>;
        if (!cancelled) {
          setProduct(p);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Network error while loading the product.');
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading product…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin/products" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Product not found</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || 'This product could not be loaded.'}
        </div>
      </div>
    );
  }

  const kind = detectKindFromProduct(product);

  return <ProductForm kind={kind} mode="edit" productId={id} initialProduct={product} />;
}
