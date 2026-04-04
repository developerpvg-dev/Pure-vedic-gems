import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/lib/validators/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // 3 registrations per 5 minutes per IP
  if (!rateLimit(`reg:${ip}`, 3, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a few minutes.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password, full_name, phone } = parsed.data;
  const supabase = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone: phone ?? null },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/account`,
    },
  });

  if (authError) {
    // Surface duplicate email as a 409
    if (
      authError.code === 'user_already_exists' ||
      authError.message?.toLowerCase().includes('already registered') ||
      authError.message?.toLowerCase().includes('already been registered')
    ) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }

  // Ensure customer_profiles row exists (DB trigger does this too, belt-and-suspenders)
  await (supabase as any)
    .from('customer_profiles')
    .upsert(
      {
        id: authData.user.id,
        full_name,
        email,
        phone: phone ?? null,
        whatsapp: phone ?? null,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );

  return NextResponse.json({
    success: true,
    message: authData.session
      ? 'Account created successfully.'
      : 'Account created! Please check your email to verify your account.',
    user: { id: authData.user.id, email: authData.user.email },
    requires_email_verification: !authData.session,
  });
}
