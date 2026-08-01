import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { openRingSizeConfirmToken } from '@/lib/orders/ring-size-confirmation-token';
import {
  parseRingSizeConfirmation,
  recordRingSizeConfirmationUpload,
} from '@/lib/orders/ring-size-confirmation';
import {
  CUSTOM_UPLOAD_MAX_BYTES,
  CUSTOM_UPLOAD_MIME_TYPES,
  isAllowedUploadSignature,
  isCustomUploadMimeType,
} from '@/lib/security/file-validation';
import { rateLimit } from '@/lib/utils/rate-limit';
import { notifyAdmins } from '@/lib/notifications/in-app';

const BUCKET = 'custom-uploads';
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: CUSTOM_UPLOAD_MAX_BYTES,
      allowedMimeTypes: [...CUSTOM_UPLOAD_MIME_TYPES],
    });
    if (error) throw new Error(error.message);
  }
}

/**
 * POST /api/orders/ring-size-confirmation
 * multipart: token + file (image)
 * Token-gated — no login required.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`ring-size-confirm:${ip}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many uploads. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const token = typeof formData.get('token') === 'string' ? String(formData.get('token')).trim() : '';
  const file = formData.get('file');

  if (!token) {
    return NextResponse.json({ error: 'Invalid confirmation link' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Please choose a photo to upload.' }, { status: 400 });
  }
  if (!isCustomUploadMimeType(file.type) || !IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Please upload a JPG, PNG, or WebP image.' }, { status: 400 });
  }
  if (file.size > CUSTOM_UPLOAD_MAX_BYTES) {
    return NextResponse.json({ error: 'File size must be under 10MB.' }, { status: 400 });
  }

  const opened = openRingSizeConfirmToken(token);
  if (!opened) {
    return NextResponse.json({ error: 'This link is invalid or expired' }, { status: 400 });
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);
  const { data: orderRaw, error } = await db
    .from('orders')
    .select('id, order_number, compliance_flags')
    .eq('id', opened.orderId)
    .single();

  if (error || !orderRaw) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = orderRaw as {
    id: string;
    order_number: string;
    compliance_flags: unknown;
  };

  const current = parseRingSizeConfirmation(order.compliance_flags);
  if (!current) {
    return NextResponse.json({ error: 'Ring size confirmation was not requested for this order' }, { status: 400 });
  }
  if (current.status === 'submitted' && current.image_url) {
    return NextResponse.json({
      success: true,
      already_submitted: true,
      image_url: current.image_url,
    });
  }

  await ensureBucket(admin);

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!isAllowedUploadSignature(file.type, bytes)) {
    return NextResponse.json(
      { error: 'File content does not match the selected upload type.' },
      { status: 400 },
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `ring-size/${order.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  let result: ReturnType<typeof recordRingSizeConfirmationUpload>;
  try {
    result = recordRingSizeConfirmationUpload(order.compliance_flags, publicUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not save upload' },
      { status: 400 },
    );
  }

  const { error: updateError } = await db
    .from('orders')
    .update({ compliance_flags: result.flags })
    .eq('id', order.id);

  if (updateError) {
    console.error('[ring-size-confirmation]', updateError);
    return NextResponse.json({ error: 'Could not save your photo' }, { status: 500 });
  }

  await db.from('order_tracking_events').insert({
    order_id: order.id,
    status: 'ring_size_photo_submitted',
    event_time: new Date().toISOString(),
    note: 'Customer submitted ring internal-diameter measurement photo.',
    is_customer_visible: true,
  });

  await notifyAdmins({
    type: 'ring_size_confirmation',
    title: 'Ring size photo received',
    message: `Customer submitted a ring diameter photo for order ${order.order_number}.`,
    href: `/admin/orders/${order.id}`,
    entityType: 'order',
    entityId: order.id,
    recipientRole: 'fulfillment',
    metadata: { order_number: order.order_number, image_url: publicUrl },
  });

  return NextResponse.json({
    success: true,
    already_submitted: false,
    image_url: result.confirmation.image_url,
  });
}
