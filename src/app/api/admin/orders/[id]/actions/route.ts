import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { hasAdminPermission } from '@/lib/admin/rbac';
import { logAdminAction } from '@/lib/utils/admin-log';
import {
  cancelOrderAndReleaseInventory,
  markProductsSoldForOrder,
  releaseProductsForOrder,
} from '@/lib/inventory/order-availability';
import { notifyUser } from '@/lib/notifications/in-app';
import {
  areReturnImagesVerified,
  isValidReturnStatus,
  mergeComplianceFlags,
  parseComplianceFlags,
  requiresVerifiedReturnImages,
  RETURN_STATUS_LABELS,
  type ReturnStatus,
} from '@/lib/orders/returns';
import { parseBankTransferProof, mergeBankTransferProof } from '@/lib/orders/bank-transfer-proof';
import { finalizeCapturedPayment } from '@/lib/orders/payment-finalization';
import { resolveOrderCustomerEmail } from '@/lib/orders/resolve-order-email';
import { sendBalanceDueEmail } from '@/lib/resend/send-balance-due';
import { sendBankTransferRejectedEmail } from '@/lib/resend/send-bank-transfer-rejected';
import { sendOrderCancelledEmail } from '@/lib/resend/send-order-cancelled';
import { BANK_TRANSFER_HOLD_MS } from '@/lib/constants/bank-accounts';
import type { Order } from '@/lib/types/database';

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('mark_sold'),
  }),
  z.object({
    action: z.literal('cancel'),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal('update_return'),
    return_status: z.string().trim(),
    note: z.string().trim().max(1000).optional(),
  }),
  z.object({
    action: z.literal('verify_return_images'),
  }),
  z.object({
    action: z.literal('verify_bank_transfer'),
  }),
  z.object({
    action: z.literal('request_balance'),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal('reject_bank_transfer'),
    reason: z.string().trim().min(5).max(1000),
  }),
  z.object({
    action: z.literal('record_refund'),
    amount: z.coerce.number().finite().nonnegative(),
    transaction_reference: z.string().trim().min(1).max(160),
    proof_urls: z.array(z.string().url().max(2000)).max(10).default([]),
    notes: z.string().trim().max(2000).optional(),
    method: z.enum(['manual', 'bank_transfer', 'upi', 'razorpay', 'other']).default('manual'),
    restore_stock: z.boolean().default(true),
  }),
]);

const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_PROOF_SIZE = 10 * 1024 * 1024;

