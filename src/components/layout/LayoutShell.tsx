'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from './SiteHeader';
import { Footer } from './Footer';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isHome = pathname === '/';

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {!isHome ? <Footer /> : null}
      {!isHome ? <ThemeSwitcher /> : null}
    </>
  );
}
