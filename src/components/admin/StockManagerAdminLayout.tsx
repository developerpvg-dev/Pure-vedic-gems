'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, FileEdit, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Store, X } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/lib/hooks/useAuth';

const STOCK_NAV = [
  { href: '/admin/stock', label: 'Stock dashboard', icon: LayoutDashboard, match: 'exact' as const },
  { href: '/admin/stock/completeness', label: 'Content gaps', icon: ClipboardList, match: 'prefix' as const },
  { href: '/admin/erp-sync', label: 'Store sync', icon: Store, match: 'prefix' as const },
  { href: '/admin/orders', label: 'Online orders', icon: ShoppingBag, match: 'prefix' as const },
  { href: '/admin/products', label: 'Products', icon: Package, match: 'products' as const },
  { href: '/admin/products?status=inactive', label: 'Drafts', icon: FileEdit, match: 'drafts' as const },
];

export function StockManagerAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/session');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setName(data.name ?? 'Order / Stock Incharge');
    })();
  }, []);

  function navActive(match: (typeof STOCK_NAV)[number]['match'], href: string) {
    if (match === 'exact') return pathname === href;
    if (match === 'prefix') return pathname === href || Boolean(pathname?.startsWith(href));
    if (match === 'drafts') return pathname === '/admin/products' && searchParams.get('status') === 'inactive';
    // products: any products path except draft list
    if (!pathname?.startsWith('/admin/products')) return false;
    return !(pathname === '/admin/products' && searchParams.get('status') === 'inactive');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5">
            <Link href="/admin/stock" className="leading-tight" onClick={() => setSidebarOpen(false)}>
              <span className="block text-base font-bold text-gray-950">Order / Stock Incharge</span>
              <span className="block text-xs text-gray-500">Offline ↔ website stock</span>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell variant="admin" />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {STOCK_NAV.map((link) => {
                const isActive = navActive(link.match, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      setSidebarOpen(false);
                      // products page only reads ?status on mount; force load for drafts filter
                      if (link.match === 'drafts' || link.match === 'products') {
                        e.preventDefault();
                        window.location.assign(link.href);
                      }
                    }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-50 text-amber-800 shadow-[inset_3px_0_0_rgba(217,119,6,0.65)]'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
                    }`}
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="shrink-0 border-t border-gray-200 p-3">
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push('/');
                router.refresh();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:ml-64">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-semibold text-gray-900">{name || 'Stock Manager'}</span>
          <div className="ml-auto">
            <NotificationBell variant="admin" />
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
