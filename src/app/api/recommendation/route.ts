import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendRecommendationRequestEmails } from '@/lib/resend/send-recommendation-request';
import { rateLimit } from '@/lib/utils/rate-limit';
import { buildGemRecommendation } from '@/lib/utils/rashi-calculator';

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
        })
        .select('id')
        .single();

      if (error || !enquiry) {
        console.error('[Recommendation] Failed to store lead:', error);
      } else {
        enquiryId = enquiry.id;
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
              title: 'New gemstone recommendation request',
              message: `${customerName} requested a gemstone recommendation from the homepage.`,
              href: '/admin/leads?type=enquiry',
              entityType: 'enquiry',
              entityId: enquiry.id,
              metadata: { source: 'homepage_recommendation', purpose: parsed.data.purpose ?? null },
            },
          ]),
        ]);
      }
    } catch (error) {
      console.error('[Recommendation] Lead side effects failed:', error);
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