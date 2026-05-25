import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const replySchema = z.object({
  feedback_id: z.string().uuid(),
  name: z.string().trim().min(2).max(180),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(3).max(1500),
});

const rateMap = new Map<string, { count: number; resetAt: number }>();

function isAllowed(ip: string) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!isAllowed(ip)) {
    return NextResponse.json({ error: 'Too many replies. Please try again shortly.' }, { status: 429 });
  }

  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reply details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: feedback } = await admin
    .from('feedback_submissions')
    .select('id')
    .eq('id', parsed.data.feedback_id)
    .eq('status', 'approved')
    .eq('allow_display', true)
    .single();

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback is not available for replies' }, { status: 404 });
  }

  const { data, error } = await admin
    .from('feedback_replies')
    .insert({
      feedback_id: parsed.data.feedback_id,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      status: 'approved',
    })
    .select('id, feedback_id, name, message, status, created_at, updated_at')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to submit reply' }, { status: 500 });
  return NextResponse.json({ reply: data }, { status: 201 });
}