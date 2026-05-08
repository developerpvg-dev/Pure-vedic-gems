import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import type { Json } from '@/lib/types/database';
import { asUntypedSupabase, type UntypedSupabase } from '@/lib/supabase/untyped';

const nullableNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().finite().nonnegative().nullable()
);

const numberWithDefault = (defaultValue: number) => z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? defaultValue : Number(value)),
  z.number().finite().nonnegative()
);

const csvList = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}, z.array(z.string().trim().min(1)).default([]));

const shippingSchema = z.object({
  id: z.string().trim().min(2).max(40).regex(/^[a-z0-9_-]+$/).optional(),
  label: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional().nullable(),
  cost: numberWithDefault(0),
  free_above: nullableNumber,
  min_order_amount: nullableNumber,
  max_order_amount: nullableNumber,
  estimated_days_min: nullableNumber,
  estimated_days_max: nullableNumber,
  zones: csvList,
  is_active: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: numberWithDefault(0),
  min_order_amount: numberWithDefault(0),
  max_discount: nullableNumber,
  usage_limit: nullableNumber,
  usage_limit_per_customer: nullableNumber,
  valid_from: z.string().trim().optional(),
  valid_until: z.string().trim().optional().nullable(),
  applies_to_product_ids: csvList,
  applies_to_category_slugs: csvList,
  excluded_product_ids: csvList,
  excluded_category_slugs: csvList,
  first_time_customers_only: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const currencySchema = z.object({
  id: z.string().uuid().optional(),
  base_currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('INR'),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  rate: z.coerce.number().finite().positive(),
  manual_override: z.coerce.boolean().default(false),
  source: z.string().trim().max(80).default('manual'),
  is_active: z.coerce.boolean().default(true),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
}

async function readTable(db: UntypedSupabase, table: string, fallback: unknown) {
  try {
    const { data, error } = await db.from(table).select('*');
    if (error) return fallback;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const auth = await requireAdminAccess('settings.commerce');
  if ('error' in auth) return auth.error;

  const db = asUntypedSupabase(createAdminClient());
  const [shippingMethods, coupons, currencyRates, commerceSettings] = await Promise.all([
    readTable(db, 'shipping_methods', []),
    readTable(db, 'coupons', []),
    readTable(db, 'currency_rates', []),
    readTable(db, 'commerce_settings', []),
  ]);

  return NextResponse.json({
    shippingMethods,
    coupons,
    currencyRates,
    commerceSettings: Array.isArray(commerceSettings) ? commerceSettings[0] ?? null : null,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('settings.commerce');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as { resource?: string; payload?: unknown } | null;
  if (!body?.resource) return NextResponse.json({ error: 'resource is required' }, { status: 400 });

  const db = asUntypedSupabase(createAdminClient());
  const now = new Date().toISOString();
  let result: unknown = null;
  let action = 'commerce_setting_change';

  if (body.resource === 'shipping') {
    const parsed = shippingSchema.safeParse(body.payload);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const payload = { ...parsed.data, id: parsed.data.id ?? slugify(parsed.data.label), zones: parsed.data.zones.length ? parsed.data.zones : ['IN'], updated_at: now };
    const { data, error } = await db.from('shipping_methods').upsert(payload, { onConflict: 'id' }).select().single();
    if (error) return NextResponse.json({ error: 'Failed to save shipping method' }, { status: 500 });
    result = data;
    action = 'shipping_setting_change';
  } else if (body.resource === 'coupon') {
    const parsed = couponSchema.safeParse(body.payload);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const payload = {
      ...parsed.data,
      valid_from: parsed.data.valid_from || new Date().toISOString(),
      valid_until: parsed.data.valid_until || null,
      updated_at: now,
    };
    const { data, error } = await db.from('coupons').upsert(payload, { onConflict: parsed.data.id ? 'id' : 'code' }).select().single();
    if (error) return NextResponse.json({ error: 'Failed to save coupon' }, { status: 500 });
    result = data;
    action = 'coupon_edit';
  } else if (body.resource === 'currency') {
    const parsed = currencySchema.safeParse(body.payload);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { data, error } = await db.from('currency_rates').upsert({ ...parsed.data, updated_at: now }, { onConflict: 'base_currency,currency' }).select().single();
    if (error) return NextResponse.json({ error: 'Failed to save currency rate' }, { status: 500 });
    result = data;
    action = 'currency_rate_change';
  } else if (body.resource === 'settings') {
    const values = (body.payload ?? {}) as Json;
    const { data, error } = await db.from('commerce_settings').upsert({ id: 'commerce', values, updated_by: auth.user.id, updated_at: now }, { onConflict: 'id' }).select().single();
    if (error) return NextResponse.json({ error: 'Failed to save commerce settings' }, { status: 500 });
    result = data;
  } else {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }

  await logAdminAction({
    userId: auth.user.id,
    action,
    resourceType: body.resource,
    details: body.payload as Record<string, unknown>,
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true, data: result });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess('settings.commerce');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const resource = searchParams.get('resource');
  const id = searchParams.get('id');
  if (!resource || !id) return NextResponse.json({ error: 'resource and id are required' }, { status: 400 });

  const db = asUntypedSupabase(createAdminClient());
  let error: unknown = null;
  if (resource === 'shipping') {
    ({ error } = await db.from('shipping_methods').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id));
  } else if (resource === 'coupon') {
    ({ error } = await db.from('coupons').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id));
  } else if (resource === 'currency') {
    ({ error } = await db.from('currency_rates').delete().eq('id', id));
  } else {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }

  if (error) return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  await logAdminAction({
    userId: auth.user.id,
    action: `${resource}_disable`,
    resourceType: resource,
    resourceId: id,
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true });
}