'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Package, LayoutDashboard, LogOut, Gem, CircleDollarSign, Menu, X, Palette, Award, Sparkles, ShoppingCart, MessageSquare, IndianRupee, Settings, UploadCloud, SlidersHorizontal, Star, Bell, Users, CalendarClock, Scale, Video, FileBadge2, Flame, Gift, Images, Loader2, Store, Bot, ClipboardList, FileEdit } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { DesignerAdminLayout } from '@/components/admin/DesignerAdminLayout';
import { StockManagerAdminLayout } from '@/components/admin/StockManagerAdminLayout';
import { RoleScopedAdminLayout } from '@/components/admin/RoleScopedAdminLayout';
import { getScopedRoleDashboard } from '@/lib/admin/role-dashboards';
import { useAuth } from '@/lib/hooks/useAuth';

const NAV_GROUPS = [
  {
    label: 'Overview',
    links: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: 'exact' as const }],
  },
  {
    label: 'Commerce',
    links: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: 'prefix' as const },
      { href: '/admin/design-jobs', label: 'Design Jobs', icon: Palette, match: 'prefix' as const },
      { href: '/admin/customers', label: 'Customers', icon: Users, match: 'prefix' as const },
      { href: '/admin/rewards', label: 'Rewards', icon: Gift, match: 'prefix' as const },
      { href: '/admin/products', label: 'Products', icon: Package, match: 'products' as const },
      { href: '/admin/products?status=inactive', label: 'Drafts', icon: FileEdit, match: 'drafts' as const },
      { href: '/admin/catalog-order', label: 'Catalog Order', icon: SlidersHorizontal, match: 'prefix' as const },
      { href: '/admin/directors-pick', label: "Director's Pick", icon: Star, match: 'prefix' as const },
      { href: '/admin/yagyas', label: 'Vedic Yagyas', icon: Flame, match: 'prefix' as const },
      { href: '/admin/yagya-bookings', label: 'Yagya Bookings', icon: Flame, match: 'prefix' as const },
      { href: '/admin/products/import', label: 'Bulk Import', icon: UploadCloud, match: 'prefix' as const },
      { href: '/admin/stock', label: 'Stock Dashboard', icon: LayoutDashboard, match: 'exact' as const },
      { href: '/admin/stock/completeness', label: 'Content Gaps', icon: ClipboardList, match: 'prefix' as const },
      { href: '/admin/erp-sync', label: 'Store ERP Sync', icon: Store, match: 'prefix' as const },
    ],
  },
  {
    label: 'Homepage Catalog',
    links: [
      { href: '/admin/hero', label: 'Hero Slideshow', icon: Images, match: 'prefix' as const },
      { href: '/admin/categories', label: 'Section Categories', icon: Gem, match: 'prefix' as const },
      { href: '/admin/shop-category-pages', label: 'Category Hub Pages', icon: Sparkles, match: 'prefix' as const },
      { href: '/admin/configurations', label: 'Configurations', icon: SlidersHorizontal, match: 'prefix' as const },
      { href: '/admin/metals', label: 'Metals & Pricing', icon: CircleDollarSign, match: 'prefix' as const },
      { href: '/admin/designs', label: 'Jewelry Designs', icon: Palette, match: 'prefix' as const },
      { href: '/admin/certifications', label: 'Certifications', icon: Award, match: 'prefix' as const },
      { href: '/admin/energizations', label: 'Energization / Pooja', icon: Sparkles, match: 'prefix' as const },
    ],
  },
  {
    label: 'Operations',
    links: [
      { href: '/admin/leads', label: 'Leads', icon: MessageSquare, match: 'prefix' as const },
      { href: '/admin/agent-sessions', label: 'Ratna AI Sessions', icon: Bot, match: 'prefix' as const },
      { href: '/admin/consultation-plans', label: 'Consultation Plans', icon: CalendarClock, match: 'prefix' as const },
      { href: '/admin/reviews', label: 'Product Reviews', icon: Star, match: 'prefix' as const },
      { href: '/admin/category-reviews', label: 'Category Reviews', icon: Star, match: 'prefix' as const },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell, match: 'prefix' as const },
      { href: '/admin/finance', label: 'Finance', icon: IndianRupee, match: 'prefix' as const },
      { href: '/admin/compliance', label: 'Compliance', icon: Scale, match: 'prefix' as const },
      { href: '/admin/settings', label: 'Settings', icon: Settings, match: 'prefix' as const },
    ],
  },
  {
    label: 'Content Pages',
    links: [
      { href: '/admin/events', label: 'Events & Videos', icon: Video, match: 'prefix' as const },
      { href: '/admin/videos', label: 'Video Library', icon: Video, match: 'prefix' as const },
      { href: '/admin/lab-certificates', label: 'Lab Certificates', icon: FileBadge2, match: 'prefix' as const },
      { href: '/admin/testimonials', label: 'Testimonials', icon: Star, match: 'prefix' as const },
      { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare, match: 'prefix' as const },
    ],
  },
];

