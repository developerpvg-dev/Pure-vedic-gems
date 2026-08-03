import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enquiryCreateSchema } from '@/lib/validators/enquiry';
import { sendEnquiryEmails } from '@/lib/resend/send-enquiry';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { duplicateNotifySuffix, findPriorDuplicateMatches } from '@/lib/leads/duplicates';
import { logLeadActivity } from '@/lib/leads/assign';

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
    .select('id, lead_number, date_of_birth, birth_time, birth_place, created_at')
    .single();

  if (error) {
    console.error('Enquiry insert error:', error);
    return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 });
  }

  const matches = await findPriorDuplicateMatches(admin, {
    id: data.id,
    lead_number: data.lead_number,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    date_of_birth: parsed.data.date_of_birth || null,
    birth_time: parsed.data.birth_time || null,
    birth_place: parsed.data.birth_place || null,
    created_at: data.created_at,
  });
  const dupeNote = duplicateNotifySuffix(matches);
  if (matches[0]) {
    void logLeadActivity(admin, {
      enquiryId: data.id,
      action: 'duplicate_detected',
      toValue: matches[0].status,
      meta: {
        prior_id: matches[0].id,
        prior_lead_number: matches[0].lead_number,
        matched_fields: matches[0].matched_fields,
        prior_telecaller: matches[0].telecaller_name,
      },
      actorName: 'system',
    });
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
        title: dupeNote
          ? `${dupeNote.split(' ·')[0]} — assign telecaller`
          : parsed.data.source === 'contact_form'
            ? 'New contact message — assign telecaller'
            : 'New enquiry — assign telecaller',
        message: dupeNote
          ? `${parsed.data.name} · ${dupeNote}`
          : parsed.data.source === 'contact_form'
            ? `${parsed.data.name} sent a contact form message. Forward to any telecaller.`
            : `${parsed.data.name} submitted an enquiry. Assign a telecaller to verify.`,
        href:
          parsed.data.source === 'contact_form'
            ? `/admin/leads?kind=contact&type=enquiry&id=${data.id}`
            : `/admin/leads?type=enquiry&id=${data.id}`,
        entityType: 'enquiry',
        entityId: data.id,
        metadata: {
          source: parsed.data.source,
          subject: parsed.data.subject ?? null,
          duplicate_status: matches[0]?.status ?? null,
          prior_lead_id: matches[0]?.id ?? null,
        },
      },
    ]),
  ]);

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
