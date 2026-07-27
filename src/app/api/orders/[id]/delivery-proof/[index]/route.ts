import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import {
  parseProofOfDelivery,
  resolveDeliveryStorageRef,
} from '@/lib/orders/dispatch-proof';

const SIGNED_URL_TTL_SEC = 15 * 60; // ponytail: 15m; bump if customers leave tab open longer

/**
 * GET /api/orders/[id]/delivery-proof/[index]
 * Auth-gated: order owner or admin with orders.read.
 * Redirects to a short-lived signed URL (or legacy public URL).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  const { id, index: indexRaw } = await params;
  const index = Number(indexRaw);
  if (!Number.isInteger(index) || index < 0 || index > 7) {
    return NextResponse.json({ error: 'Invalid image index' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);
  const { data: order } = await db
    .from('orders')
    .select('id, customer_id, compliance_flags')
    .eq('id', id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const orderRow = order as { id: string; customer_id: string | null; compliance_flags: unknown };
  const isOwner = orderRow.customer_id === user.id;
  if (!isOwner) {
    const auth = await requireAdminAccess('orders.read');
    if ('error' in auth) return auth.error;
  }

  const proof = parseProofOfDelivery(orderRow.compliance_flags);
  const ref = proof?.image_urls[index];
  if (!ref) {
    return NextResponse.json({ error: 'Proof image not found' }, { status: 404 });
  }

  const resolved = resolveDeliveryStorageRef(ref);
  if (!resolved) {
    return NextResponse.json({ error: 'Invalid proof reference' }, { status: 400 });
  }

  if ('publicUrl' in resolved) {
    return NextResponse.redirect(resolved.publicUrl, 302);
  }

  const { data, error } = await admin.storage
    .from(resolved.bucket)
    .createSignedUrl(resolved.path, SIGNED_URL_TTL_SEC);

  if (error || !data?.signedUrl) {
    console.error('[delivery-proof] sign error:', error);
    return NextResponse.json({ error: 'Failed to resolve proof image' }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl, 302);
}