function navLinkActive(
  pathname: string | null,
  searchParams: URLSearchParams,
  href: string,
  match: 'exact' | 'prefix' | 'products' | 'drafts',
) {
  if (match === 'exact') return pathname === href;
  if (match === 'drafts') return pathname === '/admin/products' && searchParams.get('status') === 'inactive';
  if (match === 'products') {
    if (!pathname?.startsWith('/admin/products')) return false;
    if (pathname.startsWith('/admin/products/import')) return false;
    return !(pathname === '/admin/products' && searchParams.get('status') === 'inactive');
  }
  return pathname === href || Boolean(pathname?.startsWith(href));
}

function AdminNavContent({
  pathname,
  searchParams,
  setSidebarOpen,
  role,
}: {
  pathname: string;
  searchParams: URLSearchParams;
  setSidebarOpen: (v: boolean) => void;
  role: string | null;
}) {
  const { signOut } = useAuth();
  const router = useRouter();
  const isWebsiteMaintenance = role === 'content';
  const brand = isWebsiteMaintenance ? 'Website Maintenance' : 'PVG Admin';
  const navGroups = isWebsiteMaintenance
    ? NAV_GROUPS.map((group) => ({
        ...group,
        links: group.links.filter((link) => link.href !== '/admin/settings'),
      })).filter((group) => group.links.length > 0)
    : NAV_GROUPS;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5">
        <Link href="/admin" className="leading-tight" onClick={() => setSidebarOpen(false)}>
          <span className="block text-base font-bold text-gray-950">{brand}</span>
          {isWebsiteMaintenance ? (
            <span className="block text-xs text-gray-500">Content & site updates</span>
          ) : null}
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
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {group.links.map((link) => {
                  const isActive = navLinkActive(pathname, searchParams, link.href, link.match);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        setSidebarOpen(false);
                        // products page only reads ?status on mount
                        if (link.match === 'drafts' || link.match === 'products') {
                          e.preventDefault();
                          window.location.assign(link.href);
                        }
                      }}
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
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionRole, setSessionRole] = useState<string | null>(null);
  const pathname = usePathname();
  const isJoinPage = pathname?.startsWith('/admin/join');
  const isDesignerRoute = pathname?.startsWith('/admin/designer');

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/session');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setSessionRole(data.role ?? null);
    })();
  }, []);

  if (isJoinPage) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  if (sessionRole === 'designer' || (sessionRole === null && isDesignerRoute)) {
    return <DesignerAdminLayout>{children}</DesignerAdminLayout>;
  }

  if (sessionRole === 'stock_manager') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <StockManagerAdminLayout>{children}</StockManagerAdminLayout>
      </Suspense>
    );
  }

  const scopedDash = getScopedRoleDashboard(sessionRole);
  if (scopedDash) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <RoleScopedAdminLayout config={scopedDash}>{children}</RoleScopedAdminLayout>
      </Suspense>
    );
  }

  if (sessionRole === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AdminShell
        pathname={pathname ?? ''}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        role={sessionRole}
      >
        {children}
      </AdminShell>
    </Suspense>
  );
}

function AdminShell({
  children,
  pathname,
  sidebarOpen,
  setSidebarOpen,
  role,
}: {
  children: React.ReactNode;
  pathname: string;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  role: string | null;
}) {
  const searchParams = useSearchParams();
  const brand = role === 'content' ? 'Website Maintenance' : 'PVG Admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white transition-transform duration-200 print:hidden lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminNavContent
          pathname={pathname}
          searchParams={searchParams}
          setSidebarOpen={setSidebarOpen}
          role={role}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 print:hidden lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-gray-900">{brand}</span>
          <div className="ml-auto">
            <NotificationBell variant="admin" />
          </div>
        </div>

        <main className="min-w-0 flex-1 p-4 print:p-0 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
