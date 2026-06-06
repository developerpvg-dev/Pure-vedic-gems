import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRazorpayClient } from '@/lib/razorpay/client';
import { rateLimit } from '@/lib/utils/rate-limit';
import { yagyaBookingCreateOrderSchema } from '@/lib/validators/yagya';
import { createInAppNotifications } from '@/lib/notifications/in-app';

interface RazorpayOrderResult {
  id: string;
}

interface YagyaProductRow {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  product_type: string | null;
  is_active: boolean;
}

function generateBookingNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `YG-${stamp}-${rand}`;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`yagya-pay-create:${ip}`, 8, 60 * 1000)) {
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

  const parsed = yagyaBookingCreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: yagyaRow, error: yagyaError } = await admin
    .from('products')
    .select('id, name, slug, price, product_type, is_active')
    .eq('id', parsed.data.yagya_id)
    .eq('is_active', true)
    .eq('product_type', 'service')
    .single();

  const yagya = yagyaRow as YagyaProductRow | null;

  if (yagyaError || !yagya) {
    return NextResponse.json({ error: 'This yagya is not available' }, { status: 404 });
  }

  const amountInr = Number(yagya.price);
  const amountInPaise = Math.round(amountInr * 100);
  if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
    return NextResponse.json({ error: 'Yagya amount is not eligible for payment' }, { status: 400 });
  }

  const bookingNumber = generateBookingNumber();

  const { data: booking, error: insertError } = await admin
    .from('yagya_bookings')
    .insert({
      booking_number: bookingNumber,
      customer_id: user?.id ?? null,
      product_id: yagya.id,
      yagya_title_snapshot: yagya.name,
      yagya_slug_snapshot: yagya.slug,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      sankalp_name: parsed.data.sankalp_name || null,
      gotra: parsed.data.gotra || null,
      rashi: parsed.data.rashi || null,
      nakshatra: parsed.data.nakshatra || null,
      date_of_birth: parsed.data.date_of_birth || null,
      birth_time: parsed.data.birth_time || null,
      birth_place: parsed.data.birth_place || null,
      preferred_date: parsed.data.preferred_date || null,
      message: parsed.data.message || null,
      amount_inr: amountInr,
      amount_paise: amountInPaise,
      currency: 'INR',
      payment_status: 'pending',
      status: 'pending_payment',
    })
    .select('id')
    .single();

  if (insertError || !booking) {
    console.error('[Yagya payment] Insert failed:', insertError);
    return NextResponse.json({ error: 'Failed to create yagya booking' }, { status: 500 });
  }

  let razorpayOrder: RazorpayOrderResult;
  try {
    const razorpay = getRazorpayClient();
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `yagya_${booking.id.slice(0, 24)}`,
      payment: {
        capture: 'automatic',
        capture_options: {
          automatic_expiry_period: 12,
          manual_expiry_period: 7200,
          refund_speed: 'normal',
        },
      },
      notes: {
        booking_id: booking.id,
        yagya_id: yagya.id,
        customer_id: user?.id ?? 'guest',
      },
    }) as RazorpayOrderResult;
  } catch (error) {
    console.error('[Yagya payment] Razorpay order failed:', error);
    await admin
      .from('yagya_bookings')
      .update({ payment_status: 'failed', payment_failure_reason: 'Razorpay order creation failed' })
      .eq('id', booking.id);
    return NextResponse.json({ error: 'Payment gateway error. Please try again.' }, { status: 502 });
  }

  await admin
    .from('yagya_bookings')
    .update({
      razorpay_order_id: razorpayOrder.id,
      payment_attempts: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  await createInAppNotifications([
    {
      audience: 'admin',
      recipientRole: 'sales',
      type: 'yagya_booking_created',
      title: 'Yagya booking started',
      message: `${parsed.data.full_name} started booking ${yagya.name} for ₹${amountInr.toLocaleString('en-IN')}.`,
      href: '/admin/yagya-bookings',
      entityType: 'yagya_booking',
      entityId: booking.id,
      metadata: { yagya_id: yagya.id, yagya_title: yagya.name, payment_status: 'pending' },
    },
    ...(user
      ? [{
          audience: 'user' as const,
          recipientUserId: user.id,
          type: 'yagya_pending_payment',
          title: 'Yagya booking started',
          message: `${yagya.name} is waiting for payment confirmation.`,
          href: '/account/yagyas',
          entityType: 'yagya_booking',
          entityId: booking.id,
          metadata: { yagya_id: yagya.id, yagya_title: yagya.name },
        }]
      : []),
  ]);

  return NextResponse.json({
    booking_id: booking.id,
    razorpay_order_id: razorpayOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
    yagya_title: yagya.name,
    customer: {
      name: parsed.data.full_name,
      email: parsed.data.email,
      contact: parsed.data.phone,
    },
  });
}
