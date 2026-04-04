import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Routes that require authentication (customer sessions)
const PROTECTED_CUSTOMER_ROUTES = ['/account'];

// Routes that require admin role
const PROTECTED_ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Build a Supabase server client that can read/refresh cookies ──────────
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always refresh session (keeps JWT alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Protect /account/* ────────────────────────────────────────────────────
  const isCustomerRoute = PROTECTED_CUSTOMER_ROUTES.some((p) =>
    pathname.startsWith(p)
  );
  if (isCustomerRoute && !user) {
    // Redirect to home with a query param to open login modal
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('auth', 'login');
    return NextResponse.redirect(loginUrl);
  }

  // ── Protect /admin/* ──────────────────────────────────────────────────────
  const isAdminRoute = PROTECTED_ADMIN_ROUTES.some((p) =>
    pathname.startsWith(p)
  );
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('auth', 'login');
      return NextResponse.redirect(loginUrl);
    }

    // Check team_members using service role to bypass RLS
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: teamMember } = await adminClient
      .from('team_members')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!teamMember?.is_active) {
      // Not a team member — redirect to account
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico & public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
