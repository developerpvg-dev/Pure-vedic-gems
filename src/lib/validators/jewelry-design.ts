import { z } from 'zod';
import {
  JEWELRY_DESIGN_SETTING_TYPES,
  JEWELRY_PRODUCT_SCOPES,
  RUDRAKSHA_MOUNTING_CATEGORIES,
} from '@/lib/constants/jewelry-design-metals';
import { encodeMetalRowsToDesignFields, resolveStoneAddonLabelForSave, type DesignMetalRow } from '@/lib/utils/jewelry-design-fields';

const metalRowSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  pricingMode: z.enum(['fixed', 'weight']),
  laborRatePercent: z.number().nullable().optional(),
  gstRatePercent: z.number().nullable().optional(),
  status: z.enum(['available', 'on_request', 'unavailable']),
  fixedPrice: z.number().positive().nullable().optional(),
  weightGrams: z.number().positive().nullable().optional(),
  diamondCharge: z.number().positive().nullable().optional(),
  note: z.string().max(500).optional().default(''),
});

const baseDesignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  setting_type: z.enum(JEWELRY_DESIGN_SETTING_TYPES),
  product_scope: z.enum(JEWELRY_PRODUCT_SCOPES).default('gemstone'),
  rudraksha_category: z
    .enum(RUDRAKSHA_MOUNTING_CATEGORIES.map((c) => c.value) as [string, ...string[]])
    .nullable()
    .optional(),
  image_url: z.string().max(2000).nullable().optional(),
  video_url: z.string().max(2000).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
  design_diamond_charge: z.number().positive().nullable().optional(),
  stone_addon_label: z.string().trim().max(80).nullable().optional(),
  metal_rows: z.array(metalRowSchema).min(1),
});

export const jewelryDesignCreateSchema = baseDesignSchema.superRefine((data, ctx) => {
  if (data.product_scope === 'rudraksha' && !data.rudraksha_category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Rudraksha category is required for Rudraksha mountings',
      path: ['rudraksha_category'],
    });
  }

  if (data.product_scope === 'gemstone' && data.rudraksha_category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Rudraksha category must be empty for gemstone designs',
      path: ['rudraksha_category'],
    });
  }

  const availableRows = data.metal_rows.filter((row) => row.status === 'available');
  if (availableRows.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one metal must be available with pricing',
      path: ['metal_rows'],
    });
  }

  for (const [index, row] of data.metal_rows.entries()) {
    if (row.status !== 'available') continue;

    if (row.pricingMode === 'fixed' && (!row.fixedPrice || row.fixedPrice <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Fixed price required for ${row.label}`,
        path: ['metal_rows', index, 'fixedPrice'],
      });
    }

    if (row.pricingMode === 'weight' && (!row.weightGrams || row.weightGrams <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Weight (grams) required for ${row.label}`,
        path: ['metal_rows', index, 'weightGrams'],
      });
    }
  }
});

export const jewelryDesignUpdateSchema = baseDesignSchema
  .extend({ id: z.string().uuid() })
  .superRefine((data, ctx) => {
    if (data.product_scope === 'rudraksha' && !data.rudraksha_category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rudraksha category is required for Rudraksha mountings',
        path: ['rudraksha_category'],
      });
    }

    if (data.product_scope === 'gemstone' && data.rudraksha_category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rudraksha category must be empty for gemstone designs',
        path: ['rudraksha_category'],
      });
    }

    const availableRows = data.metal_rows.filter((row) => row.status === 'available');
    if (availableRows.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one metal must be available with pricing',
        path: ['metal_rows'],
      });
    }

    for (const [index, row] of data.metal_rows.entries()) {
      if (row.status !== 'available') continue;

      if (row.pricingMode === 'fixed' && (!row.fixedPrice || row.fixedPrice <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Fixed price required for ${row.label}`,
          path: ['metal_rows', index, 'fixedPrice'],
        });
      }

      if (row.pricingMode === 'weight' && (!row.weightGrams || row.weightGrams <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Weight (grams) required for ${row.label}`,
          path: ['metal_rows', index, 'weightGrams'],
        });
      }
    }
  });

export type JewelryDesignFormInput = z.infer<typeof jewelryDesignCreateSchema>;

export function normalizeDesignPayload(input: JewelryDesignFormInput) {
  const encoded = encodeMetalRowsToDesignFields(
    input.metal_rows as DesignMetalRow[],
    input.design_diamond_charge ?? null
  );
  const noteLines = input.metal_rows
    .filter((row) => row.note.trim())
    .map((row) => `${row.label}: ${row.note.trim()}`);
  const baseDescription = input.description?.trim() || '';
  const mergedDescription = [baseDescription, ...noteLines].filter(Boolean).join(' ') || null;

  const stoneAmount = input.design_diamond_charge ?? null;
  const stoneLabel = resolveStoneAddonLabelForSave(input.stone_addon_label, stoneAmount);

  return {
    name: input.name.trim(),
    setting_type: input.setting_type,
    product_scope: input.product_scope,
    rudraksha_category: input.product_scope === 'rudraksha' ? input.rudraksha_category ?? null : null,
    image_url: input.image_url?.trim() || null,
    video_url: input.video_url?.trim() || null,
    description: mergedDescription,
    making_charges: encoded.making_charges,
    estimated_metal_weight: encoded.estimated_metal_weight,
    diamond_charges: encoded.diamond_charges,
    stone_addon_label: stoneLabel,
    metal_flags: encoded.metal_flags,
    labor_rates: encoded.labor_rates,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };
}
