import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { normalizeCurrencyRates } from '@/lib/admin/commerce-currency';
import { STOREFRONT_CURRENCIES } from '@/lib/currency/catalog';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export const CURRENCY_RATES_CACHE_TAG = 'currency-rates';

async function loadStorefrontRates() {
  const client = createOptionalPublicClient();
  if (!client) {
    return {
      rates: [{ currency: 'INR', rate: 1, is_active: true, base_currency: 'INR' as const }],
      currencies: STOREFRONT_CURRENCIES,
    };
  }

  const db = asUntypedSupabase(client);
  const { data } = await db.from('currency_rates').select('*');
  const rates = normalizeCurrencyRates(data ?? []).filter((row) => row.is_active);

  return {
    rates: rates.length
      ? rates
      : [{ currency: 'INR', rate: 1, is_active: true, base_currency: 'INR' as const }],
    currencies: STOREFRONT_CURRENCIES,
  };
}

/** DB read only until admin busts via revalidateTag. */
export const getCachedStorefrontRates = unstable_cache(loadStorefrontRates, ['currency-rates-payload'], {
  tags: [CURRENCY_RATES_CACHE_TAG],
  revalidate: false,
});

export function bustCurrencyRatesCache() {
  revalidateTag(CURRENCY_RATES_CACHE_TAG, 'max');
  revalidatePath('/api/currency/rates');
}
