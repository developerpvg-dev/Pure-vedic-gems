'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X, Palette, User, Loader2 } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const DESIGNER_NAV = [
  { href: '/admin/designer', label: 'Design Assignments', icon: Palette },
  { href: '/admin/designer/profile', label: 'My Profile', icon: User },
];

type SessionInfo = {
  role: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

function DesignerNav({
  pathname,
  session,
  setSidebarOpen,
}: {
  pathname: string;
  session: SessionInfo;
  setSidebarOpen: (v: boolean) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin/designer/profile" className="flex min-w-0 items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-indigo-100 bg-indigo-50">
              {session.avatar_url ? (
                <Image src={session.avatar_url} alt={session.name ?? 'Designer'} fill className="object-cover" unoptimized />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-indigo-500">
                  <User className="h-5 w-5" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{session.name || 'Designer'}</p>
              <p className="truncate text-xs text-gray-500">{session.email}</p>
            </div>
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
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {DESIGNER_NAV.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin/designer' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-[inset_3px_0_0_rgba(79,70,229,0.65)]'
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

export function DesignerAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/session');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setSession({
        role: data.role,
        name: data.name ?? null,
        email: data.email ?? null,
        avatar_url: data.avatar_url ?? null,
      });
    })();
  }, []);

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
        {session ? (
          <DesignerNav pathname={pathname ?? ''} session={session} setSidebarOpen={setSidebarOpen} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col lg:ml-64">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-semibold text-gray-900">{session?.name || 'Designer'}</span>
          <div className="ml-auto">
            <NotificationBell variant="admin" />
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
