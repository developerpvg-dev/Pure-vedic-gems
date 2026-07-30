import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendRecommendationRequestEmails } from '@/lib/resend/send-recommendation-request';
import type { Json } from '@/lib/types/database';
import { rateLimit } from '@/lib/utils/rate-limit';
import { buildGemRecommendation } from '@/lib/utils/rashi-calculator';
import { duplicateNotifySuffix, findPriorDuplicateMatches } from '@/lib/leads/duplicates';
import { logLeadActivity } from '@/lib/leads/assign';

const recommendationSchema = z.object({
  name: z.string().max(200).trim().optional(),
  email: z.string().email('Invalid email').max(255).trim().optional(),
  phone: z.string().max(20).trim().optional(),
  birthDate: z.string().max(40).optional(),
  birthTime: z.string().max(40).optional(),
  birthPlace: z.string().max(160).optional(),
  rashi: z.string().max(80).optional(),
  purpose: z.string().max(80).optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`recommendation:${ip}`, 12, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many recommendation requests. Please wait a minute and try again.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recommendationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid recommendation request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const recommendation = buildGemRecommendation(parsed.data);
  let enquiryId: string | null = null;
  let adminClient: ReturnType<typeof createAdminClient> | null = null;

  if (parsed.data.email) {
    const customerName = parsed.data.name || 'Gemstone Seeker';
    const message = [
      'Homepage gemstone recommendation request',
      `Name: ${customerName}`,
      `Email: ${parsed.data.email}`,
      parsed.data.phone ? `Phone: ${parsed.data.phone}` : null,
      parsed.data.birthDate ? `Date of birth: ${parsed.data.birthDate}` : null,
      parsed.data.birthTime ? `Birth time: ${parsed.data.birthTime}` : null,
      parsed.data.birthPlace ? `Birth place: ${parsed.data.birthPlace}` : null,
      parsed.data.purpose ? `Purpose: ${parsed.data.purpose}` : null,
      recommendation.rashi ? `Calculated rashi: ${recommendation.rashi}` : null,
      `Primary gems: ${recommendation.primaryGemNames.join(', ') || 'Not available'}`,
      `Supporting gems: ${recommendation.supportingGemNames.join(', ') || 'Not available'}`,
      `Advisory: ${recommendation.advisory}`,
    ].filter(Boolean).join('\n');

    try {
      const admin = createAdminClient();
      adminClient = admin;
      const geo =
        request.headers.get('x-vercel-ip-city') && request.headers.get('x-vercel-ip-country')
          ? `${request.headers.get('x-vercel-ip-city')}, ${request.headers.get('x-vercel-ip-country')}`
          : null;

      const { data: enquiry, error } = await admin
        .from('enquiries')
        .insert({
          name: customerName,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          subject: 'Gemstone Recommendation Request',
          message,
          source: 'homepage_recommendation',
          status: 'new',
          pipeline_stage: 'new',
          enquiry_type: 'Remedies Recommendation',
          date_of_birth: parsed.data.birthDate || null,
          birth_time: parsed.data.birthTime || null,
          birth_place: parsed.data.birthPlace || null,
          area_of_concern: parsed.data.purpose || null,
          ip_location: geo,
        })
        .select('id, lead_number, created_at')
        .single();

      if (error || !enquiry) {
        console.error('[Recommendation] Failed to store lead:', error);
      } else {
        enquiryId = enquiry.id;
        const matches = await findPriorDuplicateMatches(admin, {
          id: enquiry.id,
          lead_number: enquiry.lead_number,
          date_of_birth: parsed.data.birthDate || null,
          birth_time: parsed.data.birthTime || null,
          birth_place: parsed.data.birthPlace || null,
          created_at: enquiry.created_at,
        });
        const dupeNote = duplicateNotifySuffix(matches);
        if (matches[0]) {
          void logLeadActivity(admin, {
            enquiryId: enquiry.id,
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
        await Promise.allSettled([
          sendRecommendationRequestEmails({
            id: enquiry.id,
            name: customerName,
            email: parsed.data.email,
            phone: parsed.data.phone || null,
            birthDate: parsed.data.birthDate || null,
            birthTime: parsed.data.birthTime || null,
            birthPlace: parsed.data.birthPlace || null,
            purpose: parsed.data.purpose || null,
            recommendation,
          }),
          createInAppNotifications([
            {
              audience: 'admin',
              recipientRole: 'sales',
              type: 'homepage_recommendation_request',
              title: dupeNote ? `${dupeNote.split(' ·')[0]} — assign telecaller` : 'New recommendation — assign telecaller',
              message: dupeNote
                ? `${customerName} · ${dupeNote}`
                : `${customerName} requested remedies. Assign a telecaller to verify details.`,
              href: `/admin/leads?type=enquiry&id=${enquiry.id}`,
              entityType: 'enquiry',
              entityId: enquiry.id,
              metadata: {
                source: 'homepage_recommendation',
                purpose: parsed.data.purpose ?? null,
                duplicate_status: matches[0]?.status ?? null,
                prior_lead_id: matches[0]?.id ?? null,
              },
            },
          ]),
        ]);
      }
    } catch (error) {
      console.error('[Recommendation] Lead side effects failed:', error);
    }
  }

  if (parsed.data.email) {
    try {
      const admin = adminClient ?? createAdminClient();
      const { error } = await admin
        .from('recommendation_requests')
        .insert({
          name: parsed.data.name || null,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          birth_date: parsed.data.birthDate || null,
          birth_time: parsed.data.birthTime || null,
          birth_place: parsed.data.birthPlace || null,
          rashi: parsed.data.rashi || recommendation.rashi || null,
          purpose: parsed.data.purpose || null,
          budget_min: parsed.data.budgetMin ?? null,
          budget_max: parsed.data.budgetMax ?? null,
          recommendation: recommendation as unknown as Json,
          source: 'homepage_recommendation',
          status: 'new',
          enquiry_id: enquiryId,
          legacy_data: {
            request: parsed.data,
          },
        });

      if (error) console.error('[Recommendation] Failed to store recommendation request:', error);
    } catch (error) {
      console.error('[Recommendation] Recommendation request persistence failed:', error);
    }
  }

  return NextResponse.json(
    {
      recommendation,
      captured: Boolean(enquiryId),
      enquiry_id: enquiryId,
      note: enquiryId
        ? 'Recommendation request saved. Our team will get back to you after expert review.'
        : 'Recommendation generated without storing personal birth details. Book consultation to continue with expert review.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}