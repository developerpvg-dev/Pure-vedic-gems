import { NextResponse, type NextRequest } from 'next/server';
import { lookupLegacyRedirect } from '@/lib/legacy-redirects';

const PROTECTED_PREFIXES = ['/account', '/admin', '/studio'];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Allowlist for /_next/image?url=… passthrough (no Vercel Image Optimization bill). */
export function resolveImageOptimizerTarget(
  rawUrl: string,
  requestOrigin: string,
): { ok: true; href: string } | { ok: false; status: 400 | 403 } {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawUrl);
  } catch {
    return { ok: false, status: 400 };
  }

  // Same-site public asset
  if (decoded.startsWith('/') && !decoded.startsWith('//')) {
    return { ok: true, href: new URL(decoded, requestOrigin).href };
  }

  let target: URL;
  try {
    target = new URL(decoded);
  } catch {
    return { ok: false, status: 400 };
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return { ok: false, status: 400 };
  }

  const host = target.hostname;
  let originHost = '';
  try {
    originHost = new URL(requestOrigin).hostname;
  } catch {
    return { ok: false, status: 400 };
  }

  const allowed =
    host === originHost ||
    host.endsWith('.supabase.co') ||
    host === 'cdn.sanity.io' ||
    host === 'images.unsplash.com' ||
    host === 'img.youtube.com' ||
    host === 'i.ytimg.com';

  if (!allowed) return { ok: false, status: 403 };
  return { ok: true, href: target.href };
}

function passthroughNextImage(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== '/_next/image') return null;

  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) return new NextResponse('Bad Request', { status: 400 });

  const resolved = resolveImageOptimizerTarget(raw, request.nextUrl.origin);
  if (!resolved.ok) return new NextResponse('Bad Request', { status: resolved.status });

  // ponytail: 307 keeps method; billing stops because optimizer never runs.
  return NextResponse.redirect(resolved.href, 307);
}

export async function proxy(request: NextRequest) {
  const imageRes = passthroughNextImage(request);
  if (imageRes) return imageRes;

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
  // Include /_next/image so old optimizer URLs are redirected (no transform bill).
  matcher: [
    '/_next/image',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)',
  ],
};
