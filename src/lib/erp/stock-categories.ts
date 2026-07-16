import type { FormKind } from '@/components/admin/product-form/kinds';

/** Stock sheet categories — one Excel upload updates only this bucket. */
export type StockCategoryId =
  | 'emerald'
  | 'ruby'
  | 'sapphire'
  | 'pre_stn'
  | 'semi_pre'
  | 'rudraksha'
  | 'pooja'
  | 'stone_idols'
  | 'pre_stn_idols'
  | 'jewellery';

export type StockCategory = {
  id: StockCategoryId;
  label: string;
  kind: FormKind;
  /** Matches MMI export filenames */
  filenameHint: RegExp;
};

export const STOCK_CATEGORIES: StockCategory[] = [
  { id: 'emerald', label: 'Emerald', kind: 'navratna', filenameHint: /emerald/i },
  { id: 'ruby', label: 'Ruby', kind: 'navratna', filenameHint: /ruby/i },
  { id: 'sapphire', label: 'Sapphire', kind: 'navratna', filenameHint: /sapphire/i },
  { id: 'semi_pre', label: 'Semi-precious stones', kind: 'upratna', filenameHint: /semi\s*pre/i },
  { id: 'pre_stn', label: 'Precious stones (other)', kind: 'navratna', filenameHint: /pre\s*stn(?!.*idol)/i },
  { id: 'rudraksha', label: 'Rudraksha', kind: 'rudraksha', filenameHint: /rudraksha/i },
  { id: 'pooja', label: 'Pooja items', kind: 'rudraksha', filenameHint: /pooja/i },
  { id: 'stone_idols', label: 'Stone idols', kind: 'idol', filenameHint: /stone\s*idols(?!\s*\(pre)/i },
  { id: 'pre_stn_idols', label: 'Precious stone idols', kind: 'idol', filenameHint: /pre\s*stn.*idol|idol.*pre\s*stn/i },
  { id: 'jewellery', label: 'Jewellery', kind: 'jewellery', filenameHint: /jewel|ring|bangle/i },
];

export function getStockCategory(id: string): StockCategory | null {
  return STOCK_CATEGORIES.find((c) => c.id === id) ?? null;
}

export function suggestStockCategoryFromFilename(filename: string): StockCategoryId | null {
  for (const cat of STOCK_CATEGORIES) {
    if (cat.filenameHint.test(filename)) return cat.id;
  }
  return null;
}
