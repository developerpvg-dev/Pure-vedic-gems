import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';
import { isProductFunnelEvent } from '@/lib/commerce/product-funnel';

type Body = {
  session_id?: string;
  event?: string;
  page_path?: string;
  category?: string;
  product_id?: string;
  product_sku?: string;
  product_name?: string;
  source?: string;
  meta?: Record<string, unknown>;
  checkout_draft?: {
    step?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    cart_snapshot?: unknown;
    shipping_snapshot?: unknown;
  };
  clear_checkout_draft?: boolean;
  _hp?: string;
};

function trimStr(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function hasContact(draft: NonNullable<Body['checkout_draft']>): boolean {
  return Boolean(trimStr(draft.email, 255) || trimStr(draft.phone, 40));
}

/** Cap cart JSON so abandon drafts stay small. */
function slimCartSnapshot(snap: unknown): unknown[] {
  if (!Array.isArray(snap)) return [];
  return snap.slice(0, 20).map((item) => {
    if (!item || typeof item !== 'object') return item;
    const row = item as Record<string, unknown>;
    return {
      product_id: typeof row.product_id === 'string' ? row.product_id.slice(0, 40) : null,
      sku: typeof row.sku === 'string' ? row.sku.slice(0, 80) : null,
      name: typeof row.name === 'string' ? row.name.slice(0, 200) : null,
      quantity: typeof row.quantity === 'number' ? row.quantity : 1,
      price: typeof row.price === 'number' ? row.price : null,
    };
  });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // ponytail: 40/min/IP — funnel writes are firehose; DB unique indexes swallow duplicates
  if (!rateLimit(`product-funnel:${ip}`, 40, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body._hp && String(body._hp).trim()) {
    return NextResponse.json({ ok: true });
  }

  const sessionId = trimStr(body.session_id, 80);
  if (!sessionId) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
  if (!rateLimit(`product-funnel-sid:${sessionId}`, 60, 60_000)) {
    return NextResponse.json({ ok: true }); // soft-drop, don't punish UX
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  if (body.clear_checkout_draft) {
    await db
      .from('checkout_abandon_drafts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('is_active', true);
  }

  if (body.checkout_draft && typeof body.checkout_draft === 'object' && hasContact(body.checkout_draft)) {
    const draft = body.checkout_draft;
    const row = {
      session_id: sessionId,
      step: trimStr(draft.step, 40) || 'contact',
      full_name: trimStr(draft.full_name, 200),
      email: trimStr(draft.email, 255)?.toLowerCase() ?? null,
      phone: trimStr(draft.phone, 40),
      cart_snapshot: slimCartSnapshot(draft.cart_snapshot),
      shipping_snapshot: draft.shipping_snapshot ?? null,
      page_path: trimStr(body.page_path, 300),
      is_active: true,
      updated_at: new Date().toISOString(),
    };
    // One round-trip: try update active row; insert only if none updated
    const { data: updated, error: updErr } = await db
      .from('checkout_abandon_drafts')
      .update(row)
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .select('id');
    if (updErr) {
      console.error('[product-funnel] draft update failed', updErr);
    } else if (!Array.isArray(updated) || !updated.length) {
      const { error: insErr } = await db.from('checkout_abandon_drafts').insert(row);
      if (insErr && insErr.code !== '23505') {
        console.error('[product-funnel] draft insert failed', insErr);
      }
    }
  }

  if (body.event) {
    if (!isProductFunnelEvent(body.event)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }
    const meta =
      body.meta && typeof body.meta === 'object' && Object.keys(body.meta).length > 0
        ? body.meta
        : {};
    const { error } = await db.from('product_funnel_events').insert({
      event: body.event,
      session_id: sessionId,
      page_path: trimStr(body.page_path, 300),
      category: trimStr(body.category, 120),
      product_id: trimStr(body.product_id, 40),
      product_sku: trimStr(body.product_sku, 80),
      product_name: trimStr(body.product_name, 300),
      source: trimStr(body.source, 80),
      meta,
    });
    // Unique dedupe — ignore conflicts (expected on refresh / double-click)
    if (error && error.code !== '23505') {
      console.error('[product-funnel] insert failed', error);
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
