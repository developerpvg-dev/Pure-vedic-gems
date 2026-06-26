import type { JewelryDesignRecord } from './sql-format';
import type { ParsedJewelryDesign } from './parse-metal-values';

export function toJewelryDesignRecord(
  design: ParsedJewelryDesign,
  args: {
    setting_type: string;
    image_url: string | null;
    product_scope?: 'gemstone' | 'rudraksha';
    rudraksha_category?: string | null;
  }
): JewelryDesignRecord {
  return {
    name: design.name,
    setting_type: args.setting_type,
    image_url: args.image_url,
    description: design.notes.length > 0 ? design.notes.join(' ') : null,
    making_charges: design.makingCharges,
    estimated_metal_weight:
      Object.keys(design.estimatedMetalWeight).length > 0 ? design.estimatedMetalWeight : null,
    diamond_charges: design.diamondCharges,
    product_scope: args.product_scope ?? design.productScope ?? 'gemstone',
    rudraksha_category: args.rudraksha_category ?? design.rudrakshaCategory ?? null,
    metal_flags: {},
    sort_order: design.sortOrder,
    is_active: true,
  };
}
