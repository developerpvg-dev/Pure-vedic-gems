import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';
import { canPayOrder } from '@/lib/orders/order-ownership';
import { BANK_TRANSFER_HOLD_MS, getBankAccount } from '@/lib/constants/bank-accounts';
import {
  mergeBankTransferProof,
  parseBankTransferProof,
} from '@/lib/orders/bank-transfer-proof';
import {
  CUSTOM_UPLOAD_MAX_BYTES,
  isAllowedUploadSignature,
  isCustomUploadMimeType,
} from '@/lib/security/file-validation';
import { isPaidPaymentStatus } from '@/lib/constants/order-status';
import { notifyAdmins, notifyUser } from '@/lib/notifications/in-app';
import { resolveOrderCustomerEmail } from '@/lib/orders/resolve-order-email';
import { sendBankTransferReceivedEmail } from '@/lib/resend/send-bank-transfer-received';
import {
  resolveOnlinePaymentAmount,
  roundMoney,
} from '@/lib/orders/counter-payments';
import type { Order } from '@/lib/types/database';

const BUCKET = 'custom-uploads';
const MAX_PROOFS = 5;

const fieldsSchema = z.object({
  order_id: z.string().uuid(),
  bank_id: z.enum(['icici', 'hdfc', 'indusind']),
  reference: z.string().trim().min(4).max(120),
  notes: z.string().trim().max(1000).optional(),
  amount_claimed: z.coerce.number().positive().optional(),
  confirm_email: z.string().trim().email().optional(),
  confirm_phone: z.string().trim().min(8).max(20).optional(),
});

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: CUSTOM_UPLOAD_MAX_BYTES,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  });
  if (error) throw new Error(error.message);
}

async function canSubmitBankProof(
  order: {
    id: string;
    customer_id: string | null;
    guest_access_token?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
  },
  confirmEmail?: string,
  confirmPhone?: string,
): Promise<boolean> {
  if (await canPayOrder(order)) return true;

  // Guest recovery: match checkout email/phone when cookie expired (resubmit only).
  if (confirmEmail && order.guest_email?.toLowerCase() === confirmEmail.toLowerCase()) {
    return true;
  }
  if (
    confirmPhone &&
    order.guest_phone &&
    order.guest_phone.replace(/\D/g, '') === confirmPhone.replace(/\D/g, '')
  ) {
    return true;
  }
  return false;
}

