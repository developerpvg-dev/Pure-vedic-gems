import Link from 'next/link';
import { Package, Plus, Gem, CircleDollarSign, Palette } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your PureVedicGems store.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/products"
          className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Products</h3>
            <p className="mt-0.5 text-sm text-gray-500">View, add, and manage gemstone inventory</p>
          </div>
        </Link>

        <Link
          href="/admin/categories"
          className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
            <Gem className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Gem Categories</h3>
            <p className="mt-0.5 text-sm text-gray-500">Manage Navaratna &amp; Upratna categories</p>
          </div>
        </Link>

        <Link
          href="/admin/metals"
          className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Metals &amp; Pricing</h3>
            <p className="mt-0.5 text-sm text-gray-500">Set metal prices used in the configurator</p>
          </div>
        </Link>

        <Link
          href="/admin/designs"
          className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Setting Types &amp; Designs</h3>
            <p className="mt-0.5 text-sm text-gray-500">Manage jewelry designs for Ring, Pendant, Bracelet</p>
          </div>
        </Link>

        <Link
          href="/admin/products/new"
          className="flex items-start gap-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Add Product</h3>
            <p className="mt-0.5 text-sm text-gray-500">Create a new gemstone listing</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
