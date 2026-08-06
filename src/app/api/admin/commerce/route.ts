import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import type { Json } from '@/lib/types/database';
import { asUntypedSupabase, type UntypedSupabase } from '@/lib/supabase/untyped';
import { normalizeCurrencyRates } from '@/lib/admin/commerce-currency';
import { bustCurrencyRatesCache } from '@/lib/currency/cached-rates';

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
  cost: z.coerce.number().finite().positive('Shipping cost must be greater than zero'),
  free_above: z.literal(null).optional(),
  min_order_amount: nullableNumber,
  max_order_amount: nullableNumber,
  estimated_days_min: nullableNumber,
  estimated_days_max: nullableNumber,
  country_code: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  zones: csvList.optional(),
  is_active: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const shippingCountrySchema = z.object({
  code: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  requires_indian_pincode: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
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
  const [shippingMethods, coupons, currencyRates, commerceSettings, shippingCountries] = await Promise.all([
    readTable(db, 'shipping_methods', []),
    readTable(db, 'coupons', []),
    readTable(db, 'currency_rates', []),
    readTable(db, 'commerce_settings', []),
    readTable(db, 'shipping_countries', []),
  ]);

  return NextResponse.json({
    shippingMethods,
    shippingCountries,
    coupons,
    currencyRates: normalizeCurrencyRates(currencyRates),
    commerceSettings: Array.isArray(commerceSettings) ? commerceSettings[0] ?? null : null,
  });
}

async function saveCurrencyRate(
  db: UntypedSupabase,
  data: z.infer<typeof currencySchema>,
  now: string
) {
  const currency = data.currency;
  const rate = currency === 'INR' ? 1 : Number(Number(data.rate).toFixed(6));

  const modernPayload = {
    base_currency: data.base_currency || 'INR',
    currency,
    rate,
    rate_to_inr: rate,
    manual_override: data.manual_override,
    source: data.source,
    is_active: data.is_active,
    updated_at: now,
    fetched_at: now,
  };

  // Prefer update-by-currency so legacy + modern rows both get live rates.
  const existing = await db
    .from('currency_rates')
    .select('id')
    .eq('currency', currency)
    .limit(1)
    .maybeSingle();

  const existingId =
    existing.data && typeof existing.data === 'object' && 'id' in existing.data
      ? String((existing.data as { id: unknown }).id ?? '')
      : '';

  if (existingId) {
    let result = await db
      .from('currency_rates')
      .update(modernPayload)
      .eq('id', existingId)
      .select()
      .single();

    if (result.error) {
      result = await db
        .from('currency_rates')
        .update({
          rate_to_inr: rate,
          manual_override: data.manual_override,
          source: data.source,
          fetched_at: now,
        })
        .eq('id', existingId)
        .select()
        .single();
    }
    return result;
  }

  let result = await db
    .from('currency_rates')
    .upsert(modernPayload, { onConflict: 'base_currency,currency' })
    .select()
    .single();

  if (result.error) {
    result = await db
      .from('currency_rates')
      .upsert(
        {
          currency,
          rate_to_inr: rate,
          manual_override: data.manual_override,
          source: data.source,
          fetched_at: now,
        },
        { onConflict: 'currency' }
      )
      .select()
      .single();
  }

  return result;
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
    const payload = {
      ...parsed.data,
      id: parsed.data.id ?? slugify(parsed.data.label),
      free_above: null,
      zones: parsed.data.zones?.length ? parsed.data.zones : [parsed.data.country_code],
      updated_at: now,
    };
    const { data, error } = await db.from('shipping_methods').upsert(payload, { onConflict: 'id' }).select().single();
    if (error) return NextResponse.json({ error: 'Failed to save shipping method' }, { status: 500 });
    result = data;
    action = 'shipping_setting_change';
  } else if (body.resource === 'shipping_country') {
    const parsed = shippingCountrySchema.safeParse(body.payload);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const payload = { ...parsed.data, updated_at: now };
    const { data, error } = await db.from('shipping_countries').upsert(payload, { onConflict: 'code' }).select().single();
    if (error) return NextResponse.json({ error: 'Failed to save shipping country' }, { status: 500 });
    result = data;
    action = 'shipping_country_change';
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
    const { data, error } = await saveCurrencyRate(
      db,
      {
        ...parsed.data,
        // Form edits are always stored as admin-owned until the next API refresh.
        source: parsed.data.source === 'manual' || parsed.data.manual_override ? 'manual' : parsed.data.source,
      },
      now
    );
    if (error) return NextResponse.json({ error: 'Failed to save currency rate' }, { status: 500 });
    bustCurrencyRatesCache();
    result = data;
    action = 'currency_rate_change';
  } else if (body.resource === 'currency_refresh') {
    // Explicit admin refresh: overwrite every storefront FX + any other active DB currencies.
    const { fetchLiveRatesToInr } = await import('@/lib/currency/fetch-live-rates');
    const { FX_CURRENCY_CODES } = await import('@/lib/currency/catalog');
    try {
      const existing = normalizeCurrencyRates(await readTable(db, 'currency_rates', []));
      const byCode = new Map(existing.map((row) => [row.currency, row]));
      const codes = Array.from(
        new Set([
          ...FX_CURRENCY_CODES,
          ...existing.map((row) => row.currency).filter((code) => code && code !== 'INR'),
        ])
      );

      const live = await fetchLiveRatesToInr(codes);
      const updated: Array<{ currency: string; rate: number }> = [];
      const failed: Array<{ currency: string; error: string }> = [];

      const inrSave = await saveCurrencyRate(
        db,
        {
          base_currency: 'INR',
          currency: 'INR',
          rate: 1,
          manual_override: false,
          source: live.source,
          is_active: true,
        },
        now
      );
      if (inrSave.error) {
        failed.push({ currency: 'INR', error: inrSave.error.message ?? 'Save failed' });
      } else {
        updated.push({ currency: 'INR', rate: 1 });
      }

      for (const code of codes) {
        const rate = live.rates[code];
        if (!rate) {
          failed.push({ currency: code, error: 'Missing from live API' });
          continue;
        }
        const prev = byCode.get(code);
        const { error } = await saveCurrencyRate(
          db,
          {
            base_currency: 'INR',
            currency: code,
            rate,
            manual_override: false,
            source: live.source,
            is_active: prev?.is_active ?? true,
          },
          now
        );
        if (error) failed.push({ currency: code, error: error.message ?? 'Save failed' });
        else updated.push({ currency: code, rate });
      }

      if (updated.length <= 1 && failed.length > 0) {
        return NextResponse.json(
          { error: 'Failed to save live rates', details: failed },
          { status: 500 }
        );
      }

      bustCurrencyRatesCache();
      result = {
        updated: updated.map((row) => row.currency),
        rates: Object.fromEntries(updated.map((row) => [row.currency, row.rate])),
        failed,
        date: live.date,
        source: live.source,
        sample: { USD: live.rates.USD ?? null },
      };
      action = 'currency_rates_refresh';
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to refresh currency rates' },
        { status: 502 }
      );
    }
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
  } else if (resource === 'shipping_country') {
    ({ error } = await db.from('shipping_countries').update({ is_active: false, updated_at: new Date().toISOString() }).eq('code', id));
  } else if (resource === 'coupon') {
    ({ error } = await db.from('coupons').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id));
  } else if (resource === 'currency') {
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    if (isUuid) {
      ({ error } = await db.from('currency_rates').delete().eq('id', id));
    }
    if (!isUuid || error) {
      ({ error } = await db.from('currency_rates').delete().eq('currency', id.toUpperCase()));
    }
  } else {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }

  if (error) return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  if (resource === 'currency') bustCurrencyRatesCache();
  await logAdminAction({
    userId: auth.user.id,
    action: `${resource}_disable`,
    resourceType: resource,
    resourceId: id,
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true });
}