/**
 * POST /api/payment/bank-transfer/submit
 * multipart: order_id, bank_id, reference, notes?, proofs[], confirm_email?, confirm_phone?
 * proofs optional when editing an existing submission (keeps prior screenshots).
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`bank-transfer:${ip}`, 8, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const parsed = fieldsSchema.safeParse({
    order_id: form.get('order_id'),
    bank_id: form.get('bank_id'),
    reference: form.get('reference'),
    notes: form.get('notes') || undefined,
    amount_claimed: form.get('amount_claimed') || undefined,
    confirm_email: form.get('confirm_email') || undefined,
    confirm_phone: form.get('confirm_phone') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid transfer details', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const bank = getBankAccount(parsed.data.bank_id);
  if (!bank) {
    return NextResponse.json({ error: 'Unknown bank account' }, { status: 400 });
  }

  const proofFiles = form
    .getAll('proofs')
    .filter((v): v is File => v instanceof File && v.size > 0);
  if (proofFiles.length > MAX_PROOFS) {
    return NextResponse.json({ error: `Maximum ${MAX_PROOFS} proof files.` }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, payment_status, total, amount_paid, amount_due, customer_id, guest_access_token, guest_email, guest_name, guest_phone, compliance_flags',
    )
    .eq('id', parsed.data.order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (
    !(await canSubmitBankProof(
      order,
      parsed.data.confirm_email,
      parsed.data.confirm_phone,
    ))
  ) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (isPaidPaymentStatus(order.payment_status)) {
    return NextResponse.json({ error: 'Order is already paid.' }, { status: 400 });
  }

  const isBalanceLeg =
    order.status === 'confirmed' && order.payment_status === 'partial' && Number(order.amount_due) > 0;
  const canSubmit =
    ['pending_payment', 'payment_review'].includes(order.status) || isBalanceLeg;
  if (!canSubmit) {
    return NextResponse.json(
      { error: 'This order can no longer accept a bank transfer proof.' },
      { status: 400 },
    );
  }

  const orderTotal = roundMoney(Number(order.total ?? 0));
  const amountPaid = roundMoney(Number(order.amount_paid ?? 0));
  let amountClaimed: number;
  try {
    if (amountPaid > 0.009) {
      // Balance leg — must settle the full remaining balance
      const due = roundMoney(orderTotal - amountPaid);
      amountClaimed = parsed.data.amount_claimed != null
        ? roundMoney(parsed.data.amount_claimed)
        : due;
      if (Math.abs(amountClaimed - due) > 0.009) {
        return NextResponse.json(
          { error: `Balance payment must be exactly ₹${due.toLocaleString('en-IN')}.` },
          { status: 400 },
        );
      }
    } else if (parsed.data.amount_claimed != null) {
      const resolved = resolveOnlinePaymentAmount(orderTotal, 0, parsed.data.amount_claimed);
      amountClaimed = resolved.amount;
      if (!order.customer_id && resolved.kind === 'advance') {
        return NextResponse.json(
          { error: 'Sign in to reserve with an advance. Guest checkout must transfer the full amount.' },
          { status: 400 },
        );
      }
    } else {
      amountClaimed = orderTotal;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid payment amount';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const existing = parseBankTransferProof(order.compliance_flags);

  try {
    await ensureBucket(supabase);
    const proofUrls: string[] = [];

    for (const file of proofFiles) {
      if (!isCustomUploadMimeType(file.type)) {
        return NextResponse.json(
          { error: 'Proofs must be JPG, PNG, WebP, or PDF.' },
          { status: 400 },
        );
      }
      if (file.size > CUSTOM_UPLOAD_MAX_BYTES) {
        return NextResponse.json({ error: 'Each proof must be under 10MB.' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      if (!isAllowedUploadSignature(file.type, bytes)) {
        return NextResponse.json(
          { error: 'File content does not match the selected upload type.' },
          { status: 400 },
        );
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const path = `payment-proofs/${order.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 400 });
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);
      proofUrls.push(publicUrl);
    }

    const finalUrls = proofUrls.length > 0 ? proofUrls : existing?.proof_urls ?? [];
    if (finalUrls.length === 0) {
      return NextResponse.json(
        { error: 'Upload at least one payment screenshot or receipt.' },
        { status: 400 },
      );
    }

    const proof = {
      bank_id: bank.id,
      bank_label: bank.label,
      reference: parsed.data.reference,
      amount_claimed: amountClaimed,
      notes: parsed.data.notes,
      proof_urls: finalUrls,
      submitted_at: new Date().toISOString(),
      status: 'pending_review' as const,
    };

    const holdUntil = new Date(Date.now() + BANK_TRANSFER_HOLD_MS).toISOString();
    const db = asUntypedSupabase(supabase);
    const reviewNote = isBalanceLeg
      ? `Balance bank transfer proof submitted (${bank.label}, ref ${parsed.data.reference}, ₹${amountClaimed})`
      : `Bank transfer proof submitted (${bank.label}, ref ${parsed.data.reference}, ₹${amountClaimed})`;
    const { error: updateError } = await db
      .from('orders')
      .update({
        payment_method: 'bank_transfer',
        payment_status: isBalanceLeg ? order.payment_status : 'pending',
        status: isBalanceLeg ? order.status : 'payment_review',
        payment_review_reason: reviewNote,
        reservation_expires_at: holdUntil,
        compliance_flags: mergeBankTransferProof(order.compliance_flags, proof),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('[bank-transfer/submit] update failed', updateError);
      return NextResponse.json({ error: 'Failed to save transfer proof.' }, { status: 500 });
    }

    try {
      await notifyAdmins({
        type: 'bank_transfer_proof',
        title: existing ? 'Bank transfer proof updated' : 'Bank transfer proof submitted',
        message: `Order ${order.order_number}: ${bank.label} · ${parsed.data.reference}`,
        href: `/admin/orders/${order.id}`,
        entityType: 'order',
        entityId: order.id,
        metadata: { order_number: order.order_number, reference: parsed.data.reference },
      });
    } catch {
      // non-blocking
    }

    const recipient = await resolveOrderCustomerEmail(order as Pick<Order, 'guest_email' | 'guest_name' | 'customer_id'>);
    if (recipient) {
      try {
        await sendBankTransferReceivedEmail({
          to: recipient.email,
          customerName: recipient.name,
          orderNumber: order.order_number,
          orderId: order.id,
          bankLabel: bank.label,
          reference: parsed.data.reference,
          isLoggedInCustomer: Boolean(order.customer_id),
          isResubmit: Boolean(existing),
        });
      } catch (emailErr) {
        console.error('[bank-transfer/submit] received email failed', emailErr);
      }
    }

    if (order.customer_id) {
      try {
        await notifyUser({
          recipientUserId: order.customer_id,
          type: 'order_status_update',
          title: 'Bank transfer received',
          message: `We received your transfer for order ${order.order_number}. We will review and confirm within 24 hours.`,
          href: '/account/orders',
          entityType: 'order',
          entityId: order.id,
          metadata: { order_number: order.order_number, status: 'payment_review' },
        });
      } catch {
        // non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      status: 'payment_review',
      bank_transfer: proof,
    });
  } catch (error) {
    console.error('[bank-transfer/submit]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Submit failed' },
      { status: 500 },
    );
  }
}
