import { NextResponse, type NextRequest } from 'next/server';
import { lookupLegacyRedirect } from '@/lib/legacy-redirects';

const PROTECTED_PREFIXES = ['/account', '/admin', '/studio'];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bulk WP legacy redirects — kept out of next.config (Vercel route limit).
  const dest = lookupLegacyRedirect(pathname);
  if (dest) {
    const url = request.nextUrl.clone();
    url.pathname = dest;
    return NextResponse.redirect(url, 301);
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next({ request });
  }

  const { handleAuthProxy } = await import('./proxy-auth');
  return handleAuthProxy(request);
}

export const config = {
  // ponytail: broad matcher for legacy redirects; auth still gated above.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)',
  ],
};
