import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/validators/auth';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // 5 login attempts per minute per IP
  if (!rateLimit(`login:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // ── Email + Password ────────────────────────────────────────────────────────
  if (parsed.data.type === 'email') {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) {
      // Use a generic message to avoid user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }
    return NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
    });
  }

  // ── Phone OTP Request ───────────────────────────────────────────────────────
  if (parsed.data.type === 'otp_request') {
    const { error } = await supabase.auth.signInWithOtp({
      phone: parsed.data.phone,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone number.',
    });
  }

  // ── Magic Link ──────────────────────────────────────────────────────────────
  if (parsed.data.type === 'magic_link') {
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/account`,
      },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email inbox.',
    });
  }

  return NextResponse.json({ error: 'Invalid login type.' }, { status: 400 });
}
