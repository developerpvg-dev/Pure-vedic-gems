import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { parseProofOfDelivery, resolveDeliveryStorageRef } from '@/lib/orders/dispatch-proof';
import { openDeliveryProofToken } from '@/lib/orders/dispatch-proof-token';

/**
 * GET /api/p/[token]
 * Opaque delivery-proof link for email — no order id / storage path in the URL.
 * Streams the image so the browser never sees the Supabase object path.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const opened = openDeliveryProofToken(token);
  if (!opened) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);
  const { data: order } = await db
    .from('orders')
    .select('id, compliance_flags')
    .eq('id', opened.orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const proof = parseProofOfDelivery((order as { compliance_flags: unknown }).compliance_flags);
  const ref = proof?.image_urls[opened.index];
  if (!ref) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const resolved = resolveDeliveryStorageRef(ref);
  if (!resolved) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if ('publicUrl' in resolved) {
    // Legacy public files — proxy fetch so the email link stays on our domain
    const upstream = await fetch(resolved.publicUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
      },
    });
  }

  const { data, error } = await admin.storage.from(resolved.bucket).download(resolved.path);
  if (error || !data) {
    console.error('[pod] download error:', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ext = resolved.path.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
          ? 'image/gif'
          : 'image/jpeg';

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
