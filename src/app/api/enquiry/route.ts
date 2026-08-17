import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enquiryCreateSchema } from '@/lib/validators/enquiry';
import { sendEnquiryEmails } from '@/lib/resend/send-enquiry';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { duplicateNotifySuffix, findPriorDuplicateMatches } from '@/lib/leads/duplicates';
import { logLeadActivity } from '@/lib/leads/assign';
import { rateLimit } from '@/lib/utils/rate-limit';
import { isBotSpam, isTurnstileInvalid } from '@/lib/enquiry/spam-guard';
import { isTurnstileProductionHost } from '@/lib/enquiry/turnstile-host';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`enquiry:${ip}`, 3, 60_000)) {
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

  const emailKey = parsed.data.email?.trim().toLowerCase();
  if (emailKey && !rateLimit(`enquiry-email:${emailKey}`, 2, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const host = request.headers.get('host') ?? '';
  const skipTurnstile = !isTurnstileProductionHost(host);
  const remoteIp = ip !== 'unknown' ? ip : undefined;

  if (isBotSpam(parsed.data)) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  if (await isTurnstileInvalid(parsed.data, remoteIp, { skipTurnstile })) {
    return NextResponse.json(
      { error: 'Please complete the security check and try again.' },
      { status: 403 }
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
          ? `${dupeNote.split(' ·')[0]} — review lead`
          : parsed.data.source === 'contact_form'
            ? 'New contact message — assign telecaller'
            : parsed.data.source === 'blog_popup' || parsed.data.source === 'blog_sidebar'
              ? 'New blog enquiry'
              : 'New enquiry — assign telecaller',
        message: dupeNote
          ? `${parsed.data.name} · ${dupeNote}`
          : parsed.data.source === 'contact_form'
            ? `${parsed.data.name} sent a contact form message. Forward to any telecaller.`
            : parsed.data.source === 'blog_popup' || parsed.data.source === 'blog_sidebar'
              ? `${parsed.data.name} submitted a blog Ask-an-expert enquiry.`
              : `${parsed.data.name} submitted an enquiry. Assign a telecaller to verify.`,
        href:
          parsed.data.source === 'contact_form'
            ? `/admin/leads?kind=contact&type=enquiry&id=${data.id}`
            : parsed.data.source === 'blog_popup' || parsed.data.source === 'blog_sidebar'
              ? `/admin/leads?kind=blog&type=enquiry&id=${data.id}`
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
