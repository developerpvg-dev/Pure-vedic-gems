import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureAuthorizedRazorpayPayment, fetchRazorpayPaymentFacts } from '@/lib/razorpay/transactions';
import { verifyPaymentSignature } from '@/lib/razorpay/verify';
import { rateLimit } from '@/lib/utils/rate-limit';
import { consultationPaymentVerifySchema } from '@/lib/validators/consultation';
import { hasValidBookingToken } from '@/lib/security/booking-token';
import { applyRazorpayFactsToConsultation } from '@/lib/consultation/finalize-captured-payment';
import { ensureLeadFromConsultation } from '@/lib/leads/from-consultation';
import type { Consultation } from '@/lib/types/database';

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
  if (!rateLimit(`consult-pay-verify:${ip}`, 12, 60 * 1000)) {
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

  const parsed = consultationPaymentVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: consultationRow, error: fetchError } = await admin
    .from('consultations')
    .select('*')
    .eq('id', parsed.data.consultation_id)
    .single();

  const consultation = consultationRow as Consultation | null;

  if (fetchError || !consultation) {
    return NextResponse.json({ error: 'Consultation booking not found' }, { status: 404 });
  }

  const ownsBooking = consultation.customer_id
    ? consultation.customer_id === user?.id
    : hasValidBookingToken(request, 'consultation', consultation.id);

  if (consultation.payment_status === 'captured') {
    if (!ownsBooking && consultation.razorpay_order_id !== parsed.data.razorpay_order_id) {
      return NextResponse.json({ error: 'Consultation booking not found' }, { status: 404 });
    }
    let enquiryId: string | null = null;
    try {
      enquiryId = await ensureLeadFromConsultation(admin, consultation, {
        ipLocation: geoFromRequest(request),
      });
    } catch (error) {
      console.error('[Consultation payment] CRM lead ensure failed (already captured):', error);
    }
    return NextResponse.json({
      success: true,
      consultation_id: consultation.id,
      enquiry_id: enquiryId,
      status: consultation.status,
    });
  }

  if (!consultation.razorpay_order_id || consultation.razorpay_order_id !== parsed.data.razorpay_order_id) {
    return NextResponse.json({ error: 'Payment order mismatch' }, { status: 400 });
  }

  let signatureValid = false;
  try {
    signatureValid = verifyPaymentSignature(
      parsed.data.razorpay_order_id,
      parsed.data.razorpay_payment_id,
      parsed.data.razorpay_signature
    );
  } catch (error) {
    console.error('[Consultation payment] Signature verification failed:', error);
  }

  // Valid Razorpay signature is proof of payment — don't 404 if the guest cookie dropped.
  if (!signatureValid) {
    if (!ownsBooking) {
      return NextResponse.json({ error: 'Consultation booking not found' }, { status: 404 });
    }
    await admin
      .from('consultations')
      .update({
        payment_status: 'failed',
        payment_failure_reason: 'Invalid Razorpay signature',
        razorpay_payment_id: parsed.data.razorpay_payment_id,
        razorpay_signature: parsed.data.razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultation.id);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
  }

  let facts;
  try {
    facts = await fetchRazorpayPaymentFacts(parsed.data.razorpay_order_id, parsed.data.razorpay_payment_id);
  } catch (error) {
    console.error('[Consultation payment] Razorpay facts fetch failed:', error);
    return NextResponse.json({ error: 'Unable to verify payment with gateway' }, { status: 502 });
  }

  const expectedPaise = consultation.amount_paise ?? Math.round(Number(consultation.amount_inr ?? 0) * 100);
  const expectedCurrency = String(consultation.currency || 'INR').toUpperCase();

  if (!facts.captured && facts.paymentStatus === 'authorized') {
    try {
      facts = await captureAuthorizedRazorpayPayment(
        facts,
        parsed.data.razorpay_payment_id,
        expectedPaise,
        expectedCurrency
      );
    } catch (error) {
      console.error('[Consultation payment] Razorpay capture failed:', error);
      await admin
        .from('consultations')
        .update({
          payment_status: 'authorized',
          status: 'pending_payment',
          payment_failure_reason: null,
          payment_review_reason: 'Payment authorized but server-side capture failed',
          razorpay_payment_id: parsed.data.razorpay_payment_id,
          razorpay_signature: parsed.data.razorpay_signature,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consultation.id);
      return NextResponse.json(
        { error: 'Payment was authorized, but capture could not be completed. Please contact support.' },
        { status: 502 }
      );
    }
  }

  const result = await applyRazorpayFactsToConsultation({
    admin,
    consultation,
    facts,
    razorpayPaymentId: parsed.data.razorpay_payment_id,
    razorpaySignature: parsed.data.razorpay_signature,
    ipLocation: geoFromRequest(request),
  });

  if (result.status === 'amount_mismatch') {
    return NextResponse.json({ error: 'Payment amount mismatch. Our team will review this booking.' }, { status: 409 });
  }
  if (result.status === 'not_captured') {
    return NextResponse.json({ error: 'Payment has not been captured yet.' }, { status: 409 });
  }
  if (result.status === 'update_failed') {
    return NextResponse.json({ error: 'Failed to finalize consultation payment' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    consultation_id: result.consultation.id,
    enquiry_id: result.enquiryId,
    status: result.consultation.status,
  });
}
