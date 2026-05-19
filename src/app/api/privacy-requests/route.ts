import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';

const privacyRequestSchema = z.object({
  request_type: z.enum(['data_export', 'data_deletion', 'data_correction', 'consent_withdrawal', 'marketing_unsubscribe']),
  full_name: z.string().trim().min(2).max(220),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().max(30).optional().default(''),
  message: z.string().trim().max(2000).optional().default(''),
});

function sha256(value: string) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`privacy:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many privacy requests. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = privacyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from<{ id: string; status: string; due_at: string }[]>('privacy_requests')
    .insert({
      ...parsed.data,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      email_hash: sha256(parsed.data.email),
      metadata: {
        source: 'privacy_policy_page',
        ip,
        user_agent: request.headers.get('user-agent') || null,
      },
    })
    .select('id, status, due_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Unable to submit privacy request right now.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, request: data }, { status: 201 });
}