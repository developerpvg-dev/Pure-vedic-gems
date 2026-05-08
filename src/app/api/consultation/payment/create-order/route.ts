import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRazorpayClient } from '@/lib/razorpay/client';
import { rateLimit } from '@/lib/utils/rate-limit';
import { consultationBookingCreateOrderSchema } from '@/lib/validators/consultation';
import type { ConsultationPlan } from '@/lib/types/database';

interface RazorpayOrderResult {
  id: string;
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

  if (!user) {
    return NextResponse.json({ error: 'Please login or create an account before booking.' }, { status: 401 });
  }

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

  const admin = createAdminClient();
  const { data: planRow, error: planError } = await admin
    .from('consultation_plans')
    .select('*')
    .eq('id', parsed.data.plan_id)
    .eq('is_active', true)
    .single();

  const plan = planRow as ConsultationPlan | null;

  if (planError || !plan) {
    return NextResponse.json({ error: 'Consultation plan is not available' }, { status: 404 });
  }

  const amountInr = Number(plan.amount_inr);
  const amountInPaise = Math.round(amountInr * 100);
  if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
    return NextResponse.json({ error: 'Plan amount is not eligible for payment' }, { status: 400 });
  }

  const { data: consultation, error: insertError } = await admin
    .from('consultations')
    .insert({
      customer_id: user.id,
      plan_id: plan.id,
      plan_title_snapshot: plan.title,
      plan_description_snapshot: plan.description,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      date_of_birth: parsed.data.date_of_birth || null,
      birth_time: parsed.data.birth_time || null,
      birth_place: parsed.data.birth_place || null,
      life_situation: parsed.data.life_situation || null,
      consultation_type: 'paid_plan',
      mode: null,
      preferred_date: parsed.data.preferred_date || null,
      preferred_time: parsed.data.preferred_time || null,
      message: parsed.data.message || null,
      amount_inr: amountInr,
      amount_paise: amountInPaise,
      currency: 'INR',
      payment_status: 'pending',
      status: 'pending_payment',
    })
    .select('id')
    .single();

  if (insertError || !consultation) {
    console.error('[Consultation payment] Insert failed:', insertError);
    return NextResponse.json({ error: 'Failed to create consultation booking' }, { status: 500 });
  }

  let razorpayOrder: RazorpayOrderResult;
  try {
    const razorpay = getRazorpayClient();
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `consult_${consultation.id.slice(0, 24)}`,
      payment: {
        capture: 'automatic',
        capture_options: {
          automatic_expiry_period: 12,
          manual_expiry_period: 7200,
          refund_speed: 'normal',
        },
      },
      notes: {
        consultation_id: consultation.id,
        plan_id: plan.id,
        customer_id: user.id,
      },
    }) as RazorpayOrderResult;
  } catch (error) {
    console.error('[Consultation payment] Razorpay order failed:', error);
    await admin
      .from('consultations')
      .update({ payment_status: 'failed', payment_failure_reason: 'Razorpay order creation failed' })
      .eq('id', consultation.id);
    return NextResponse.json({ error: 'Payment gateway error. Please try again.' }, { status: 502 });
  }

  await admin
    .from('consultations')
    .update({
      razorpay_order_id: razorpayOrder.id,
      payment_attempts: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultation.id);

  return NextResponse.json({
    consultation_id: consultation.id,
    razorpay_order_id: razorpayOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
    plan_title: plan.title,
    customer: {
      name: parsed.data.full_name,
      email: parsed.data.email,
      contact: parsed.data.phone,
    },
  });
}