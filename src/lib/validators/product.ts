import { z } from 'zod';
import {
  AVAILABILITY_STATUSES,
  CATALOG_FAMILIES,
  CERTIFICATE_STATUSES,
  PLANETS,
  PRICE_MODES,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  RING_SIZE_SYSTEMS,
  SETTING_TYPES,
  SORT_BY,
  SORT_ORDER,
  STOCK_STATUSES,
  TAX_STATUSES,
  TREATMENTS,
} from '@/lib/constants/product-taxonomy';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const emptyToUndefined = (value: unknown) =>
  value === '' || value === null ? undefined : value;

const optionalString = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().trim().url().optional()
);

const optionalFilterBoolean = z.preprocess((value) => {
  const cleaned = emptyToUndefined(value);
  if (cleaned === undefined || typeof cleaned === 'boolean') return cleaned;
  if (typeof cleaned === 'string') {
    const normalized = cleaned.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return cleaned;
}, z.boolean().optional());

const optionalNonNegativeNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0).optional()
);

const optionalPositiveInteger = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().positive().optional()
);

const optionalNonNegativeInteger = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional()
);

const stringArraySchema = z
  .array(z.string().trim().min(1).max(255))
  .default([]);

const uuidArraySchema = z.array(z.string().uuid()).default([]);
const jsonObjectSchema = z.record(z.string(), z.unknown()).default({});
const jsonArraySchema = z.array(z.unknown()).default([]);

const dimensionsMmSchema = z
  .object({
    length: optionalNonNegativeNumber,
    width: optionalNonNegativeNumber,
    depth: optionalNonNegativeNumber,
    unit: z.literal('mm').default('mm'),
  })
  .partial()
  .optional();

export const productCategoryInputSchema = z.object({
  parent_id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(140).regex(slugRegex),
  name: z.string().trim().min(1).max(160),
  family: z.enum(CATALOG_FAMILIES),
  legacy_names: stringArraySchema.optional(),
  description: optionalText,
  image_url: optionalUrl,
  seo_title: optionalString(200),
  seo_description: optionalString(500),
  meta_keywords: stringArraySchema.optional(),
  canonical_path: optionalString(255),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.coerce.boolean().default(true),
});

export const productCategoryAssignmentInputSchema = z
  .object({
    category_id: z.string().uuid().optional(),
    category_slug: z.string().trim().max(140).regex(slugRegex).optional(),
    is_primary: z.coerce.boolean().default(false),
    sort_order: z.coerce.number().int().default(0),
    legacy_path: optionalString(500),
  })
  .refine((data) => data.category_id || data.category_slug, {
    message: 'category_id or category_slug is required',
    path: ['category_id'],
  });

export const productCurrencyPriceInputSchema = z
  .object({
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
    price: z.coerce.number().min(0),
    compare_price: optionalNonNegativeNumber,
    price_per_carat: optionalNonNegativeNumber,
    source: optionalString(40),
    rate_snapshot: optionalNonNegativeNumber,
  })
  .refine(
    (data) => data.compare_price === undefined || data.compare_price >= data.price,
    { message: 'compare_price must be greater than or equal to price', path: ['compare_price'] }
  );

export const productOptionRulesSchema = z.object({
  certificate_enabled: z.coerce.boolean().default(false),
  energization_enabled: z.coerce.boolean().default(false),
  jewelry_design_enabled: z.coerce.boolean().default(false),
  metal_enabled: z.coerce.boolean().default(false),
  ring_size_enabled: z.coerce.boolean().default(false),
  allowed_setting_types: z.array(z.enum(SETTING_TYPES)).default([]),
  allowed_metals: stringArraySchema.optional(),
  allowed_ring_size_systems: z.array(z.enum(RING_SIZE_SYSTEMS)).default([]),
  allowed_certification_lab_ids: uuidArraySchema.optional(),
  allowed_energization_option_ids: uuidArraySchema.optional(),
  legacy_certificate_options: jsonArraySchema.optional(),
  legacy_energization_options: jsonArraySchema.optional(),
  legacy_metal_options: jsonArraySchema.optional(),
  legacy_setting_options: jsonArraySchema.optional(),
  legacy_ring_size_options: jsonArraySchema.optional(),
});

