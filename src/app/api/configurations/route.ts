import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  isCertificationAllowed,
  isEnergizationAllowed,
  isMetalAllowed,
  isSettingTypeAllowed,
  normalizeConfiguratorRules,
  validateRingSizeValue,
} from '@/lib/utils/configurator-rules';
import type { ConfigurationDeliveryEta, SettingType } from '@/lib/types/configurator';
import type { Json } from '@/lib/types/database';

const ConfigurationSchema = z.object({
  product_id: z.string().uuid(),
  setting_type: z.enum(['ring', 'pendant', 'bracelet', 'loose']).nullable(),
  design_id: z.string().uuid().nullable(),
  custom_design_url: z.string().url().nullable().optional(),
  metal: z.string().nullable(),
  ring_size: z.string().nullable().optional(),
  chain_length: z.string().nullable().optional(),
  certification_id: z.string().uuid().nullable(),
  certification_skipped: z.boolean().optional().default(false),
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

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 5 * 60 * 1000;
const CUSTOM_DESIGN_REVIEW_FEE = 0;

type ConfigurationInput = z.infer<typeof ConfigurationSchema>;

type ProductForConfiguration = {
  id: string;
  sku: string | null;
  tag_number: string | null;
  slug: string;
  name: string;
  category: string;
  sub_category: string | null;
  price: number;
  carat_weight: number | null;
  origin: string | null;
  images: unknown;
  thumbnail_url: string | null;
  in_stock: boolean;
  is_active: boolean;
  availability_status: string;
  configurator_enabled: boolean;
  certificate_display_enabled: boolean;
};

type JewelryDesignForPricing = {
  id: string;
  name: string;
  setting_type: string;
  making_charges: unknown;
  estimated_metal_weight: unknown;
  is_active: boolean;
};

type CertificationForPricing = {
  id: string;
  name: string;
  extra_charge: number;
  turnaround_days: number;
  is_active: boolean;
};

type EnergizationForPricing = {
  id: string;
  name: string;
  price: number;
  duration: string | null;
  includes_video: boolean;
  is_active: boolean;
};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

function asNumberRecord(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, number>;
}

function getProductImage(product: ProductForConfiguration) {
  if (product.thumbnail_url) return product.thumbnail_url;
  if (Array.isArray(product.images) && typeof product.images[0] === 'string') return product.images[0];
  return '';
}

async function getCurrentMetalRates(admin: ReturnType<typeof createAdminClient>) {
  const rates: Record<string, number> = {};
  const { data: metals, error } = await admin
    .from('metals')
    .select('slug, price_per_gram')
    .eq('is_active', true);

  if (error) {
    throw new Error('Unable to load admin metal prices');
  }

  for (const metal of metals as Array<{ slug: string; price_per_gram: number }>) {
    rates[metal.slug] = Number(metal.price_per_gram);
  }

  return rates;
}

function calculateDeliveryEta(args: {
  settingType: SettingType;
  certification: CertificationForPricing | null;
  energization: EnergizationForPricing | null;
  hasCustomDesign: boolean;
}): ConfigurationDeliveryEta {
  const components: string[] = ['Insured dispatch 3-5 days'];
  let minDays = 3;
  let maxDays = 5;

  if (args.settingType !== 'loose') {
    minDays += 7;
    maxDays += 12;
    components.push('Jewellery production 7-12 days');
  }

  if (args.hasCustomDesign) {
    minDays += 2;
    maxDays += 4;
    components.push('Custom design review 2-4 days');
  }

  if (args.certification) {
    minDays += args.certification.turnaround_days;
    maxDays += args.certification.turnaround_days;
    components.push(`${args.certification.name} certificate ${args.certification.turnaround_days} days`);
  }

  if (args.energization) {
    minDays += 1;
    maxDays += args.energization.includes_video ? 4 : 2;
    components.push(args.energization.includes_video ? 'Recorded energization 1-4 days' : 'Energization 1-2 days');
  }

  return {
    min_days: minDays,
    max_days: maxDays,
    label: `${minDays}-${maxDays} business days`,
    components,
  };
}

function titleCaseSlug(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildSummary(args: {
  product: ProductForConfiguration;
  settingType: SettingType;
  metal: string | null;
  certification: CertificationForPricing | null;
  energization: EnergizationForPricing | null;
  hasCustomDesign: boolean;
}) {
  const parts = [args.product.name];
  parts.push(args.settingType === 'loose' ? 'Loose Stone' : titleCaseSlug(args.settingType));
  if (args.hasCustomDesign) parts.push('Custom Design');
  if (args.metal) parts.push(titleCaseSlug(args.metal));
  if (args.certification) parts.push(args.certification.name);
  if (args.energization) parts.push('Energized');
  return parts.join(' · ');
}

function buildSnapshot(args: {
  product: ProductForConfiguration;
  input: ConfigurationInput;
  settingType: SettingType;
  design: JewelryDesignForPricing | null;
  certification: CertificationForPricing | null;
  energization: EnergizationForPricing | null;
  breakdown: Record<string, number>;
  deliveryEta: ConfigurationDeliveryEta;
  summary: string;
}) {
  return {
    version: 1,
    product: {
      id: args.product.id,
      sku: args.product.sku,
      tag_number: args.product.tag_number,
      slug: args.product.slug,
      name: args.product.name,
      category: args.product.category,
      sub_category: args.product.sub_category,
      image_url: getProductImage(args.product),
      carat_weight: args.product.carat_weight,
      origin: args.product.origin,
    },
    selections: {
      setting_type: args.settingType,
      design: args.design ? { id: args.design.id, name: args.design.name } : null,
      custom_design_url: args.input.custom_design_url ?? null,
      metal: args.settingType === 'loose' ? null : args.input.metal,
      ring_size: args.settingType === 'ring' ? args.input.ring_size ?? null : null,
      chain_length: args.settingType === 'pendant' ? args.input.chain_length ?? null : null,
      certification: args.certification ? { id: args.certification.id, name: args.certification.name } : null,
      certification_skipped: !args.certification,
      energization: args.energization ? { id: args.energization.id, name: args.energization.name } : null,
      energization_form: args.input.energization_form ?? null,
    },
    pricing: args.breakdown,
    delivery_eta: args.deliveryEta,
    summary: args.summary,
  };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many configuration requests. Please wait a few minutes.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null) as unknown;
  const parsed = ConfigurationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const admin = createAdminClient();

  const [productResult, rulesResult] = await Promise.all([
    admin
      .from('products')
      .select('id, sku, tag_number, slug, name, category, sub_category, price, carat_weight, origin, images, thumbnail_url, in_stock, is_active, availability_status, configurator_enabled, certificate_display_enabled')
      .eq('id', input.product_id)
      .maybeSingle(),
    admin
      .from('product_option_rules')
      .select('*')
      .eq('product_id', input.product_id)
      .maybeSingle(),
  ]);

  const product = productResult.data as ProductForConfiguration | null;
  if (productResult.error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  if (!product.is_active || !product.in_stock || ['sold', 'archived', 'out_of_stock'].includes(product.availability_status)) {
    return NextResponse.json({ error: 'Product is not available for configuration' }, { status: 400 });
  }

  let rules = normalizeConfiguratorRules(rulesResult.data);
  if (!rules.product_id) {
    rules = {
      ...rules,
      product_id: product.id,
      certificate_enabled: product.certificate_display_enabled || rules.certificate_enabled,
      jewelry_design_enabled: product.configurator_enabled,
      metal_enabled: product.configurator_enabled,
      ring_size_enabled: product.configurator_enabled,
      allowed_setting_types: product.configurator_enabled ? rules.allowed_setting_types : ['loose'],
    };
  }

  const settingType = input.setting_type;
  if (!settingType) {
    return NextResponse.json({ error: 'Choose a setting type before saving.' }, { status: 400 });
  }
  if (!isSettingTypeAllowed(rules, settingType)) {
    return NextResponse.json({ error: 'This setting type is not available for the selected product.' }, { status: 400 });
  }

  const hasCustomDesign = !!input.custom_design_url && settingType !== 'loose';
  if (settingType !== 'loose') {
    if (!rules.jewelry_design_enabled) {
      return NextResponse.json({ error: 'Jewellery settings are not enabled for this product.' }, { status: 400 });
    }
    if (!input.design_id && !hasCustomDesign) {
      return NextResponse.json({ error: 'Choose or upload a design before saving.' }, { status: 400 });
    }
    if (!input.metal || !isMetalAllowed(rules, input.metal)) {
      return NextResponse.json({ error: 'This metal is not available for the selected product.' }, { status: 400 });
    }
    if (settingType === 'ring') {
      const ringSizeValidation = validateRingSizeValue(rules, input.ring_size ?? null);
      if (!input.ring_size || !ringSizeValidation.valid) {
        return NextResponse.json(
          { error: ringSizeValidation.reason ?? 'Choose a valid ring size.' },
          { status: 400 }
        );
      }
    }
    if (settingType === 'pendant' && !input.chain_length) {
      return NextResponse.json({ error: 'Choose a chain length before saving.' }, { status: 400 });
    }
  }

  if (input.certification_id && !isCertificationAllowed(rules, input.certification_id)) {
    return NextResponse.json({ error: 'This certification lab is not available for the selected product.' }, { status: 400 });
  }
  if (!input.certification_id && !input.certification_skipped) {
    return NextResponse.json({ error: 'Choose a certification lab or skip certification.' }, { status: 400 });
  }
  if (input.energization_id && !isEnergizationAllowed(rules, input.energization_id)) {
    return NextResponse.json({ error: 'This energization option is not available for the selected product.' }, { status: 400 });
  }
  if (input.energization_id && !input.energization_form?.dob) {
    return NextResponse.json({ error: 'Date of birth is required for energization.' }, { status: 400 });
  }

  const [designResult, certificationResult, energizationResult, metalRates] = await Promise.all([
    input.design_id && settingType !== 'loose'
      ? admin
          .from('jewelry_designs')
          .select('id, name, setting_type, making_charges, estimated_metal_weight, is_active')
          .eq('id', input.design_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    input.certification_id
      ? admin
          .from('certification_labs')
          .select('id, name, extra_charge, turnaround_days, is_active')
          .eq('id', input.certification_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    input.energization_id
      ? admin
          .from('energization_options')
          .select('id, name, price, duration, includes_video, is_active')
          .eq('id', input.energization_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getCurrentMetalRates(admin),
  ]);

  const design = designResult.data as JewelryDesignForPricing | null;
  if (input.design_id && (!design || !design.is_active || design.setting_type !== settingType)) {
    return NextResponse.json({ error: 'Selected design is not available for this setting.' }, { status: 400 });
  }

  const certification = certificationResult.data as CertificationForPricing | null;
  if (input.certification_id && (!certification || !certification.is_active)) {
    return NextResponse.json({ error: 'Selected certification lab is not active.' }, { status: 400 });
  }

  const energization = energizationResult.data as EnergizationForPricing | null;
  if (input.energization_id && (!energization || !energization.is_active)) {
    return NextResponse.json({ error: 'Selected energization option is not active.' }, { status: 400 });
  }

  let makingCharge = 0;
  let metalPrice = 0;
  let metalWeightGrams = 0;
  let goldRatePerGram = 0;

  if (settingType !== 'loose' && design && input.metal) {
    const charges = asNumberRecord(design.making_charges);
    makingCharge = charges?.[input.metal] ?? charges?.default ?? 0;

    const weights = asNumberRecord(design.estimated_metal_weight);
    metalWeightGrams = weights?.[input.metal] ?? weights?.default ?? 0;
    goldRatePerGram = metalRates[input.metal] ?? 0;
    if (metalWeightGrams > 0 && goldRatePerGram <= 0) {
      return NextResponse.json(
        { error: 'Manual price for the selected metal is not configured in admin.' },
        { status: 400 }
      );
    }
    metalPrice = Math.round(metalWeightGrams * goldRatePerGram);
  }

  const gemPrice = Number(product.price);
  const certificationFee = certification?.extra_charge ?? 0;
  const energizationFee = energization?.price ?? 0;
  const customDesignFee = hasCustomDesign ? CUSTOM_DESIGN_REVIEW_FEE : 0;
  const total = gemPrice + makingCharge + metalPrice + certificationFee + energizationFee + customDesignFee;
  const deliveryEta = calculateDeliveryEta({ settingType, certification, energization, hasCustomDesign });
  const summary = buildSummary({
    product,
    settingType,
    metal: settingType === 'loose' ? null : input.metal,
    certification,
    energization,
    hasCustomDesign,
  });
  const breakdown = {
    gem_price: gemPrice,
    making_charge: makingCharge,
    metal_price: metalPrice,
    metal_weight_grams: metalWeightGrams,
    gold_rate_per_gram: goldRatePerGram,
    certification_fee: certificationFee,
    energization_fee: energizationFee,
    custom_design_fee: customDesignFee,
    total,
  };
  const configurationSnapshot = buildSnapshot({
    product,
    input,
    settingType,
    design,
    certification,
    energization,
    breakdown,
    deliveryEta,
    summary,
  }) as unknown as Json;

  let customerId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    customerId = user?.id ?? null;
  } catch {
    customerId = null;
  }

  const sessionId = customerId ? null : `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const status = hasCustomDesign ? 'pending_custom_design_review' : 'draft';

  const { data: config, error: insertError } = await admin
    .from('product_configurations')
    .insert({
      product_id: input.product_id,
      customer_id: customerId,
      session_id: sessionId,
      setting_type: settingType,
      design_id: settingType === 'loose' ? null : input.design_id,
      custom_design_url: hasCustomDesign ? input.custom_design_url : null,
      custom_design_status: hasCustomDesign ? 'pending_review' : null,
      metal: settingType === 'loose' ? null : input.metal,
      ring_size: settingType === 'ring' ? input.ring_size ?? null : null,
      chain_length: settingType === 'pendant' ? input.chain_length ?? null : null,
      certification_id: certification?.id ?? null,
      energization_id: energization?.id ?? null,
      gem_price: gemPrice,
      making_charge: makingCharge,
      metal_price: metalPrice,
      metal_weight_grams: metalWeightGrams,
      gold_rate_per_gram: goldRatePerGram,
      certification_fee: certificationFee,
      energization_fee: energizationFee,
      custom_design_fee: customDesignFee,
      total_price: total,
      delivery_eta_min_days: deliveryEta.min_days,
      delivery_eta_max_days: deliveryEta.max_days,
      delivery_eta_label: deliveryEta.label,
      configuration_snapshot: configurationSnapshot,
      pricing_snapshot: breakdown as Json,
      status,
    })
    .select('id')
    .single();

  if (insertError || !config) {
    return NextResponse.json(
      { error: 'Failed to save configuration', details: insertError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    configuration_id: config.id,
    verified_total: total,
    breakdown,
    delivery_eta: deliveryEta,
    configuration_summary: summary,
    configuration_snapshot: configurationSnapshot,
    custom_design_status: hasCustomDesign ? 'pending_review' : null,
  });
}