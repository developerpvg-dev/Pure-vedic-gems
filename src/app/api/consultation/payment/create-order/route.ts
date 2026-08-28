import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRazorpayClient } from '@/lib/razorpay/client';
import { normalizeChargeCurrency } from '@/lib/razorpay/charge-currency';
import { convertInrToGatewayCharge } from '@/lib/razorpay/convert-inr-charge';
import { rateLimit } from '@/lib/utils/rate-limit';
import { consultationBookingCreateOrderSchema } from '@/lib/validators/consultation';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { setBookingTokenCookie } from '@/lib/security/booking-token';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';
import { consultationModeFromPlan, stripSkype } from '@/lib/consultation/plan-display';
import { ensureLeadFromConsultation } from '@/lib/leads/from-consultation';
import { formatChargedMoney } from '@/lib/currency/format-charged';
import { countryCodeFromHeaders, isRs101PaidCountry } from '@/lib/consultation/rs101-eligibility';
import { finalizeFreeRs101Consultation } from '@/lib/consultation/finalize-free-rs101';
import { isTurnstileProductionHost } from '@/lib/enquiry/turnstile-host';
import { turnstileConfigured, verifyTurnstileToken } from '@/lib/enquiry/verify-turnstile';
import type { Consultation, ConsultationPlan } from '@/lib/types/database';

interface RazorpayOrderResult {
  id: string;
}

