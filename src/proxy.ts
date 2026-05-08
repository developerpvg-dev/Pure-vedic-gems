import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminRoutePermission, hasAdminPermission } from '@/lib/admin/rbac';

const PROTECTED_CUSTOMER_ROUTES = ['/account'];
const PROTECTED_ADMIN_ROUTES = ['/admin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  const isAdminRoute = PROTECTED_ADMIN_ROUTES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('auth', 'login');
      return NextResponse.redirect(loginUrl);
    }

    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: teamMember } = await adminClient
      .from('team_members')
      .select('role, is_active, permissions')
      .eq('id', user.id)
      .single();

    if (!teamMember?.is_active) {
      return NextResponse.redirect(new URL('/account', request.url));
    }

    const requiredPermission = getAdminRoutePermission(pathname);
    if (!hasAdminPermission(teamMember.role, requiredPermission, teamMember.permissions)) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};