import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';

const Schema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

/** Password-reset emails — tight limit to stop inbox flooding. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many reset requests. Please wait 15 minutes and try again.' },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // Per-email bucket (stops one email being hammered from many IPs on this instance)
  if (!rateLimit(`forgot-email:${parsed.data.email}`, 3, 60 * 60 * 1000)) {
    // Same response as success to avoid email enumeration
    return NextResponse.json({ success: true });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get('origin') ||
    'http://localhost:3000';

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin.replace(/\/$/, '')}/account/set-password`,
  });

  // Always succeed outwardly — don't reveal whether the email exists
  if (error) {
    console.warn('[forgot-password]', error.message);
  }

  return NextResponse.json({ success: true });
}
