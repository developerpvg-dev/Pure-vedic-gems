import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureAuthorizedRazorpayPayment, fetchRazorpayPaymentFacts } from '@/lib/razorpay/transactions';
import { verifyPaymentSignature } from '@/lib/razorpay/verify';
import { rateLimit } from '@/lib/utils/rate-limit';
import { yagyaPaymentVerifySchema } from '@/lib/validators/yagya';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendYagyaBookingEmails } from '@/lib/resend/send-yagya-booking';
import { hasValidBookingToken } from '@/lib/security/booking-token';
import type { YagyaBooking, Json } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`yagya-pay-verify:${ip}`, 12, 60 * 1000)) {
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

  const parsed = yagyaPaymentVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: bookingRow, error: fetchError } = await admin
    .from('yagya_bookings')
    .select('*')
    .eq('id', parsed.data.booking_id)
    .single();

  const booking = bookingRow as YagyaBooking | null;

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Yagya booking not found' }, { status: 404 });
  }

  if (booking.customer_id) {
    // Account-owned bookings can only be finalized by their owner.
    if (booking.customer_id !== user?.id) {
      return NextResponse.json({ error: 'Yagya booking not found' }, { status: 404 });
    }
  } else if (!hasValidBookingToken(request, 'yagya', booking.id)) {
    // Guest bookings require the signed cookie issued at create-order time.
    return NextResponse.json({ error: 'Yagya booking not found' }, { status: 404 });
  }

  if (booking.payment_status === 'captured') {
    return NextResponse.json({ success: true, booking_id: booking.id, status: booking.status });
  }

  if (!booking.razorpay_order_id || booking.razorpay_order_id !== parsed.data.razorpay_order_id) {
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
    console.error('[Yagya payment] Signature verification failed:', error);
  }

  if (!signatureValid) {
    await admin
      .from('yagya_bookings')
      .update({
        payment_status: 'failed',
        payment_failure_reason: 'Invalid Razorpay signature',
        razorpay_payment_id: parsed.data.razorpay_payment_id,
        razorpay_signature: parsed.data.razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
  }

  let facts;
  try {
    facts = await fetchRazorpayPaymentFacts(parsed.data.razorpay_order_id, parsed.data.razorpay_payment_id);
  } catch (error) {
    console.error('[Yagya payment] Razorpay facts fetch failed:', error);
    return NextResponse.json({ error: 'Unable to verify payment with gateway' }, { status: 502 });
  }

  const expectedPaise = booking.amount_paise ?? Math.round(Number(booking.amount_inr ?? 0) * 100);
  const amountMatches =
    facts.razorpayOrderAmountPaise === expectedPaise &&
    facts.razorpayPaymentAmountPaise === expectedPaise &&
    facts.currency === booking.currency;

  if (!amountMatches) {
    await admin
      .from('yagya_bookings')
      .update({
        payment_status: 'amount_mismatch',
        status: 'payment_review',
        payment_review_reason: 'Gateway amount or currency did not match booking amount',
        razorpay_payment_id: parsed.data.razorpay_payment_id,
        razorpay_signature: parsed.data.razorpay_signature,
        payment_metadata: facts as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
    await createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'finance',
        type: 'yagya_payment_review',
        title: 'Yagya payment needs review',
        message: `Yagya payment for ${booking.full_name} did not match the expected amount.`,
        href: '/admin/yagya-bookings',
        entityType: 'yagya_booking',
        entityId: booking.id,
        metadata: { booking_id: booking.id, expected_paise: expectedPaise },
      },
    ]);
    return NextResponse.json({ error: 'Payment amount mismatch. Our team will review this booking.' }, { status: 409 });
  }

  if (!facts.captured && facts.paymentStatus === 'authorized') {
    try {
      facts = await captureAuthorizedRazorpayPayment(
        facts,
        parsed.data.razorpay_payment_id,
        expectedPaise,
        booking.currency
      );
    } catch (error) {
      console.error('[Yagya payment] Razorpay capture failed:', error);
      await admin
        .from('yagya_bookings')
        .update({
          payment_status: 'authorized',
          status: 'pending_payment',
          payment_review_reason: 'Payment authorized but server-side capture failed',
          razorpay_payment_id: parsed.data.razorpay_payment_id,
          razorpay_signature: parsed.data.razorpay_signature,
          payment_metadata: facts as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);
      return NextResponse.json(
        { error: 'Payment was authorized, but capture could not be completed. Please contact support.' },
        { status: 502 }
      );
    }
  }

  if (!facts.captured) {
    await admin
      .from('yagya_bookings')
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
      .eq('id', booking.id);
    return NextResponse.json({ error: 'Payment has not been captured yet.' }, { status: 409 });
  }

  const { data: updatedRow, error: updateError } = await admin
    .from('yagya_bookings')
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
    .eq('id', booking.id)
    .select('*')
    .single();

  const updated = updatedRow as YagyaBooking | null;

  if (updateError || !updated) {
    console.error('[Yagya payment] Finalize failed:', updateError);
    return NextResponse.json({ error: 'Failed to finalize yagya payment' }, { status: 500 });
  }

  void sendYagyaBookingEmails({
    id: updated.id,
    bookingNumber: updated.booking_number,
    fullName: updated.full_name,
    email: updated.email,
    phone: updated.phone,
    yagyaTitle: updated.yagya_title_snapshot,
    amountInr: updated.amount_inr,
    currency: updated.currency,
    razorpayPaymentId: updated.razorpay_payment_id,
    preferredDate: updated.preferred_date,
    sankalpName: updated.sankalp_name,
    gotra: updated.gotra,
    rashi: updated.rashi,
    nakshatra: updated.nakshatra,
    message: updated.message,
  });

  await createInAppNotifications([
    ...(updated.customer_id
      ? [{
          audience: 'user' as const,
          recipientUserId: updated.customer_id,
          type: 'yagya_confirmed',
          title: 'Yagya booking confirmed',
          message: `${updated.yagya_title_snapshot} is confirmed. Our priests will coordinate the next steps.`,
          href: '/account/yagyas',
          entityType: 'yagya_booking',
          entityId: updated.id,
          metadata: { yagya_title: updated.yagya_title_snapshot, amount_inr: updated.amount_inr },
        }]
      : []),
    {
      audience: 'admin',
      recipientRole: 'sales',
      type: 'yagya_confirmed',
      title: 'Yagya paid',
      message: `${updated.full_name} paid for ${updated.yagya_title_snapshot}.`,
      href: '/admin/yagya-bookings',
      entityType: 'yagya_booking',
      entityId: updated.id,
      metadata: { yagya_title: updated.yagya_title_snapshot, amount_inr: updated.amount_inr },
    },
  ]);

  return NextResponse.json({ success: true, booking_id: updated.id, status: updated.status });
}
