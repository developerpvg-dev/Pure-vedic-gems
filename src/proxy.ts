import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import {
  canAccessStudio,
  getAdminRoutePermission,
  hasAdminPermission,
  normalizeAdminRole,
} from '@/lib/admin/rbac';
import { getScopedRoleDashboard, isScopedRolePathAllowed } from '@/lib/admin/role-dashboards';
import { getShortLivedCache } from '@/lib/cache/short-lived';

const PROTECTED_CUSTOMER_ROUTES = ['/account'];
const PROTECTED_ADMIN_ROUTES = ['/admin'];
const PROTECTED_STUDIO_ROUTES = ['/studio'];

// Profile/team lookups are cached briefly so page navigations within the
// admin panel or account area don't repeat the same DB query on every hop.
// Status/role changes take effect within this window.
const AUTH_LOOKUP_TTL_MS = 60_000;

function isProtectedRoute(pathname: string) {
  return (
    PROTECTED_CUSTOMER_ROUTES.some((prefix) => pathname.startsWith(prefix)) ||
    PROTECTED_ADMIN_ROUTES.some((prefix) => pathname.startsWith(prefix)) ||
    PROTECTED_STUDIO_ROUTES.some((prefix) => pathname.startsWith(prefix))
  );
}

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function getTeamMember(userId: string) {
  return getShortLivedCache(`proxy-team:${userId}`, AUTH_LOOKUP_TTL_MS, async () => {
    const { data } = await createServiceClient()
      .from('team_members')
      .select('role, is_active, permissions')
      .eq('id', userId)
      .single();
    return data;
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next({ request });
  }

  // Stamp the pathname so server components/layouts (which can't read the URL
  // path directly) can branch on it — used by the account layout to keep public
  // auth-recovery pages reachable without a session.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-account-path', pathname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isCustomerRoute = PROTECTED_CUSTOMER_ROUTES.some((prefix) => pathname.startsWith(prefix));
  // Public auth-recovery pages under /account that must remain reachable
  // without a session (otherwise users who can't log in could never reset).
  const PUBLIC_CUSTOMER_PATHS = new Set([
    '/account/forgot-password',
  ]);

  if (isCustomerRoute && !user && !PUBLIC_CUSTOMER_PATHS.has(pathname)) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('auth', 'login');
    return NextResponse.redirect(loginUrl);
  }

  if (isCustomerRoute && user) {
    const profile = await getShortLivedCache(`proxy-profile:${user.id}`, AUTH_LOOKUP_TTL_MS, async () => {
      const { data } = await createServiceClient()
        .from('customer_profiles')
        .select('account_status, requires_password_reset')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    });

    if (profile?.account_status && profile.account_status !== 'active') {
      await supabase.auth.signOut();
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('auth', 'login');
      loginUrl.searchParams.set('account', profile.account_status);
      return NextResponse.redirect(loginUrl);
    }

    // Legacy WordPress migration: force a one-time password reset before the
    // customer can reach any account page. The set-password page itself is the
    // only /account route they're allowed to see while flagged.
    if (profile?.requires_password_reset && pathname !== '/account/set-password') {
      const resetUrl = new URL('/account/set-password', request.url);
      resetUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(resetUrl);
    }
  }

  const isAdminRoute = PROTECTED_ADMIN_ROUTES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminRoute) {
    if (pathname.startsWith('/admin/join')) {
      return response;
    }

    if (!user) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('auth', 'login');
      return NextResponse.redirect(loginUrl);
    }

    const teamMember = await getTeamMember(user.id);

    if (!teamMember?.is_active) {
      return NextResponse.redirect(new URL('/account', request.url));
    }

    const normalizedRole = normalizeAdminRole(teamMember.role);
    if (normalizedRole === 'seo_cms') {
      return NextResponse.redirect(new URL('/studio', request.url));
    }
    if (normalizedRole === 'designer') {
      const allowed =
        pathname.startsWith('/admin/designer') ||
        pathname.startsWith('/admin/join');
      if (!allowed) {
        return NextResponse.redirect(new URL('/admin/designer', request.url));
      }
    }
    if (normalizedRole === 'content') {
      // Dashboard + ops/finance/leads paths — keep catalog/content + currency settings
      const blocked =
        pathname === '/admin' ||
        pathname.startsWith('/admin/orders/new') ||
        pathname.startsWith('/admin/commissions') ||
        pathname.startsWith('/admin/design-jobs') ||
        pathname.startsWith('/admin/rewards') ||
        pathname.startsWith('/admin/leads') ||
        pathname.startsWith('/admin/agent-sessions') ||
        pathname.startsWith('/admin/finance') ||
        pathname.startsWith('/admin/compliance');
      if (blocked) {
        return NextResponse.redirect(new URL('/admin/products', request.url));
      }
    }
    // Products Uploading / Accountant: orders are read-only (no POS create)
    if (
      (normalizedRole === 'inventory' || normalizedRole === 'finance') &&
      pathname.startsWith('/admin/orders/new')
    ) {
      return NextResponse.redirect(new URL('/admin/orders', request.url));
    }
    if (normalizedRole === 'stock_manager') {
      const allowed =
        pathname.startsWith('/admin/orders') ||
        pathname.startsWith('/admin/customers') ||
        pathname.startsWith('/admin/commissions') ||
        pathname.startsWith('/admin/design-jobs') ||
        pathname.startsWith('/admin/rewards') ||
        pathname.startsWith('/admin/join');
      if (!allowed) {
        return NextResponse.redirect(new URL('/admin/orders', request.url));
      }
    }

    const scopedDash = getScopedRoleDashboard(normalizedRole);
    if (scopedDash && !isScopedRolePathAllowed(normalizedRole, pathname)) {
      return NextResponse.redirect(new URL(scopedDash.home, request.url));
    }

    const requiredPermission = getAdminRoutePermission(pathname);
    if (!hasAdminPermission(teamMember.role, requiredPermission, teamMember.permissions)) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  const isStudioRoute = PROTECTED_STUDIO_ROUTES.some((prefix) => pathname.startsWith(prefix));
  if (isStudioRoute) {
    if (!user) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('auth', 'login');
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const teamMember = await getTeamMember(user.id);
    if (!teamMember?.is_active || !canAccessStudio(teamMember.role)) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/studio', '/studio/:path*'],
};
