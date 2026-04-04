import { NextRequest, NextResponse } from 'next/server';
import { OTPSchema } from '@/lib/validators/auth';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // 5 OTP verifications per minute per IP
  if (!rateLimit(`otp:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = OTPSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token,
    type: 'sms',
  });

  if (error) {
    return NextResponse.json(
      { error: 'Invalid or expired OTP. Please try again.' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      phone: data.user?.phone,
    },
  });
}
