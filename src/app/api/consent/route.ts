import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';

const consentSchema = z.object({
  consent_type: z.enum(['cookie_analytics', 'marketing_email', 'whatsapp_updates', 'checkout_terms', 'privacy_policy', 'return_policy']),
  status: z.enum(['granted', 'denied', 'withdrawn']),
  policy_version: z.string().trim().max(40).optional(),
  email: z.string().trim().email().optional(),
  source: z.string().trim().max(80).default('website'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

function hashEmail(email?: string) {
  if (!email) return null;
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`consent:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many consent events.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const { error } = await db.from('consent_logs').insert({
    consent_type: parsed.data.consent_type,
    status: parsed.data.status,
    policy_version: parsed.data.policy_version ?? null,
    source: parsed.data.source,
    email_hash: hashEmail(parsed.data.email),
    ip_address: ip === 'unknown' ? null : ip,
    user_agent: request.headers.get('user-agent') || null,
    metadata: parsed.data.metadata,
  });

  if (error) return NextResponse.json({ error: 'Unable to record consent.' }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}