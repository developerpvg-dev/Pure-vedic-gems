import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminRoutePermission, hasAdminPermission, normalizeAdminRole } from '@/lib/admin/rbac';
import { getShortLivedCache } from '@/lib/cache/short-lived';

const PROTECTED_CUSTOMER_ROUTES = ['/account'];
const PROTECTED_ADMIN_ROUTES = ['/admin'];

// Profile/team lookups are cached briefly so page navigations within the
// admin panel or account area don't repeat the same DB query on every hop.
// Status/role changes take effect within this window.
const AUTH_LOOKUP_TTL_MS = 60_000;

function isProtectedRoute(pathname: string) {
  return (
    PROTECTED_CUSTOMER_ROUTES.some((prefix) => pathname.startsWith(prefix)) ||
    PROTECTED_ADMIN_ROUTES.some((prefix) => pathname.startsWith(prefix))
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isCustomerRoute = PROTECTED_CUSTOMER_ROUTES.some((prefix) => pathname.startsWith(prefix));
  if (isCustomerRoute && !user) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('auth', 'login');
    return NextResponse.redirect(loginUrl);
  }

  if (isCustomerRoute && user) {
    const profile = await getShortLivedCache(`proxy-profile:${user.id}`, AUTH_LOOKUP_TTL_MS, async () => {
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const { data } = await adminClient
        .from('customer_profiles')
        .select('account_status')
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

    const teamMember = await getShortLivedCache(`proxy-team:${user.id}`, AUTH_LOOKUP_TTL_MS, async () => {
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const { data } = await adminClient
        .from('team_members')
        .select('role, is_active, permissions')
        .eq('id', user.id)
        .single();
      return data;
    });

    if (!teamMember?.is_active) {
      return NextResponse.redirect(new URL('/account', request.url));
    }

    const normalizedRole = normalizeAdminRole(teamMember.role);
    if (normalizedRole === 'designer') {
      const allowed =
        pathname.startsWith('/admin/designer') ||
        pathname.startsWith('/admin/join');
      if (!allowed) {
        return NextResponse.redirect(new URL('/admin/designer', request.url));
      }
    }

    const requiredPermission = getAdminRoutePermission(pathname);
    if (!hasAdminPermission(teamMember.role, requiredPermission, teamMember.permissions)) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
