export type ParsedMetalRow = {
  slug: string;
  label: string;
  kind: 'fixed' | 'weight' | 'unavailable' | 'on_request';
  fixedPrice?: number;
  weightGrams?: number;
  note?: string;
  diamondCharge?: number;
};

export type ParsedJewelryDesign = {
  name: string;
  slug: string;
  sortOrder: number;
  makingCharges: Record<string, number>;
  estimatedMetalWeight: Record<string, number>;
  diamondCharges: Record<string, number>;
  notes: string[];
  metals: ParsedMetalRow[];
  productScope?: 'gemstone' | 'rudraksha';
  rudrakshaCategory?: string | null;
};

const METAL_LABEL_TO_SLUG: Array<{ pattern: RegExp; slug: string; label: string }> = [
  { pattern: /^silver$/i, slug: 'silver_925', label: 'Silver' },
  { pattern: /^14k gold$/i, slug: 'gold_14k', label: '14K Gold' },
  { pattern: /^18k gold$/i, slug: 'gold_18k', label: '18K Gold' },
  { pattern: /^22k gold$/i, slug: 'gold_22k', label: '22K Gold' },
  { pattern: /^platinum$/i, slug: 'platinum', label: 'Platinum' },
  { pattern: /^panchdhatu \(without gold\)$/i, slug: 'panchdhatu', label: 'Panchdhatu (Without Gold)' },
  { pattern: /^panchdhatu \(with gold\)$/i, slug: 'panchdhatu_with_gold', label: 'Panchdhatu (With Gold)' },
];

const WEIGHT_METALS = new Set(['gold_14k', 'gold_18k', 'gold_22k', 'platinum']);
const FIXED_METALS = new Set(['silver_925', 'panchdhatu', 'panchdhatu_with_gold']);

export function normalizeMetalLabel(raw: string): { slug: string; label: string } | null {
  const cleaned = raw.trim();
  for (const entry of METAL_LABEL_TO_SLUG) {
    if (entry.pattern.test(cleaned)) return { slug: entry.slug, label: entry.label };
  }
  return null;
}