export const productFiltersSchema = z
  .object({
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    sub_category: optionalString(100),
    product_type: z.enum(PRODUCT_TYPES).optional(),
    availability_status: z.enum(AVAILABILITY_STATUSES).optional(),
    min_price: optionalNonNegativeNumber,
    max_price: optionalNonNegativeNumber,
    min_carat: optionalNonNegativeNumber,
    max_carat: optionalNonNegativeNumber,
    origin: optionalString(100),
    shape: optionalString(100),
    planet: z.enum(PLANETS).optional(),
    certification: optionalString(100),
    certificate_lab: optionalString(100),
    quality_label: optionalString(100),
    treatment: z.enum(TREATMENTS).optional(),
    price_mode: z.enum(PRICE_MODES).optional(),
    configurator_enabled: optionalFilterBoolean,
    q: optionalString(200),
    featured: optionalFilterBoolean,
    directors_pick: optionalFilterBoolean,
    sort_by: z.enum(SORT_BY).optional().default('newest'),
    sort_order: z.enum(SORT_ORDER).optional().default('desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    per_page: z.coerce.number().int().min(1).max(50).optional().default(20),
  })
  .refine(
    (data) => data.min_price === undefined || data.max_price === undefined || data.min_price <= data.max_price,
    { message: 'min_price must be less than or equal to max_price', path: ['min_price'] }
  )
  .refine(
    (data) => data.min_carat === undefined || data.max_carat === undefined || data.min_carat <= data.max_carat,
    { message: 'min_carat must be less than or equal to max_carat', path: ['min_carat'] }
  );

export type ProductFiltersInput = z.input<typeof productFiltersSchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200).trim(),
});

const productBaseSchema = z.object({
    sku: z.string().trim().min(1).max(50),
    name: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1).max(200).regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens'),
    category: z.enum(PRODUCT_CATEGORIES),
    sub_category: optionalString(100),
    product_type: z.enum(PRODUCT_TYPES).default('gemstone'),
    tag_number: optionalString(100),

    legacy_woo_id: optionalPositiveInteger,
    legacy_parent_id: optionalNonNegativeInteger,
    legacy_sku: optionalString(100),
    legacy_slug: optionalString(255),
    legacy_permalink: optionalUrl,
    legacy_status: optionalString(50),
    legacy_created_at: optionalString(50),
    import_batch_id: z.string().uuid().optional(),
    import_warnings: z.array(z.string().trim().min(1).max(500)).default([]),
    legacy_data: jsonObjectSchema.optional(),

    price: z.coerce.number().min(0),
    price_per_carat: optionalNonNegativeNumber,
    compare_price: optionalNonNegativeNumber,
    currency: z.string().trim().length(3).default('INR').transform((value) => value.toUpperCase()),
    price_mode: z.enum(PRICE_MODES).default('fixed'),
    sale_price_starts_at: optionalString(50),
    sale_price_ends_at: optionalString(50),
    tax_status: z.enum(TAX_STATUSES).default('taxable'),
    tax_class: optionalString(100),

    carat_weight: optionalNonNegativeNumber,
    ratti_weight: optionalNonNegativeNumber,
    origin: optionalString(100),
    origin_country: optionalString(100),
    origin_region: optionalString(120),
    origin_display: optionalString(160),
    shape: optionalString(50),
    treatment: z.string().trim().max(100).default('none'),
    treatment_summary: optionalString(120),
    treatment_detail: optionalText,
    color_grade: optionalString(50),
    color_description: optionalString(200),
    clarity: optionalString(50),
    clarity_description: optionalString(200),
    certification: optionalString(100),
    quality_label: optionalString(100),
    commercial_quality_grade: optionalString(100),
    gemstone_name: optionalString(120),
    dimensions_mm: dimensionsMmSchema,
    composition: optionalString(160),
    recommendation_category_code: optionalString(100),

    certificate_number: optionalString(120),
    certificate_lab: optionalString(160),
    certificate_status: z.enum(CERTIFICATE_STATUSES).default('not_required'),
    certificate_display_enabled: z.coerce.boolean().default(false),
    certificate_file_url: optionalUrl,

    planet: z.enum(PLANETS).optional(),
    vedic_name: optionalString(100),
    hindi_name: optionalString(100),
    chakra: optionalString(50),
    rashi: optionalString(100),
    finger: optionalString(50),
    wearing_day: optionalString(50),
    wearing_metal: optionalString(100),
    mantra: optionalText,

    mukhi_count: optionalNonNegativeInteger,
    xray_certified: z.coerce.boolean().default(false),
    xray_certificate_number: optionalString(120),
    ruling_deity: optionalString(100),
    deity: optionalString(120),
    rudraksha_type: optionalString(120),
    bead_size_mm: optionalNonNegativeNumber,
    bead_weight: optionalNonNegativeNumber,
    energization_eligible: z.coerce.boolean().default(false),

    jewellery_type: optionalString(80),
    base_metal: optionalString(80),
    metal_purity: optionalString(40),
    metal_weight_grams: optionalNonNegativeNumber,
    size_label: optionalString(80),
    ring_size: optionalString(40),
    design_code: optionalString(100),
    making_charge: optionalNonNegativeNumber,
    ready_stock: z.coerce.boolean().default(false),

    service_duration: optionalString(120),
    service_delivery_mode: optionalString(80),
    external_url: optionalUrl,
    variation_parent_id: z.string().uuid().optional(),
    grouped_product_ids: uuidArraySchema.optional(),
    downloadable_files: jsonArraySchema.optional(),

    short_desc: optionalString(500),
    description: optionalText,
    clean_description: optionalText,
    legacy_html_description: optionalText,
    vedic_significance: optionalText,
    benefits: z.array(z.string().trim().min(1).max(500)).optional(),
    wearing_guide: optionalText,
    expert_note: optionalText,
    expert_id: z.string().uuid().optional(),
    purchase_note: optionalText,
    allow_reviews: z.coerce.boolean().default(true),

    images: z.array(z.string().url()).optional(),
    certificate_url: optionalUrl,
    video_url: optionalUrl,
    thumbnail_url: optionalUrl,

    in_stock: z.coerce.boolean().default(true),
    stock_status: z.enum(STOCK_STATUSES).default('in_stock'),
    availability_status: z.enum(AVAILABILITY_STATUSES).default('in_stock'),
    stock_quantity: z.coerce.number().int().min(0).default(1),
    low_stock_threshold: z.coerce.number().int().min(0).default(2),
    sold_individually: z.coerce.boolean().default(false),
    backorders_allowed: z.coerce.boolean().default(false),
    manual_reserve_enabled: z.coerce.boolean().default(false),
    reserved_quantity: z.coerce.number().int().min(0).default(0),
    reserved_until: optionalString(50),
    reserved_by_customer_id: z.string().uuid().optional(),
    reserved_by_admin_id: z.string().uuid().optional(),
    reservation_note: optionalText,

    featured: z.coerce.boolean().default(false),
    is_directors_pick: z.coerce.boolean().default(false),
    is_active: z.coerce.boolean().default(true),
    configurator_enabled: z.coerce.boolean().default(false),
    display_order: z.coerce.number().int().default(0),

    meta_title: optionalString(200),
    meta_description: optionalString(500),
    meta_keywords: stringArraySchema.optional(),
    canonical_url: optionalUrl,
    og_image: optionalUrl,
    seo_data: jsonObjectSchema.optional(),
    legacy_seo: jsonObjectSchema.optional(),

    category_assignments: z.array(productCategoryAssignmentInputSchema).optional(),
    currency_prices: z.array(productCurrencyPriceInputSchema).optional(),
  option_rules: productOptionRulesSchema.optional(),
});

