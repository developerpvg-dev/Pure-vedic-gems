import { z } from 'zod';

// Valid enum values
const CATEGORIES = ['gemstone', 'rudraksha', 'idol', 'mala', 'jewelry'] as const;
const SORT_BY = ['price', 'carat', 'newest'] as const;
const SORT_ORDER = ['asc', 'desc'] as const;

const CERTIFICATIONS = ['GIA', 'IGI', 'GJEPC', 'IIGJ', 'GRS', 'Gübelin', 'SSEF', 'AGL'] as const;
const TREATMENTS = ['none', 'heated', 'unheated', 'minor_oil', 'no_oil'] as const;
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;

// ── Product filters (query params from listing endpoint) ──────────────
export const productFiltersSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  sub_category: z.string().max(100).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  min_carat: z.coerce.number().min(0).optional(),
  max_carat: z.coerce.number().min(0).optional(),
  origin: z.string().max(100).optional(),
  planet: z.enum(PLANETS).optional(),
  certification: z.enum(CERTIFICATIONS).optional(),
  treatment: z.enum(TREATMENTS).optional(),
  sort_by: z.enum(SORT_BY).optional().default('newest'),
  sort_order: z.enum(SORT_ORDER).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  per_page: z.coerce.number().int().min(1).max(50).optional().default(20),
}).refine(
  (data) => {
    if (data.min_price !== undefined && data.max_price !== undefined) {
      return data.min_price <= data.max_price;
    }
    return true;
  },
  { message: 'min_price must be less than or equal to max_price', path: ['min_price'] }
).refine(
  (data) => {
    if (data.min_carat !== undefined && data.max_carat !== undefined) {
      return data.min_carat <= data.max_carat;
    }
    return true;
  },
  { message: 'min_carat must be less than or equal to max_carat', path: ['min_carat'] }
);

export type ProductFiltersInput = z.input<typeof productFiltersSchema>;

// ── Search query ──────────────────────────────────────────────────────
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200).trim(),
});

// ── Product creation (admin) ──────────────────────────────────────────
export const productCreateSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category: z.enum(CATEGORIES),
  sub_category: z.string().max(100).optional(),
  price: z.number().min(0),
  price_per_carat: z.number().min(0).optional(),
  compare_price: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  carat_weight: z.number().min(0).optional(),
  origin: z.string().max(100).optional(),
  shape: z.string().max(50).optional(),
  treatment: z.string().default('none'),
  color_grade: z.string().max(50).optional(),
  clarity: z.string().max(50).optional(),
  certification: z.string().max(50).optional(),
  planet: z.enum(PLANETS).optional(),
  vedic_name: z.string().max(100).optional(),
  hindi_name: z.string().max(100).optional(),
  chakra: z.string().max(50).optional(),
  rashi: z.string().max(50).optional(),
  finger: z.string().max(50).optional(),
  wearing_day: z.string().max(50).optional(),
  wearing_metal: z.string().max(100).optional(),
  mukhi_count: z.number().int().min(1).max(21).optional(),
  xray_certified: z.boolean().default(false),
  ruling_deity: z.string().max(100).optional(),
  short_desc: z.string().max(500).optional(),
  description: z.string().optional(),
  vedic_significance: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  wearing_guide: z.string().optional(),
  expert_note: z.string().optional(),
  expert_id: z.string().uuid().optional(),
  images: z.array(z.string().url()).optional(),
  certificate_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  in_stock: z.boolean().default(true),
  stock_quantity: z.number().int().min(0).default(1),
  low_stock_threshold: z.number().int().min(0).default(2),
  featured: z.boolean().default(false),
  is_directors_pick: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

// ── Product update (admin) — all fields optional ──────────────────────
export const productUpdateSchema = productCreateSchema.partial();

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
