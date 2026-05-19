'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, LayoutDashboard, LogOut, Gem, CircleDollarSign, Menu, X, Palette, Award, Sparkles, ShoppingCart, MessageSquare, IndianRupee, Settings, UploadCloud, SlidersHorizontal, Star, Bell, Users, CalendarClock, Scale } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const NAV_GROUPS = [
  {
    label: 'Overview',
    links: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Commerce',
    links: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/products/import', label: 'Bulk Import', icon: UploadCloud },
    ],
  },
  {
    label: 'Homepage Catalog',
    links: [
      { href: '/admin/categories', label: 'Section Categories', icon: Gem },
      { href: '/admin/configurations', label: 'Configurations', icon: SlidersHorizontal },
      { href: '/admin/metals', label: 'Metals & Pricing', icon: CircleDollarSign },
      { href: '/admin/designs', label: 'Setting Types & Designs', icon: Palette },
      { href: '/admin/certifications', label: 'Certifications', icon: Award },
      { href: '/admin/energizations', label: 'Energization / Pooja', icon: Sparkles },
    ],
  },
  {
    label: 'Operations',
    links: [
      { href: '/admin/leads', label: 'Leads', icon: MessageSquare },
      { href: '/admin/consultation-plans', label: 'Consultation Plans', icon: CalendarClock },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
      { href: '/admin/finance', label: 'Finance', icon: IndianRupee },
      { href: '/admin/compliance', label: 'Compliance', icon: Scale },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function NavContent({ pathname, setSidebarOpen }: { pathname: string; setSidebarOpen: (v: boolean) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5">
        <Link href="/admin" className="leading-tight" onClick={() => setSidebarOpen(false)}>
          <span className="block text-base font-bold text-gray-950">PVG Admin</span>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-700">Control Room</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell variant="admin" />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 lg:hidden"
            aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        <div className="space-y-5 pb-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {group.links.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-amber-50 text-amber-700 shadow-[inset_3px_0_0_rgba(217,119,6,0.65)]'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
                      }`}
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="shrink-0 border-t border-gray-200 bg-white p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          Back to Site
        </Link>
      </div>
    </div>
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
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent pathname={pathname ?? ''} setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-64">
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
          <div className="ml-auto">
            <NotificationBell variant="admin" />
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