async function uploadProofFiles(orderId: string, files: File[]) {
  if (files.length === 0) return [] as string[];
  const admin = createAdminClient();
  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      throw new Error(`Unsupported proof file type: ${file.type || file.name}`);
    }
    if (file.size > MAX_PROOF_SIZE) {
      throw new Error(`Proof file exceeds 10MB: ${file.name}`);
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `refunds/${orderId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await admin.storage.from('products').upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(`Failed to upload proof: ${error.message}`);
    const { data } = admin.storage.from('products').getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

/**
 * POST /api/admin/orders/[id]/actions
 * mark_sold | cancel | record_refund (manual refund with proofs)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ponytail: membership first; record_refund also allowed for accountants (finance.read)
  const auth = await requireAdminAccess();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const contentType = request.headers.get('content-type') || '';

  let parsedBody: unknown;
  let uploadedProofUrls: string[] = [];

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const action = String(form.get('action') || '');
    const proofFiles = form.getAll('proofs').filter((value): value is File => value instanceof File && value.size > 0);
    try {
      uploadedProofUrls = await uploadProofFiles(id, proofFiles);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Proof upload failed' },
        { status: 400 },
      );
    }

    const existingUrls = String(form.get('proof_urls') || '')
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);

    parsedBody = {
      action,
      amount: form.get('amount') ?? undefined,
      transaction_reference: form.get('transaction_reference') ?? undefined,
      proof_urls: [...existingUrls, ...uploadedProofUrls],
      notes: form.get('notes') || undefined,
      method: form.get('method') || 'manual',
      restore_stock: form.get('restore_stock') !== 'false',
      reason: form.get('reason') || undefined,
    };
  } else {
    parsedBody = await request.json().catch(() => null);
  }

  const parsed = actionSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const canWriteOrders = hasAdminPermission(auth.member.role, 'orders.write', auth.member.permissions);
  const canRecordRefund =
    canWriteOrders || hasAdminPermission(auth.member.role, 'finance.read', auth.member.permissions);
  if (parsed.data.action === 'record_refund' ? !canRecordRefund : !canWriteOrders) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);

  const { data: order, error } = await db
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const orderRow = order as {
    id: string;
    order_number: string;
    status: string;
    payment_status: string | null;
    payment_method: string | null;
    total: number;
    amount_paid: number | null;
    amount_due: number | null;
    guest_phone: string | null;
    guest_name: string | null;
    guest_email: string | null;
    customer_id: string | null;
    items: unknown;
    products_marked_sold_at: string | null;
    refund_status: string | null;
    return_status: string | null;
    compliance_flags: unknown;
  };

  if (
    ['cancelled', 'refunded'].includes(orderRow.status) &&
    parsed.data.action !== 'record_refund' &&
    parsed.data.action !== 'update_return'
  ) {
    return NextResponse.json({ error: `Order is already ${orderRow.status}` }, { status: 400 });
  }

  try {
    if (parsed.data.action === 'mark_sold') {
      if (orderRow.products_marked_sold_at) {
        return NextResponse.json({ error: 'Products already marked sold for this order' }, { status: 400 });
      }
      await markProductsSoldForOrder(orderRow);
      const now = new Date().toISOString();
      await db
        .from('orders')
        .update({
          billing_completed_at: now,
          products_marked_sold_at: now,
        })
        .eq('id', id);

      await logAdminAction({
        userId: auth.user.id,
        action: 'order_mark_sold',
        resourceType: 'order',
        resourceId: id,
        details: { order_number: orderRow.order_number },
        ipAddress: getRequestIp(request),
      });

      return NextResponse.json({ success: true, products_marked_sold_at: now });
    }

    if (parsed.data.action === 'cancel') {
      const reason = parsed.data.reason || 'Cancelled by admin';
      await cancelOrderAndReleaseInventory(orderRow, reason);

      if (orderRow.customer_id) {
        await notifyUser({
          recipientUserId: orderRow.customer_id,
          type: 'order_cancelled',
          title: 'Order cancelled',
          message: `Your order ${orderRow.order_number} has been cancelled. ${reason}`,
          href: '/account/orders',
          entityType: 'order',
          entityId: id,
          metadata: { order_number: orderRow.order_number, status: 'cancelled', reason },
        });
      }

      try {
        const recipient = await resolveOrderCustomerEmail(order as Order);
        if (recipient) {
          await sendOrderCancelledEmail({
            to: recipient.email,
            customerName: recipient.name,
            orderNumber: orderRow.order_number,
            reason,
            cancelledBy: 'admin',
          });
        }
      } catch (emailErr) {
        console.error('[admin/orders/actions] cancel email failed', emailErr);
      }

      await logAdminAction({
        userId: auth.user.id,
        action: 'order_cancel',
        resourceType: 'order',
        resourceId: id,
        details: { order_number: orderRow.order_number, reason },
        ipAddress: getRequestIp(request),
      });

      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    if (parsed.data.action === 'update_return') {
      const nextStatus = parsed.data.return_status;
      if (!isValidReturnStatus(nextStatus) || nextStatus === 'none') {
        return NextResponse.json(
          { error: 'Invalid return status' },
          { status: 400 },
        );
      }

      const flags = parseComplianceFlags(orderRow.compliance_flags);
      // Gate refund approval until customer photos are verified
      if (
        nextStatus === 'approved' &&
        requiresVerifiedReturnImages(flags, orderRow.return_status || 'none') &&
        !areReturnImagesVerified(flags)
      ) {
        return NextResponse.json(
          {
            error: 'Verify the customer’s return photos first before approving the return/refund',
          },
          { status: 400 },
        );
      }

      const note = parsed.data.note?.trim() || undefined;
      const compliance_flags = mergeComplianceFlags(flags, {
        ...(note ? { return_admin_note: note } : {}),
      });

      const refundPatch: Record<string, string> = {};
      if (nextStatus === 'approved') refundPatch.refund_status = 'approved';
      if (nextStatus === 'rejected') refundPatch.refund_status = 'rejected';
      if (nextStatus === 'closed') refundPatch.refund_status = orderRow.refund_status === 'completed' ? 'completed' : 'rejected';

      const { error: returnError } = await db
        .from('orders')
        .update({
          return_status: nextStatus,
          compliance_flags,
          ...refundPatch,
        })
        .eq('id', id);

      if (returnError) {
        console.error('[admin/orders/actions] return update failed', returnError);
        return NextResponse.json({ error: 'Failed to update return status' }, { status: 500 });
      }

      if (orderRow.customer_id) {
        const label = RETURN_STATUS_LABELS[nextStatus as ReturnStatus];
        await notifyUser({
          recipientUserId: orderRow.customer_id,
          type: 'order_return_update',
          title: 'Return update',
          message: `Order ${orderRow.order_number}: ${label}${note ? ` — ${note}` : ''}`,
          href: '/account/orders',
          entityType: 'order',
          entityId: id,
          metadata: { order_number: orderRow.order_number, return_status: nextStatus },
        });
      }

      await logAdminAction({
        userId: auth.user.id,
        action: 'order_return_update',
        resourceType: 'order',
        resourceId: id,
        details: {
          order_number: orderRow.order_number,
          return_status: nextStatus,
          note: note ?? null,
        },
        ipAddress: getRequestIp(request),
      });

      return NextResponse.json({ success: true, return_status: nextStatus });
    }

    if (parsed.data.action === 'verify_return_images') {
      const flags = parseComplianceFlags(orderRow.compliance_flags);
      if (!(flags.return_image_urls?.length ?? 0)) {
        return NextResponse.json(
          { error: 'No customer return photos to verify' },
          { status: 400 },
        );
      }

      const compliance_flags = mergeComplianceFlags(flags, {
        return_images_verified: true,
        return_images_verified_at: new Date().toISOString(),
      });

      const { error: verifyError } = await db
        .from('orders')
        .update({ compliance_flags })
        .eq('id', id);

      if (verifyError) {
        console.error('[admin/orders/actions] verify images failed', verifyError);
        return NextResponse.json({ error: 'Failed to verify return photos' }, { status: 500 });
      }

      if (orderRow.customer_id) {
        await notifyUser({
          recipientUserId: orderRow.customer_id,
          type: 'order_return_update',
          title: 'Return photos verified',
          message: `We verified the photos for order ${orderRow.order_number}. Your return/refund can now proceed.`,
          href: '/account/orders',
          entityType: 'order',
          entityId: id,
          metadata: { order_number: orderRow.order_number, return_images_verified: true },
        });
      }

      await logAdminAction({
        userId: auth.user.id,
        action: 'order_return_images_verified',
        resourceType: 'order',
        resourceId: id,
        details: {
          order_number: orderRow.order_number,
          image_count: flags.return_image_urls?.length ?? 0,
        },
        ipAddress: getRequestIp(request),
      });

      return NextResponse.json({
        success: true,
        return_images_verified: true,
        compliance_flags,
      });
    }

    if (parsed.data.action === 'verify_bank_transfer') {
      const proof = parseBankTransferProof(orderRow.compliance_flags);
      if (!proof || proof.proof_urls.length === 0) {
        return NextResponse.json(
          { error: 'No bank transfer proof on this order' },
          { status: 400 },
        );
      }
      if (orderRow.payment_status === 'captured') {
        return NextResponse.json({ error: 'Payment already captured' }, { status: 400 });
      }

      const marked = mergeBankTransferProof(orderRow.compliance_flags, {
        ...proof,
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: auth.user.id,
        rejected_at: undefined,
        reject_reason: undefined,
        rejected_by: undefined,
      });

      await db.from('orders').update({ compliance_flags: marked }).eq('id', id);

      await finalizeCapturedPayment({
        order: order as Order,
        method: 'bank_transfer',
      });

      if (orderRow.customer_id) {
        await notifyUser({
          recipientUserId: orderRow.customer_id,
          type: 'order_status_update',
          title: 'Payment verified',
          message: `Bank transfer for order ${orderRow.order_number} was verified. Your order is confirmed.`,
          href: '/account/orders',
          entityType: 'order',
          entityId: id,
          metadata: { order_number: orderRow.order_number, status: 'confirmed' },
        });
      }

      await logAdminAction({
        userId: auth.user.id,
        action: 'order_verify_bank_transfer',
        resourceType: 'order',
        resourceId: id,
        details: {
          order_number: orderRow.order_number,
          reference: proof.reference,
          bank_id: proof.bank_id,
        },
        ipAddress: getRequestIp(request),
      });

      return NextResponse.json({
        success: true,
        status: 'confirmed',
        payment_status: 'captured',
      });
    }

    if (parsed.data.action === 'reject_bank_transfer') {
      const proof = parseBankTransferProof(orderRow.compliance_flags);
      if (!proof || proof.proof_urls.length === 0) {
        return NextResponse.json(
          { error: 'No bank transfer proof on this order' },
          { status: 400 },
        );
      }
      if (orderRow.payment_status === 'captured') {
        return NextResponse.json({ error: 'Payment already captured' }, { status: 400 });
      }

      const reason = parsed.data.reason.trim();
      const now = new Date().toISOString();
      const rejected = mergeBankTransferProof(orderRow.compliance_flags, {
        ...proof,
        status: 'rejected',
        rejected_at: now,
        reject_reason: reason,
        rejected_by: auth.user.id,
        verified_at: undefined,
        verified_by: undefined,
      });

      const holdUntil = new Date(Date.now() + BANK_TRANSFER_HOLD_MS).toISOString();
      const { error: rejectError } = await db
        .from('orders')
        .update({
          compliance_flags: rejected,
          payment_method: 'bank_transfer',
          payment_status: 'pending',
          status: 'pending_payment',
          payment_review_reason: reason,
          reservation_expires_at: holdUntil,
        })
        .eq('id', id);

      if (rejectError) {
        console.error('[admin/orders/actions] reject bank transfer failed', rejectError);
        return NextResponse.json({ error: 'Failed to reject bank transfer proof' }, { status: 500 });
      }

      const recipient = await resolveOrderCustomerEmail(order as Order);
      if (recipient) {
        try {
          await sendBankTransferRejectedEmail({
            to: recipient.email,
            customerName: recipient.name,
            orderNumber: orderRow.order_number,
            orderId: id,
            rejectReason: reason,
            isLoggedInCustomer: Boolean(orderRow.customer_id),
          });
        } catch (emailErr) {
          console.error('[admin/orders/actions] reject email failed', emailErr);
        }
      }

      if (orderRow.customer_id) {
        await notifyUser({
          recipientUserId: orderRow.customer_id,
          type: 'order_status_update',
          title: 'Payment proof needs an update',
          message: `Bank transfer for order ${orderRow.order_number} was not verified: ${reason}`,
          href: '/account/orders',
          entityType: 'order',
          entityId: id,
          metadata: { order_number: orderRow.order_number, status: 'pending_payment', reject_reason: reason },
        });
      }

      await logAdminAction({
        userId: auth.user.id,
        action: 'order_reject_bank_transfer',
        resourceType: 'order',
        resourceId: id,
        details: {
          order_number: orderRow.order_number,
          reference: proof.reference,
          reason,
        },
        ipAddress: getRequestIp(request),
      });

      return NextResponse.json({
        success: true,
        status: 'pending_payment',
        payment_status: 'pending',
        compliance_flags: rejected,
        reject_reason: reason,
      });
    }

    if (parsed.data.action === 'request_balance') {
      const amountPaid = Number(orderRow.amount_paid ?? 0);
      const amountDue = Number(
        orderRow.amount_due ?? Math.max(0, Number(orderRow.total) - amountPaid),
      );

      if (amountDue <= 0.009) {
        return NextResponse.json({ error: 'This order has no outstanding balance.' }, { status: 400 });
      }
      // Only account holders can settle a balance online, so there is nowhere to
      // send a guest. Take payment at the counter instead.
      if (!orderRow.customer_id) {
        return NextResponse.json(
          { error: 'This is a guest order with no account to notify. Record the payment manually instead.' },
          { status: 400 },
        );
      }

      const note = parsed.data.note?.trim() || null;
      const recipient = await resolveOrderCustomerEmail(order as Order);
      let emailId: string | null = null;
      if (recipient) {
        try {
          emailId = await sendBalanceDueEmail({
            to: recipient.email,
            customerName: recipient.name,
            orderNumber: orderRow.order_number,
            total: Number(orderRow.total),
            amountPaid,
            amountDue,
            note,
          });
        } catch (emailErr) {
          console.error('[admin/orders/actions] balance due email failed', emailErr);
        }
      }

      await notifyUser({
        recipientUserId: orderRow.customer_id,
        type: 'order_balance_due',
        title: 'Your order is ready — balance due',
        message: `Order ${orderRow.order_number} is ready. Pay the remaining ₹${amountDue.toLocaleString('en-IN')} to schedule dispatch.${note ? ` ${note}` : ''}`,
        href: '/account/orders',
        entityType: 'order',
        entityId: id,
        metadata: {
          order_number: orderRow.order_number,
          amount_due: amountDue,
          amount_paid: amountPaid,
        },
      });

      const now = new Date().toISOString();
      await db.from('orders').update({ balance_due_notified_at: now }).eq('id', id);

      await db.from('order_tracking_events').insert({
        order_id: id,
        status: orderRow.status,
        event_time: now,
        note: `Balance payment requested: ₹${amountDue.toLocaleString('en-IN')} due.${note ? ` ${note}` : ''}`,
        is_customer_visible: true,
        created_by: auth.user.id,
      });

      await db.from('notification_log').insert({
        type: 'email',
        recipient: recipient?.email ?? 'unknown',
        template: 'order_balance_due',
        context: {
          order_id: id,
          order_number: orderRow.order_number,
          amount_due: amountDue,
          resend_message_id: emailId,
        },
        status: emailId ? 'sent' : 'failed',
      });

      await logAdminAction({
        userId: auth.user.id,
        action: 'order_request_balance',
        resourceType: 'order',
        resourceId: id,
        details: { order_number: orderRow.order_number, amount_due: amountDue, note },
        ipAddress: getRequestIp(request),
      });

      return NextResponse.json({
        success: true,
        amount_due: amountDue,
        email_sent: Boolean(emailId),
        balance_due_notified_at: now,
      });
    }

    if (parsed.data.action !== 'record_refund') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // record_refund — manual offline refund with transaction proof
    const refund = parsed.data;
    const refundFlags = parseComplianceFlags(orderRow.compliance_flags);
    if (
      requiresVerifiedReturnImages(refundFlags, orderRow.return_status || 'none') &&
      !areReturnImagesVerified(refundFlags)
    ) {
      return NextResponse.json(
        {
          error:
            'Verify the customer’s return photos before recording a refund for this order',
        },
        { status: 400 },
      );
    }
    const gatewayPayload = {
      method: refund.method,
      transaction_reference: refund.transaction_reference,
      proof_urls: refund.proof_urls,
      notes: refund.notes ?? null,
      recorded_by: auth.user.id,
    };
    const baseRefundRow = {
      order_id: id,
      provider: refund.method === 'razorpay' ? 'razorpay' : 'manual',
      provider_refund_id: refund.transaction_reference,
      amount: refund.amount,
      refund_type: refund.amount < Number(orderRow.total) ? 'partial' : 'full',
      status: 'processed',
      reason: refund.notes ?? 'Manual refund recorded by admin',
      gateway_payload: gatewayPayload,
      processed_by: auth.user.id,
      processed_at: new Date().toISOString(),
    };

    // Prefer week33 proof columns; fall back to gateway_payload-only if migration not applied
    let refundInsert = await db
      .from('refund_records')
      .insert({
        ...baseRefundRow,
        transaction_reference: refund.transaction_reference,
        proof_urls: refund.proof_urls,
        notes: refund.notes ?? null,
        method: refund.method,
      })
      .select('id')
      .single();

    if (refundInsert.error) {
      refundInsert = await db.from('refund_records').insert(baseRefundRow).select('id').single();
    }

    if (refundInsert.error || !refundInsert.data) {
      console.error('[admin/orders/actions] refund insert failed', refundInsert.error);
      return NextResponse.json({ error: 'Failed to save refund record' }, { status: 500 });
    }

    const refundRow = refundInsert.data as { id: string };

    await db
      .from('orders')
      .update({
        status: 'refunded',
        payment_status: 'refunded',
        refund_status: 'completed',
      })
      .eq('id', id);

    if (refund.restore_stock) {
      await releaseProductsForOrder(orderRow);
    }

    await logAdminAction({
      userId: auth.user.id,
      action: 'order_manual_refund',
      resourceType: 'order',
      resourceId: id,
      details: {
        order_number: orderRow.order_number,
        refund_id: refundRow.id,
        amount: refund.amount,
        transaction_reference: refund.transaction_reference,
        proof_count: refund.proof_urls.length,
        restore_stock: refund.restore_stock,
      },
      ipAddress: getRequestIp(request),
    });

    return NextResponse.json({
      success: true,
      refund_id: refundRow.id,
      status: 'refunded',
    });
  } catch (error) {
    console.error('[admin/orders/actions]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 },
    );
  }
}
