import { NextResponse } from 'next/server';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { normalizeCurrencyRates } from '@/lib/admin/commerce-currency';
import { suggestCurrencyFromRequest } from '@/lib/currency/geo';
import { STOREFRONT_CURRENCIES } from '@/lib/currency/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const suggestedCurrency = await suggestCurrencyFromRequest();
  const client = createOptionalPublicClient();

  if (!client) {
    return NextResponse.json({
      rates: [{ currency: 'INR', rate: 1, is_active: true, base_currency: 'INR' }],
      suggestedCurrency,
      currencies: STOREFRONT_CURRENCIES,
    });
  }

  const db = asUntypedSupabase(client);
  const { data } = await db.from('currency_rates').select('*');
  const rates = normalizeCurrencyRates(data ?? []).filter((row) => row.is_active);

  return NextResponse.json({
    rates: rates.length
      ? rates
      : [{ currency: 'INR', rate: 1, is_active: true, base_currency: 'INR' }],
    suggestedCurrency,
    currencies: STOREFRONT_CURRENCIES,
  });
}
