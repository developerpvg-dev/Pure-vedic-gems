import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enquiryCreateSchema } from '@/lib/validators/enquiry';
import { sendEnquiryEmails } from '@/lib/resend/send-enquiry';
import { createInAppNotifications } from '@/lib/notifications/in-app';

// Simple in-memory rate limiter (per IP, 3 requests per minute)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = enquiryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const geo =
    request.headers.get('x-vercel-ip-city') && request.headers.get('x-vercel-ip-country')
      ? `${request.headers.get('x-vercel-ip-city')}, ${request.headers.get('x-vercel-ip-country')}`
      : parsed.data.ip_location || null;

  const { data, error } = await admin
    .from('enquiries')
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
      product_id: parsed.data.product_id || null,
      source: parsed.data.source,
      status: 'new',
      pipeline_stage: 'new',
      enquiry_type: parsed.data.enquiry_type || parsed.data.subject || 'Enquiry',
      date_of_birth: parsed.data.date_of_birth || null,
      birth_time: parsed.data.birth_time || null,
      birth_place: parsed.data.birth_place || null,
      area_of_concern: parsed.data.area_of_concern || null,
      ip_location: geo,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Enquiry insert error:', error);
    return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 });
  }

  void Promise.allSettled([
    sendEnquiryEmails({
      id: data.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
      source: parsed.data.source,
      productId: parsed.data.product_id || null,
    }),
    createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'sales',
        type: 'new_enquiry',
        title: 'New enquiry — assign telecaller',
        message: `${parsed.data.name} submitted an enquiry. Assign a telecaller to verify.`,
        href: `/admin/leads?type=enquiry&id=${data.id}`,
        entityType: 'enquiry',
        entityId: data.id,
        metadata: { source: parsed.data.source, subject: parsed.data.subject ?? null },
      },
    ]),
  ]);

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
