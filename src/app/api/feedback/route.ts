import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const feedbackSchema = z.object({
  name: z.string().trim().min(2).max(180),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  location: z.string().trim().max(140).optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5).default(5),
  subject: z.string().trim().max(220).optional().or(z.literal('')),
  message: z.string().trim().min(10).max(4000),
  allow_display: z.boolean().default(true),
});

const rateMap = new Map<string, { count: number; resetAt: number }>();

function isAllowed(ip: string) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!isAllowed(ip)) {
    return NextResponse.json({ error: 'Too many feedback submissions. Please try again shortly.' }, { status: 429 });
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid feedback details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('feedback_submissions')
    .insert({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      location: parsed.data.location || null,
      rating: parsed.data.rating,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
      allow_display: parsed.data.allow_display,
      status: 'pending',
    })
    .select('id, status')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  return NextResponse.json({ feedback: data, status: 'pending_moderation' }, { status: 201 });
}
