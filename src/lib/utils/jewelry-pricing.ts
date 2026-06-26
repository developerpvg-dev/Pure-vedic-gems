import { resolveLaborRatePercent, resolveMetalPricingMode } from '@/lib/utils/metal-pricing-config';
import type { MetalPricingMode } from '@/lib/utils/metal-pricing-config';
function asNumberRecord(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'number' && Number.isFinite(raw)) out[key] = raw;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function getDesignWideDiamondCharge(diamondCharges: unknown): number {
  const diamonds = asNumberRecord(diamondCharges);
  if (!diamonds) return 0;
  const values = Object.values(diamonds);
  if (values.length === 0) return 0;
  return Math.round(Math.max(...values));
}

export function parseDiamondCharge(note?: string): number | null {
  const cleaned = note?.trim() ?? '';
  if (!cleaned || cleaned === 'undefined' || !/diamond|lakh/i.test(cleaned)) return null;

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

export function isMetalAvailableForDesign(
  metal: string,
  makingCharges: unknown,
  estimatedMetalWeight: unknown,
  metalFlags?: unknown
): boolean {
  if (metalFlags && typeof metalFlags === 'object' && !Array.isArray(metalFlags)) {
    const flag = (metalFlags as Record<string, string>)[metal];
    if (flag === 'on_request' || flag === 'unavailable') return false;
  }

  const charges = asNumberRecord(makingCharges);
  const weights = asNumberRecord(estimatedMetalWeight);
  if (charges && metal in charges && charges[metal] > 0) return true;
  if (weights && metal in weights && weights[metal] > 0) return true;
  return false;
}

export function getAvailableMetalsForDesign(
  makingCharges: unknown,
  estimatedMetalWeight: unknown,
  metalFlags?: unknown
): string[] {
  const metals = new Set<string>();
  const charges = asNumberRecord(makingCharges);
  const weights = asNumberRecord(estimatedMetalWeight);
  if (charges) {
    for (const [metal, value] of Object.entries(charges)) {
      if (value > 0 && isMetalAvailableForDesign(metal, makingCharges, estimatedMetalWeight, metalFlags)) {
        metals.add(metal);
      }
    }
  }
  if (weights) {
    for (const [metal, value] of Object.entries(weights)) {
      if (value > 0 && isMetalAvailableForDesign(metal, makingCharges, estimatedMetalWeight, metalFlags)) {
        metals.add(metal);
      }
    }
  }
  return [...metals];
}

export function calculateJewelryDesignPricing(args: {
  metal: string;
  makingCharges: unknown;
  estimatedMetalWeight: unknown;
  diamondCharges?: unknown;
  metalRatePerGram: number;
  laborRates?: Record<string, number> | null;
  pricingModes?: Record<string, MetalPricingMode> | null;
}): {
  makingCharge: number;
  diamondCharge: number;
  metalPrice: number;
  metalWeightGrams: number;
  laborRatePercent: number;
  pricingKind: 'weight' | 'fixed';
} {
  const charges = asNumberRecord(args.makingCharges);
  const weights = asNumberRecord(args.estimatedMetalWeight);
  const diamondCharge = getDesignWideDiamondCharge(args.diamondCharges);
  const fixedCharge = charges?.[args.metal] ?? 0;
  const metalWeightGrams = weights?.[args.metal] ?? 0;
  const laborRatePercent = resolveLaborRatePercent(args.metal, args.laborRates);
  const pricingMode = resolveMetalPricingMode(args.metal, args.pricingModes);

  if (pricingMode === 'fixed_sheet' && fixedCharge > 0) {
    return {
      makingCharge: Math.round(fixedCharge),
      diamondCharge,
      metalPrice: 0,
      metalWeightGrams: 0,
      laborRatePercent: 0,
      pricingKind: 'fixed',
    };
  }

  if (metalWeightGrams > 0 && pricingMode === 'weight') {
    const metalPrice = Math.round(metalWeightGrams * args.metalRatePerGram);
    const makingCharge =
      laborRatePercent > 0 ? Math.round((metalPrice * laborRatePercent) / 100) : 0;
    return {
      makingCharge,
      diamondCharge,
      metalPrice,
      metalWeightGrams,
      laborRatePercent,
      pricingKind: 'weight',
    };
  }

  if (fixedCharge > 0) {
    return {
      makingCharge: Math.round(fixedCharge),
      diamondCharge,
      metalPrice: 0,
      metalWeightGrams: 0,
      laborRatePercent: 0,
      pricingKind: 'fixed',
    };
  }

  return {
    makingCharge: 0,
    diamondCharge,
    metalPrice: 0,
    metalWeightGrams: 0,
    laborRatePercent: 0,
    pricingKind: 'fixed',
  };
}
