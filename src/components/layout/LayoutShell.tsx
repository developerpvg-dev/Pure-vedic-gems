'use client';

import { usePathname } from 'next/navigation';
import { StickyContactRail } from './StickyContactRail';
import { SiteHeader } from './SiteHeader';
import { Footer } from './Footer';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isHome = pathname === '/';
  const usesReferenceTheme = [
    '/policies',
    '/account',
    '/consultation',
    '/configure',
    '/tools',
    '/knowledge',
    '/blog',
    '/about',
    '/contact',
    '/track-order',
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const shellClassName = [
    'flex-1',
    usesReferenceTheme ? 'pvg-reference-theme' : null,
    pathname === '/policies' || pathname.startsWith('/policies/') ? 'pvg-policy-theme' : null,
  ]
    .filter(Boolean)
    .join(' ');

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className={shellClassName}>{children}</main>
      <StickyContactRail />
      <Footer />
      {!isHome ? <ThemeSwitcher /> : null}
    </>
  );
}