export const productCreateSchema = productBaseSchema
  .refine(
    (data) => data.compare_price === undefined || data.compare_price >= data.price,
    { message: 'compare_price must be greater than or equal to price', path: ['compare_price'] }
  )
  .refine(
    (data) => data.sale_price_starts_at === undefined || data.sale_price_ends_at === undefined || data.sale_price_starts_at <= data.sale_price_ends_at,
    { message: 'sale_price_starts_at must be before sale_price_ends_at', path: ['sale_price_starts_at'] }
  )
  .refine(
    (data) => data.product_type !== 'external' || Boolean(data.external_url),
    { message: 'external_url is required for external products', path: ['external_url'] }
  )
  .refine(
    (data) => data.price_mode !== 'per_carat' || data.price_per_carat !== undefined || data.price > 0,
    { message: 'price_per_carat or price is required for per-carat products', path: ['price_per_carat'] }
  );

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productBaseSchema
  .partial()
  .refine(
    (data) => data.price === undefined || data.compare_price === undefined || data.compare_price >= data.price,
    { message: 'compare_price must be greater than or equal to price', path: ['compare_price'] }
  )
  .refine(
    (data) => data.sale_price_starts_at === undefined || data.sale_price_ends_at === undefined || data.sale_price_starts_at <= data.sale_price_ends_at,
    { message: 'sale_price_starts_at must be before sale_price_ends_at', path: ['sale_price_starts_at'] }
  )
  .refine(
    (data) => data.product_type !== 'external' || Boolean(data.external_url),
    { message: 'external_url is required when product_type is external', path: ['external_url'] }
  )
  .refine(
    (data) => data.price_mode !== 'per_carat' || data.price_per_carat !== undefined || data.price === undefined || data.price > 0,
    { message: 'price_per_carat or price is required for per-carat products', path: ['price_per_carat'] }
  );

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
