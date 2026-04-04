import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/configurations
 * Saves a product configuration to the database with SERVER-SIDE price calculation.
 * Returns the configuration_id and a verified total price.
 * NEVER trusts client-sent prices.
 */

const ConfigurationSchema = z.object({
  product_id: z.string().uuid(),
  setting_type: z.enum(['ring', 'pendant', 'bracelet', 'loose']).nullable(),
  design_id: z.string().uuid().nullable(),
  custom_design_url: z.string().url().nullable().optional(),
  metal: z.string().nullable(),
  ring_size: z.string().nullable().optional(),
  chain_length: z.string().nullable().optional(),
  certification_id: z.string().uuid().nullable(),
  energization_id: z.string().uuid().nullable(),
  energization_form: z
    .object({
      dob: z.string(),
      gotra: z.string(),
      rashi: z.string(),
      record_ceremony: z.boolean(),
    })
    .nullable()
    .optional(),
});

// Simple in-memory rate limiter per IP (10 configs per 5 minutes)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 5 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many configuration requests. Please wait a few minutes.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ConfigurationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const admin = createAdminClient();

  // ── 1. Fetch product price ────────────────────────────────────────────
  const { data: product, error: prodError } = await admin
    .from('products')
    .select('id, price, in_stock')
    .eq('id', input.product_id)
    .single();

  if (prodError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  if (!product.in_stock) {
    return NextResponse.json({ error: 'Product is out of stock' }, { status: 400 });
  }

  const gemPrice = product.price;

  // ── 2+3. Making charge + Metal price from design ─────────────────────────
  let makingCharge = 0;
  let metalPrice = 0;
  let metalWeightGrams = 0;
  let goldRatePerGram = 0;

  if (input.design_id) {
    const { data: design } = await admin
      .from('jewelry_designs')
      .select('making_charges, estimated_metal_weight')
      .eq('id', input.design_id)
      .single();

    if (design) {
      // Making charge
      if (input.metal) {
        const charges = design.making_charges as Record<string, number> | null;
        makingCharge = charges?.[input.metal] ?? charges?.['default'] ?? 0;
      }

      // Metal price
      if (input.metal && input.setting_type !== 'loose') {
        const weights = design.estimated_metal_weight as Record<string, number> | null;
        metalWeightGrams = weights?.[input.metal] ?? weights?.['default'] ?? 0;

        const { data: rateData } = await admin
          .from('gold_rate_cache')
          .select('gold_22k_per_gram, gold_18k_per_gram, silver_per_gram')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single();

        if (rateData) {
          switch (input.metal) {
            case 'gold_22k':
              goldRatePerGram = rateData.gold_22k_per_gram;
              break;
            case 'gold_18k':
              goldRatePerGram = rateData.gold_18k_per_gram ?? 0;
              break;
            case 'silver_925':
              goldRatePerGram = rateData.silver_per_gram ?? 0;
              break;
            case 'panchdhatu':
              goldRatePerGram = Math.round(rateData.gold_22k_per_gram * 0.05);
              break;
            case 'platinum':
              goldRatePerGram = Math.round(rateData.gold_22k_per_gram * 0.45);
              break;
          }
        }
        metalPrice = Math.round(metalWeightGrams * goldRatePerGram);
      }
    }
  }

  // ── 4+5. Certification + Energization fees (parallel) ─────────────────
  const [certResult, enerResult] = await Promise.all([
    input.certification_id
      ? admin
          .from('certification_labs')
          .select('extra_charge')
          .eq('id', input.certification_id)
          .single()
      : Promise.resolve({ data: null }),
    input.energization_id
      ? admin
          .from('energization_options')
          .select('price')
          .eq('id', input.energization_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const certificationFee = certResult.data?.extra_charge ?? 0;
  const energizationFee = enerResult.data?.price ?? 0;

  // ── 6. Total ─────────────────────────────────────────────────────────
  const total = gemPrice + makingCharge + metalPrice + certificationFee + energizationFee;

  // ── 7. Get customer/session info ──────────────────────────────────────
  let customerId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    customerId = user?.id ?? null;
  } catch {
    // Guest user
  }

  const sessionId = customerId ? null : `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // ── 8. Save configuration ────────────────────────────────────────────
  const { data: config, error: insertError } = await admin
    .from('product_configurations')
    .insert({
      product_id: input.product_id,
      customer_id: customerId,
      session_id: sessionId,
      setting_type: input.setting_type,
      design_id: input.design_id,
      metal: input.metal,
      ring_size: input.ring_size ?? null,
      chain_length: input.chain_length ?? null,
      certification_id: input.certification_id,
      energization_id: input.energization_id,
      gem_price: gemPrice,
      making_charge: makingCharge,
      metal_price: metalPrice,
      metal_weight_grams: metalWeightGrams,
      gold_rate_per_gram: goldRatePerGram,
      certification_fee: certificationFee,
      energization_fee: energizationFee,
      total_price: total,
      status: 'draft',
    })
    .select('id')
    .single();

  if (insertError || !config) {
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    configuration_id: config.id,
    verified_total: total,
    breakdown: {
      gem_price: gemPrice,
      making_charge: makingCharge,
      metal_price: metalPrice,
      metal_weight_grams: metalWeightGrams,
      gold_rate_per_gram: goldRatePerGram,
      certification_fee: certificationFee,
      energization_fee: energizationFee,
    },
  });
}
