'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [pricePerCarat, setPricePerCarat] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [isDirectorsPick, setIsDirectorsPick] = useState(false);
  const [stockQty, setStockQty] = useState('1');
  const [shortDesc, setShortDesc] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/products/${id}`);
      if (!res.ok) {
        setError('Product not found');
        setLoading(false);
        return;
      }
      const data = await res.json();
      const p = data.product;
      setProduct(p);
      setName(p.name || '');
      setSku(p.sku || '');
      setPrice(String(p.price ?? ''));
      setComparePrice(String(p.compare_price ?? ''));
      setPricePerCarat(String(p.price_per_carat ?? ''));
      setInStock(p.in_stock ?? true);
      setIsActive(p.is_active ?? true);
      setFeatured(p.featured ?? false);
      setIsDirectorsPick(p.is_directors_pick ?? false);
      setStockQty(String(p.stock_quantity ?? 1));
      setShortDesc(p.short_desc ?? '');
      setLoading(false);
    })();
  }, [id]);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sku,
          price: parseFloat(price) || 0,
          compare_price: comparePrice ? parseFloat(comparePrice) : undefined,
          price_per_carat: pricePerCarat ? parseFloat(pricePerCarat) : undefined,
          in_stock: inStock,
          is_active: isActive,
          featured,
          is_directors_pick: isDirectorsPick,
          stock_quantity: parseInt(stockQty) || 1,
          short_desc: shortDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update');
        setSaving(false);
        return;
      }
      router.push('/admin/products');
    } catch {
      setError('Network error');
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm('Deactivate this product? It will be hidden from the site.')) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/products');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">{error || 'Product not found'}</p>
        <Link href="/admin/products" className="mt-4 inline-block text-amber-600 hover:underline">← Back to products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/admin/products" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-500">{(product as Record<string, unknown>).slug as string}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">SKU</label>
            <input value={sku} onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price (₹)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Compare Price (₹)</label>
            <input value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} type="number"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price/Carat (₹)</label>
            <input value={pricePerCarat} onChange={(e) => setPricePerCarat(e.target.value)} type="number"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Short Description</label>
          <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Stock Quantity</label>
            <input value={stockQty} onChange={(e) => setStockQty(e.target.value)} type="number"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600" />
            <span className="text-sm text-gray-700">In Stock</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600" />
            <span className="text-sm text-gray-700">Active (visible on site)</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600" />
            <span className="text-sm text-gray-700">Featured</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={isDirectorsPick} onChange={(e) => setIsDirectorsPick(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600" />
            <span className="text-sm text-gray-700">Director&apos;s Pick</span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleDeactivate}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Deactivate
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
