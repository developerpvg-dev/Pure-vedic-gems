import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email').max(255),
  name: z.string().trim().max(180).optional(),
  source: z.string().trim().max(80).optional(),
});

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`newsletter:${ip}`, 6, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many signup attempts. Please wait a minute and try again.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid newsletter signup', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('newsletter_subscribers')
    .upsert({
      email: parsed.data.email,
      name: parsed.data.name || null,
      status: 'subscribed',
      source: parsed.data.source || 'footer',
      consent_source: 'website_newsletter_form',
      consent_text: 'User submitted the website newsletter signup form.',
      subscribed_at: now,
      unsubscribed_at: null,
      ip_hash: hashIp(ip),
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
      updated_at: now,
    }, { onConflict: 'email' })
    .select('id, status')
    .single();

  if (error || !data) {
    console.error('[Newsletter] Signup failed:', error);
    return NextResponse.json({ error: 'Unable to subscribe right now.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: data.status }, { headers: { 'Cache-Control': 'no-store' } });
}
