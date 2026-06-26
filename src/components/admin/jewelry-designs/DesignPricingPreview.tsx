'use client';

import { calculateJewelryDesignPricing } from '@/lib/utils/jewelry-pricing';
import {
  resolveJewelryGstPercent,
  type MetalCatalogEntry,
  type MetalPricingMode,
} from '@/lib/utils/metal-pricing-config';
import type { DesignMetalRow } from '@/lib/utils/jewelry-design-fields';
import { encodeMetalRowsToDesignFields } from '@/lib/utils/jewelry-design-fields';
import { formatPrice } from '@/lib/utils/format';

type MetalRates = Record<string, number>;

interface DesignPricingPreviewProps {
  metalRows: DesignMetalRow[];
  metalRates: MetalRates;
  laborRates?: Record<string, number>;
  pricingModes?: Record<string, MetalPricingMode>;
  metalCatalog?: MetalCatalogEntry[];
  defaultGstPercent?: number;
  previewMetalSlug: string | null;
  designDiamondCharge?: number | null;
  stoneAddonLabel?: string;
}
export default function DesignPricingPreview({
  metalRows,
  metalRates,
  laborRates,
  pricingModes,
  metalCatalog,
  defaultGstPercent = 3,
  previewMetalSlug,
  designDiamondCharge,
  stoneAddonLabel = '',
}: DesignPricingPreviewProps) {
  if (!previewMetalSlug) {
    return (
      <p className="text-xs text-gray-500">
        Select an available metal row to preview estimated customer pricing.
      </p>
    );
  }

  const row = metalRows.find((entry) => entry.slug === previewMetalSlug);
  if (!row || row.status !== 'available') {
    return (
      <p className="text-xs text-amber-700">
        This metal is not available for the selected configuration.
      </p>
    );
  }

  const encoded = encodeMetalRowsToDesignFields(metalRows, designDiamondCharge ?? null);
  const ratePerGram = metalRates[previewMetalSlug] ?? 0;

  const pricing = calculateJewelryDesignPricing({
    metal: previewMetalSlug,
    makingCharges: encoded.making_charges,
    estimatedMetalWeight: encoded.estimated_metal_weight,
    diamondCharges: encoded.diamond_charges,
    metalRatePerGram: ratePerGram,
    laborRates,
    pricingModes,
  });

  const gstRate = resolveJewelryGstPercent(
    previewMetalSlug,
    metalCatalog,
    defaultGstPercent
  );
  const stoneLabel =
    stoneAddonLabel.trim() ||
    (pricing.diamondCharge > 0 ? 'Diamond' : '');
  const subtotal =
    pricing.metalPrice + pricing.makingCharge + pricing.diamondCharge;
  const gstEstimate = Math.round((subtotal * gstRate) / 100);
  const totalWithGst = subtotal + gstEstimate;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm">
      <p className="font-semibold text-gray-900">Pricing preview — {row.label}</p>
      <p className="mt-1 text-xs text-gray-500">
        Weight-based gold/platinum: metal rate × grams + labor (
        {pricing.laborRatePercent}% of metal value). GST {gstRate}% applied at checkout.
      </p>
      <dl className="mt-3 space-y-1.5 text-xs">
        {pricing.metalWeightGrams > 0 && (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Metal weight</dt>
              <dd className="font-medium text-gray-900">{pricing.metalWeightGrams} g</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Metal value @ {formatPrice(ratePerGram)}/g</dt>
              <dd className="font-medium text-gray-900">{formatPrice(pricing.metalPrice)}</dd>
            </div>
          </>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">
            {pricing.pricingKind === 'weight' && pricing.laborRatePercent > 0
              ? `Labor (${pricing.laborRatePercent}% of metal)`
              : pricing.metalWeightGrams > 0
                ? 'Making / labor'
                : 'Fixed making charge'}
          </dt>
          <dd className="font-medium text-gray-900">{formatPrice(pricing.makingCharge)}</dd>
        </div>
        {pricing.diamondCharge > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">
              {stoneLabel} add-on (design-wide)
            </dt>
            <dd className="font-medium text-gray-900">{formatPrice(pricing.diamondCharge)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-amber-200/80 pt-2">
          <dt className="text-gray-600">Jewellery subtotal (ex-GST)</dt>
          <dd className="font-semibold text-gray-900">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Est. GST ({gstRate}%)</dt>
          <dd className="font-medium text-gray-900">{formatPrice(gstEstimate)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-semibold text-gray-900">Est. jewellery total</dt>
          <dd className="font-bold text-amber-800">{formatPrice(totalWithGst)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-gray-500">
        Gemstone price, certification, energization, and shipping are added separately in the configurator.
      </p>
    </div>
  );
}