function geoFromRequest(request: NextRequest) {
  const decode = (value: string | null) => {
    if (!value) return null;
    try {
      return decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
      return value;
    }
  };
  const city = decode(request.headers.get('x-vercel-ip-city'));
  const region = decode(request.headers.get('x-vercel-ip-country-region'));
  const country =
    decode(request.headers.get('x-vercel-ip-country')) ||
    decode(request.headers.get('cf-ipcountry'));
  const parts = [city, region, country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`consult-pay-create:${ip}`, 8, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = consultationBookingCreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }

  const ipCountry = countryCodeFromHeaders(request.headers);
  const rs101FreeInternational =
    parsed.data.plan_id === 'rs101' && !isRs101PaidCountry(ipCountry);

  if (rs101FreeInternational) {
    const emailKey = parsed.data.email.trim().toLowerCase();
    if (!rateLimit(`consult-rs101-free:${emailKey}`, 2, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const host = request.headers.get('host') ?? '';
    const skipTurnstile = !isTurnstileProductionHost(host);
    const remoteIp = ip !== 'unknown' ? ip : undefined;
    const token = parsed.data.turnstileToken?.trim();
    if (turnstileConfigured() && !skipTurnstile && (!token || !(await verifyTurnstileToken(token, remoteIp)))) {
      return NextResponse.json(
        { error: 'Please complete the security check and try again.' },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const planTitle = 'Gem Recommendation';
    const planDescription = 'Personalized gemstone recommendation from our Vedic experts';

    const { data: consultation, error: insertError } = await admin
      .from('consultations')
      .insert({
        customer_id: user?.id ?? null,
        plan_id: null,
        plan_title_snapshot: planTitle,
        plan_description_snapshot: planDescription,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        date_of_birth: parsed.data.date_of_birth || null,
        birth_time: parsed.data.birth_time || null,
        birth_place: parsed.data.birth_place || null,
        customer_city: parsed.data.customer_city || null,
        customer_state: parsed.data.customer_state || null,
        customer_country: parsed.data.customer_country || null,
        life_situation: parsed.data.life_situation || null,
        consultation_type: 'paid_plan',
        mode: null,
        preferred_date: parsed.data.preferred_date || null,
        preferred_time: parsed.data.preferred_time || null,
        message: parsed.data.message || null,
        amount_inr: 0,
        amount_paise: 0,
        currency: 'INR',
        payment_status: 'captured',
        status: 'confirmed',
        payment_method: 'free_international',
        amount_verified_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertError || !consultation) {
      console.error('[Consultation rs101 free] Insert failed:', insertError);
      return NextResponse.json({ error: 'Failed to create consultation booking' }, { status: 500 });
    }

    const booking = consultation as Consultation;
    const ipLocation = geoFromRequest(request);
    let enquiryId: string | null = null;
    try {
      enquiryId = await finalizeFreeRs101Consultation(admin, booking, ipLocation);
    } catch (err) {
      console.error('[Consultation rs101 free] Finalize failed:', err);
    }

    const response = NextResponse.json({
      consultation_id: booking.id,
      enquiry_id: enquiryId,
      free: true,
      plan_title: planTitle,
    });
    setBookingTokenCookie(response, 'consultation', booking.id);
    return response;
  }

  const currency = normalizeChargeCurrency(parsed.data.currency);
  const admin = createAdminClient();

  // Handle special "Gem Recommendation Rs 101" (no DB plan required)
  let plan: ConsultationPlan | null = null;
  if (parsed.data.plan_id === 'rs101') {
    plan = {
      id: 'rs101',
      title: 'Gem Recommendation',
      slug: 'gem-recommendation',
      description: 'Personalized gemstone recommendation from our Vedic experts',
      amount_inr: RS101_AMOUNT_INR,
      amount_usd: null,
      currency: 'INR',
      duration_minutes: null,
      is_active: true,
      sort_order: 0,
      created_at: '',
      updated_at: '',
      metadata: null,
    };
  } else {
    const { data: planRow, error: planError } = await admin
      .from('consultation_plans')
      .select('*')
      .eq('id', parsed.data.plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !planRow) {
      return NextResponse.json({ error: 'Consultation plan is not available' }, { status: 404 });
    }
    plan = planRow as ConsultationPlan;
  }

  const amountInr = Number(plan.amount_inr);
  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    return NextResponse.json({ error: 'Plan amount is not eligible for payment' }, { status: 400 });
  }

  let gateway;
  try {
    gateway = await convertInrToGatewayCharge(amountInr, currency);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Currency conversion failed' },
      { status: 400 }
    );
  }

  const amountMinor = gateway.minor;
  if (amountMinor < 100) {
    return NextResponse.json({ error: 'Plan amount is not eligible for payment' }, { status: 400 });
  }

  const planTitle = stripSkype(plan.title);
  const planDescription = plan.description ? stripSkype(plan.description) : null;
  const planMode =
    plan.id === 'rs101' ? null : consultationModeFromPlan({ title: plan.title, metadata: plan.metadata });

  const { data: consultation, error: insertError } = await admin
    .from('consultations')
    .insert({
      customer_id: user?.id ?? null,
      plan_id: plan.id === 'rs101' ? null : plan.id,
      plan_title_snapshot: planTitle,
      plan_description_snapshot: planDescription,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      date_of_birth: parsed.data.date_of_birth || null,
      birth_time: parsed.data.birth_time || null,
      birth_place: parsed.data.birth_place || null,
      customer_city: parsed.data.customer_city || null,
      customer_state: parsed.data.customer_state || null,
      customer_country: parsed.data.customer_country || null,
      life_situation: parsed.data.life_situation || null,
      consultation_type: 'paid_plan',
      mode: planMode,
      preferred_date: parsed.data.preferred_date || null,
      preferred_time: parsed.data.preferred_time || null,
      message: parsed.data.message || null,
      amount_inr: amountInr,
      // Gateway minor units in `currency` (verify compares against this).
      amount_paise: amountMinor,
      currency: gateway.currency,
      payment_status: 'pending',
      status: 'pending_payment',
    })
    .select('*')
    .single();

  if (insertError || !consultation) {
    console.error('[Consultation payment] Insert failed:', insertError);
    return NextResponse.json({ error: 'Failed to create consultation booking' }, { status: 500 });
  }

  // ponytail: supabase insert inference collapses to {}; Row shape is known
  const booking = consultation as Consultation;

  // CRM lead immediately — abandoned Razorpay still shows as payment pending
  let enquiryId: string | null = null;
  try {
    enquiryId = await ensureLeadFromConsultation(admin, booking, {
      ipLocation: geoFromRequest(request),
    });
  } catch (leadErr) {
    console.error('[Consultation payment] Pending lead create failed:', leadErr);
  }

  let razorpayOrder: RazorpayOrderResult;
  try {
    const razorpay = getRazorpayClient();
    razorpayOrder = await razorpay.orders.create({
      amount: amountMinor,
      currency: gateway.currency,
      receipt: `consult_${booking.id.slice(0, 24)}`,
      payment: {
        capture: 'automatic',
        capture_options: {
          automatic_expiry_period: 12,
          manual_expiry_period: 7200,
          refund_speed: 'normal',
        },
      },
      notes: {
        consultation_id: booking.id,
        plan_id: plan.id,
        customer_id: user?.id ?? 'guest',
        ledger_inr: String(amountInr),
        charge_currency: gateway.currency,
        fx_rate: String(gateway.rate),
      },
    }) as RazorpayOrderResult;
  } catch (error) {
    console.error('[Consultation payment] Razorpay order failed:', error);
    await admin
      .from('consultations')
      .update({ payment_status: 'failed', payment_failure_reason: 'Razorpay order creation failed' })
      .eq('id', booking.id);
    const msg = error instanceof Error ? error.message : String(error);
    const currencyHint =
      gateway.currency !== 'INR' && /currency|international/i.test(msg)
        ? ` Razorpay may not have multi-currency enabled for ${gateway.currency}.`
        : '';
    return NextResponse.json(
      { error: `Payment gateway error.${currencyHint} Please try again or switch to INR.` },
      { status: 502 }
    );
  }

  await admin
    .from('consultations')
    .update({
      razorpay_order_id: razorpayOrder.id,
      payment_attempts: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  await createInAppNotifications([
    // Lead notify already fired inside ensureLeadFromConsultation when enquiryId is set
    ...(enquiryId
      ? []
      : [
          {
            audience: 'admin' as const,
            recipientRole: 'sales' as const,
            type: 'consultation_created',
            title: 'Consultation booking started',
            message: `${parsed.data.full_name} started booking ${planTitle} for ${formatChargedMoney({
              amount_inr: amountInr,
              amount_paise: amountMinor,
              currency: gateway.currency,
            })}.`,
            href: '/admin/leads',
            entityType: 'consultation' as const,
            entityId: booking.id,
            metadata: {
              plan_id: plan.id,
              plan_title: planTitle,
              payment_status: 'pending',
              consultation_id: booking.id,
            },
          },
        ]),
    ...(user
      ? [{
          audience: 'user' as const,
          recipientUserId: user.id,
          type: 'consultation_pending_payment',
          title: 'Consultation booking started',
          message: `${planTitle} is waiting for payment confirmation.`,
          href: '/account',
          entityType: 'consultation' as const,
          entityId: booking.id,
          metadata: { plan_id: plan.id, plan_title: planTitle },
        }]
      : []),
  ]);

  const response = NextResponse.json({
    consultation_id: booking.id,
    enquiry_id: enquiryId,
    razorpay_order_id: razorpayOrder.id,
    amount: amountMinor,
    currency: gateway.currency,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
    plan_title: planTitle,
    customer: {
      name: parsed.data.full_name,
      email: parsed.data.email,
      contact: parsed.data.phone,
    },
  });

  // Bind this booking to the current browser so a guest can later prove
  // ownership when finalizing payment (no schema change required).
  setBookingTokenCookie(response, 'consultation', booking.id);

  return response;
}