function parseFixedPrice(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim();
  if (!normalized || /^x$/i.test(normalized) || /^yes$/i.test(normalized)) return null;
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseWeightGrams(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim();
  if (!normalized || /^x$/i.test(normalized)) return null;
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*gram/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function cleanCellValue(raw?: string): string {
  const value = raw?.trim() ?? '';
  if (!value || value === 'undefined') return '';
  return value;
}

/** Parses notes like "+17500 diamonds cost" or "+2Lakhs Extra For Diamonds" into rupees. */
export function parseDiamondCharge(note?: string): number | null {
  const cleaned = cleanCellValue(note);
  if (!cleaned || !/diamond|lakh/i.test(cleaned)) return null;

  const lakhMatch = cleaned.match(/\+?\s*(\d+(?:\.\d+)?)\s*lakh/i);
  if (lakhMatch) {
    const value = Number(lakhMatch[1]) * 100_000;
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }

  const match = cleaned.match(/(?:\+|\b)(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export function collectDesignNotes(metals: ParsedMetalRow[]): string[] {
  const notes: string[] = [];
  for (const metal of metals) {
    if (metal.kind === 'on_request') {
      notes.push(`${metal.label}: available on request — contact for quote.`);
      continue;
    }
    const note = cleanCellValue(metal.note);
    if (!note) continue;
    notes.push(`${metal.label}: ${note}`);
  }
  return notes;
}

export function parseMetalValue(
  slug: string,
  valueRaw: string,
  noteRaw?: string
): ParsedMetalRow {
  const label = METAL_LABEL_TO_SLUG.find((m) => m.slug === slug)?.label ?? slug;
  const note = cleanCellValue(noteRaw) || undefined;
  const diamondCharge = parseDiamondCharge(note) ?? undefined;
  const value = cleanCellValue(valueRaw);

  if (!value || /^x$/i.test(value)) {
    return { slug, label, kind: 'unavailable', note, diamondCharge };
  }

  if (/^yes$/i.test(value)) {
    return { slug, label, kind: 'on_request', note, diamondCharge };
  }

  if (WEIGHT_METALS.has(slug)) {
    const weightGrams = parseWeightGrams(value);
    if (weightGrams) return { slug, label, kind: 'weight', weightGrams, note, diamondCharge };
    return { slug, label, kind: 'unavailable', note, diamondCharge };
  }

  if (FIXED_METALS.has(slug)) {
    const fixedPrice = parseFixedPrice(value);
    if (fixedPrice) return { slug, label, kind: 'fixed', fixedPrice, note, diamondCharge };
    return { slug, label, kind: 'unavailable', note, diamondCharge };
  }

  return { slug, label, kind: 'unavailable', note, diamondCharge };
}

function metalsToDesignFields(metals: ParsedMetalRow[]) {
  const makingCharges: Record<string, number> = {};
  const estimatedMetalWeight: Record<string, number> = {};
  const diamondCharges: Record<string, number> = {};

  for (const metal of metals) {
    if (metal.kind === 'fixed' && metal.fixedPrice) {
      makingCharges[metal.slug] = metal.fixedPrice;
    }
    if (metal.kind === 'weight' && metal.weightGrams) {
      estimatedMetalWeight[metal.slug] = metal.weightGrams;
    }
    if (metal.diamondCharge) {
      diamondCharges[metal.slug] = metal.diamondCharge;
    }
  }

  const designDiamond = getDesignWideDiamondCharge(diamondCharges);
  if (designDiamond > 0) {
    const availableSlugs = new Set([
      ...Object.keys(makingCharges),
      ...Object.keys(estimatedMetalWeight),
    ]);
    for (const slug of availableSlugs) {
      diamondCharges[slug] = designDiamond;
    }
  }

  return { makingCharges, estimatedMetalWeight, diamondCharges };
}

function getDesignWideDiamondCharge(diamondCharges: Record<string, number>): number {
  const values = Object.values(diamondCharges);
  if (values.length === 0) return 0;
  return Math.round(Math.max(...values));
}

export function buildDesignFromMetals(
  designNum: number,
  metals: ParsedMetalRow[],
  notes?: string[]
): ParsedJewelryDesign {
  const { makingCharges, estimatedMetalWeight, diamondCharges } = metalsToDesignFields(metals);

  return {
    name: `Design-${designNum}`,
    slug: `design-${designNum}`,
    sortOrder: designNum,
    makingCharges,
    estimatedMetalWeight,
    diamondCharges,
    notes: notes ?? collectDesignNotes(metals),
    metals,
  };
}

export function buildCustomDesign(args: {
  name: string;
  slug: string;
  sortOrder: number;
  metals: ParsedMetalRow[];
  notes?: string[];
  productScope?: 'gemstone' | 'rudraksha';
  rudrakshaCategory?: string | null;
}): ParsedJewelryDesign {
  const { makingCharges, estimatedMetalWeight, diamondCharges } = metalsToDesignFields(args.metals);

  return {
    name: args.name,
    slug: args.slug,
    sortOrder: args.sortOrder,
    makingCharges,
    estimatedMetalWeight,
    diamondCharges,
    notes: args.notes ?? collectDesignNotes(args.metals),
    metals: args.metals,
    productScope: args.productScope,
    rudrakshaCategory: args.rudrakshaCategory ?? null,
  };
}

export function parseDesignBlockRows(
  rows: string[][],
  startRow: number,
  metalCol: number,
  valueCol: number,
  noteCol: number
): ParsedMetalRow[] {
  const metals: ParsedMetalRow[] = [];

  const headerMetal = normalizeMetalLabel(rows[startRow][metalCol] ?? '');
  if (headerMetal) {
    metals.push(parseMetalValue(headerMetal.slug, rows[startRow][valueCol] ?? '', rows[startRow][noteCol]));
  }

  for (let j = startRow + 1; j < rows.length && j <= startRow + 8; j++) {
    const metalLabel = rows[j][metalCol];
    if (!metalLabel) break;
    if (/^Design-\d+$/i.test(rows[j][metalCol]) || /^Design-\d+$/i.test(rows[j][metalCol - 1])) break;

    const mapped = normalizeMetalLabel(metalLabel);
    if (!mapped) continue;

    metals.push(parseMetalValue(mapped.slug, rows[j][valueCol] ?? '', rows[j][noteCol]));
  }

  return metals;
}
