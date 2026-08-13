import {
  decodeMetalRowsFromDesign,
  laborRatesFromDesignRecord,
} from '@/lib/utils/jewelry-design-fields';
import { calculateJewelryDesignPricing } from '@/lib/utils/jewelry-pricing';
import { formatPrice } from '@/lib/utils/format';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import {
  laborRatesFromCatalog,
  parseMetalCatalogFromApi,
  pricingModesFromCatalog,
  ratesBySlugFromCatalog,
} from '@/lib/utils/metal-pricing-config';
import type { PublicDesignDetail } from '@/lib/designs/public';

function inr(amount: number) {
  return formatPrice(amount, 'INR');
}

async function loadMetalCatalog() {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('metals')
    .select(
      'id, name, slug, purity, price_per_gram, labor_rate_percent, gst_rate_percent, pricing_mode, sort_order, is_active'
    )
    .eq('is_active', true)
    .order('sort_order');
  if (error || !data) return [];
  return parseMetalCatalogFromApi(data);
}

export async function DesignPricingDetails({ design }: { design: PublicDesignDetail }) {
  const catalog = await loadMetalCatalog();
  const ratesBySlug = ratesBySlugFromCatalog(catalog);
  const pricingModes = pricingModesFromCatalog(catalog);
  const laborRates = {
    ...laborRatesFromCatalog(catalog),
    ...laborRatesFromDesignRecord(design),
  };

  const rows = decodeMetalRowsFromDesign(design, catalog).filter(
    (row) => row.status === 'available' || row.status === 'on_request'
  );

  const priced = rows
    .map((row) => {
      if (row.status === 'on_request') {
        return { label: row.label, priceLabel: 'On request' as const };
      }

      const pricing = calculateJewelryDesignPricing({
        metal: row.slug,
        makingCharges: design.making_charges,
        estimatedMetalWeight: design.estimated_metal_weight,
        diamondCharges: design.diamond_charges,
        metalRatePerGram: ratesBySlug[row.slug] ?? 0,
        laborRates,
        pricingModes,
      });

      const total = pricing.metalPrice + pricing.makingCharge + pricing.diamondCharge;
      if (total <= 0) return null;

      return { label: row.label, priceLabel: inr(total) };
    })
    .filter((row): row is { label: string; priceLabel: string } => row != null);

  if (priced.length === 0) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-[#e8dfd0] bg-white/70">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#f0e8dc] text-[11px] uppercase tracking-wide text-[#8a7a68]">
            <th className="px-3 py-2 font-semibold">Metal</th>
            <th className="px-3 py-2 font-semibold">Price</th>
          </tr>
        </thead>
        <tbody>
          {priced.map((row) => (
            <tr key={row.label} className="border-b border-[#f7f1e6] last:border-0">
              <td className="px-3 py-2.5 font-medium text-[#2c0404]">{row.label}</td>
              <td className="px-3 py-2.5 text-[#5a5043]">{row.priceLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
