import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureAuthorizedRazorpayPayment, fetchRazorpayPaymentFacts } from '@/lib/razorpay/transactions';
import { verifyPaymentSignature } from '@/lib/razorpay/verify';
import { rateLimit } from '@/lib/utils/rate-limit';
import { sendConsultationBookingEmails } from '@/lib/resend/send-consultation-booking';
import { consultationPaymentVerifySchema } from '@/lib/validators/consultation';
import type { Consultation, Json } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`consult-pay-verify:${ip}`, 12, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  if (fetchError || !consultation || consultation.customer_id !== user.id) {
    return NextResponse.json({ error: 'Consultation booking not found' }, { status: 404 });
  }

  if (consultation.payment_status === 'captured') {
    return NextResponse.json({ success: true, consultation_id: consultation.id, status: consultation.status });
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

  if (!signatureValid) {
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
  const amountMatches =
    facts.razorpayOrderAmountPaise === expectedPaise &&
    facts.razorpayPaymentAmountPaise === expectedPaise &&
    facts.currency === consultation.currency;

  if (!amountMatches) {
    await admin
      .from('consultations')
      .update({
        payment_status: 'amount_mismatch',
        status: 'payment_review',
        payment_review_reason: 'Gateway amount or currency did not match booking amount',
        razorpay_payment_id: parsed.data.razorpay_payment_id,
        razorpay_signature: parsed.data.razorpay_signature,
        payment_metadata: facts as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultation.id);
    return NextResponse.json({ error: 'Payment amount mismatch. Our team will review this booking.' }, { status: 409 });
  }

  if (!facts.captured) {
    if (facts.paymentStatus === 'authorized') {
      try {
        facts = await captureAuthorizedRazorpayPayment(
          facts,
          parsed.data.razorpay_payment_id,
          expectedPaise,
          consultation.currency
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
            payment_metadata: facts as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', consultation.id);
        return NextResponse.json(
          { error: 'Payment was authorized, but capture could not be completed. Please contact support.' },
          { status: 502 }
        );
      }
    }
  }

  if (!facts.captured) {
    await admin
      .from('consultations')
      .update({
        payment_status: facts.paymentStatus === 'authorized' ? 'authorized' : 'failed',
        status: facts.paymentStatus === 'authorized' ? 'pending_payment' : 'payment_review',
        payment_failure_reason: facts.paymentStatus === 'authorized' ? null : `Gateway status: ${facts.paymentStatus}`,
        payment_review_reason: facts.paymentStatus === 'authorized' ? 'Payment authorized and awaiting capture' : null,
        razorpay_payment_id: parsed.data.razorpay_payment_id,
        razorpay_signature: parsed.data.razorpay_signature,
        payment_metadata: facts as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultation.id);
    return NextResponse.json({ error: 'Payment has not been captured yet.' }, { status: 409 });
  }

  const { data: updatedRow, error: updateError } = await admin
    .from('consultations')
    .update({
      payment_status: 'captured',
      status: 'confirmed',
      payment_method: facts.method,
      razorpay_payment_id: parsed.data.razorpay_payment_id,
      razorpay_signature: parsed.data.razorpay_signature,
      payment_failure_reason: null,
      payment_review_reason: null,
      amount_verified_at: new Date().toISOString(),
      payment_metadata: facts as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultation.id)
    .select('*')
    .single();

  const updated = updatedRow as Consultation | null;

  if (updateError || !updated) {
    console.error('[Consultation payment] Finalize failed:', updateError);
    return NextResponse.json({ error: 'Failed to finalize consultation payment' }, { status: 500 });
  }

  if (!updated.confirmation_email_sent_at || !updated.admin_notification_sent_at) {
    const sent = await sendConsultationBookingEmails({
      id: updated.id,
      full_name: updated.full_name,
      email: updated.email,
      phone: updated.phone,
      plan_title: updated.plan_title_snapshot ?? 'Paid consultation',
      plan_description: updated.plan_description_snapshot,
      amount_inr: updated.amount_inr,
      currency: updated.currency,
      razorpay_payment_id: updated.razorpay_payment_id,
      preferred_date: updated.preferred_date,
      preferred_time: updated.preferred_time,
      status: updated.status,
    });

    const emailUpdate: Record<string, string> = {};
    const now = new Date().toISOString();
    if (sent.customer && !updated.confirmation_email_sent_at) emailUpdate.confirmation_email_sent_at = now;
    if (sent.admin && !updated.admin_notification_sent_at) emailUpdate.admin_notification_sent_at = now;
    if (Object.keys(emailUpdate).length > 0) {
      await admin.from('consultations').update(emailUpdate).eq('id', updated.id);
    }
  }

  return NextResponse.json({ success: true, consultation_id: updated.id, status: updated.status });
}