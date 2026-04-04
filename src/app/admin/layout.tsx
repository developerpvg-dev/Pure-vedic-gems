'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, LayoutDashboard, LogOut, Gem, CircleDollarSign, Menu, X, Palette, Award, Sparkles, ShoppingCart } from 'lucide-react';

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Gem Categories', icon: Gem },
  { href: '/admin/metals', label: 'Metals & Pricing', icon: CircleDollarSign },
  { href: '/admin/designs', label: 'Setting Types & Designs', icon: Palette },
  { href: '/admin/certifications', label: 'Certifications', icon: Award },
  { href: '/admin/energizations', label: 'Energization / Pooja', icon: Sparkles },
];

function NavContent({ pathname, setSidebarOpen }: { pathname: string; setSidebarOpen: (v: boolean) => void }) {
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-5">
        <Link href="/admin" className="text-lg font-bold text-gray-900">
          PVG Admin
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="mt-4 flex flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
          Back to Site
        </Link>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on desktop, slide-over on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent pathname={pathname ?? ''} setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-60">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-gray-900">PVG Admin</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
