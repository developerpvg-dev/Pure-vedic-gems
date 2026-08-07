import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRazorpayClient } from '@/lib/razorpay/client';
import { normalizeChargeCurrency } from '@/lib/razorpay/charge-currency';
import { convertInrToGatewayCharge } from '@/lib/razorpay/convert-inr-charge';
import { rateLimit } from '@/lib/utils/rate-limit';
import { yagyaBookingCreateOrderSchema } from '@/lib/validators/yagya';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { setBookingTokenCookie } from '@/lib/security/booking-token';

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

  const currency = normalizeChargeCurrency(parsed.data.currency);
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
  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    return NextResponse.json({ error: 'Yagya amount is not eligible for payment' }, { status: 400 });
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
      amount_paise: amountMinor,
      currency: gateway.currency,
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
      amount: amountMinor,
      currency: gateway.currency,
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
        ledger_inr: String(amountInr),
        charge_currency: gateway.currency,
        fx_rate: String(gateway.rate),
      },
    }) as RazorpayOrderResult;
  } catch (error) {
    console.error('[Yagya payment] Razorpay order failed:', error);
    await admin
      .from('yagya_bookings')
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

  const response = NextResponse.json({
    booking_id: booking.id,
    razorpay_order_id: razorpayOrder.id,
    amount: amountMinor,
    currency: gateway.currency,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
    yagya_title: yagya.name,
    customer: {
      name: parsed.data.full_name,
      email: parsed.data.email,
      contact: parsed.data.phone,
    },
  });

  setBookingTokenCookie(response, 'yagya', booking.id);

  return response;
}
