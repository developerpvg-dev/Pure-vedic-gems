'use client';

import { usePathname } from 'next/navigation';
import { StickyContactRail } from './StickyContactRail';
import { SiteHeader } from './SiteHeader';
import { Footer } from './Footer';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { AgentChatWidget } from '@/components/agent/AgentChatWidget';
import { isAgentUiEnabled } from '@/lib/agent/config';
import { CurrencyProvider } from '@/lib/hooks/useCurrency';

/** Routes that already reserve space below the fixed header in their own layout */
function pageHasBuiltInHeaderOffset(pathname: string): boolean {
  const exact = new Set([
    '/track-order',
    '/contact',
    '/feedback',
    '/testimonials',
    '/videos',
    '/events-and-seminars',
    '/lab-certificate',
    '/consultation',
    '/vedic-yagyas-service',
  ]);

  if (exact.has(pathname)) return true;

  const prefixes = [
    '/shop',
    // WP rewrites still serve shop UI under these paths — same header offset as /shop.
    '/product-category',
    '/product/',
    '/tools/',
    '/about/experts',
    '/about/stores',
    '/knowledge',
    '/blog',
    '/account',
    '/policies',
  ];

  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isStudio = pathname.startsWith('/studio');
  const isHome = pathname === '/';
  const showHeaderSpacer = !isAdmin && !isStudio && !isHome && !pageHasBuiltInHeaderOffset(pathname);
  const usesReferenceTheme = [
    '/policies',
    '/account',
    '/consultation',
    '/tools',
    '/blog',
    '/about',
    '/track-order',
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`))
    && !pathname.startsWith('/about/experts')
    && !pathname.startsWith('/about/stores')
    && pathname !== '/track-order'
    && pathname !== '/consultation'
    && !pathname.startsWith('/tools/')
    && !pathname.startsWith('/account')
    && !pathname.startsWith('/blog');
  const shellClassName = [
    'flex-1',
    usesReferenceTheme ? 'pvg-reference-theme' : null,
    pathname === '/policies' || pathname.startsWith('/policies/') ? 'pvg-policy-theme' : null,
  ]
    .filter(Boolean)
    .join(' ');

  // Studio needs the full viewport — site header cropped its Publish/Delete menu
  if (isAdmin || isStudio) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <CurrencyProvider>
      <SiteHeader />
      {showHeaderSpacer ? <div className="pvg-header-spacer" aria-hidden="true" /> : null}
      <main className={shellClassName}>{children}</main>
      <StickyContactRail />
      {/* ponytail: skip mount+config fetch while Ratna is off — set NEXT_PUBLIC_AGENT_ENABLED=true with AGENT_ENABLED */}
      {isAgentUiEnabled() ? <AgentChatWidget /> : null}
      <Footer />
      {!isHome ? <ThemeSwitcher /> : null}
    </CurrencyProvider>
  );
}
