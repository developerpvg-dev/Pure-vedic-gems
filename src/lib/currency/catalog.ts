/** Currencies we show on the storefront (markets we target). */

export type StorefrontCurrency = {
  code: string;
  name: string;
  /** ISO 3166-1 alpha-2 (or eu) for flag images — emoji flags break on Windows. */
  flagCountry: string;
  /** ISO country codes that default to this currency */
  countries: string[];
};

export const STOREFRONT_CURRENCIES: StorefrontCurrency[] = [
  { code: 'INR', name: 'Indian Rupee', flagCountry: 'in', countries: ['IN'] },
  { code: 'USD', name: 'US Dollar', flagCountry: 'us', countries: ['US'] },
  { code: 'EUR', name: 'Euro', flagCountry: 'eu', countries: ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'] },
  { code: 'GBP', name: 'British Pound', flagCountry: 'gb', countries: ['GB'] },
  { code: 'AED', name: 'UAE Dirham', flagCountry: 'ae', countries: ['AE'] },
  { code: 'QAR', name: 'Qatari Rial', flagCountry: 'qa', countries: ['QA'] },
  { code: 'SAR', name: 'Saudi Riyal', flagCountry: 'sa', countries: ['SA'] },
  { code: 'CAD', name: 'Canadian Dollar', flagCountry: 'ca', countries: ['CA'] },
  { code: 'AUD', name: 'Australian Dollar', flagCountry: 'au', countries: ['AU'] },
  { code: 'SGD', name: 'Singapore Dollar', flagCountry: 'sg', countries: ['SG'] },
  { code: 'NPR', name: 'Nepalese Rupee', flagCountry: 'np', countries: ['NP'] },
  { code: 'JPY', name: 'Japanese Yen', flagCountry: 'jp', countries: ['JP'] },
  { code: 'CHF', name: 'Swiss Franc', flagCountry: 'ch', countries: ['CH'] },
];

/** Prefer local SVGs under /public/flags; CDN only as last resort. */
export function flagSrcForCountry(flagCountry: string): string {
  const key = flagCountry.toLowerCase();
  return `/flags/${key}.svg`;
}

export function flagSrcForCurrency(code: string): string {
  const row = getStorefrontCurrency(code);
  return flagSrcForCountry(row?.flagCountry ?? 'in');
}

/** FX codes editable in admin (excludes base INR). */
export const FX_CURRENCY_CODES = STOREFRONT_CURRENCIES.map((c) => c.code).filter((c) => c !== 'INR');

const BY_CODE = new Map(STOREFRONT_CURRENCIES.map((c) => [c.code, c]));
const BY_COUNTRY = new Map<string, string>();
for (const c of STOREFRONT_CURRENCIES) {
  for (const country of c.countries) BY_COUNTRY.set(country, c.code);
}

export function getStorefrontCurrency(code: string): StorefrontCurrency | undefined {
  return BY_CODE.get(code.toUpperCase());
}

export function currencyFromCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return 'INR';
  return BY_COUNTRY.get(countryCode.toUpperCase()) ?? 'INR';
}

export function isStorefrontCurrency(code: string): boolean {
  return BY_CODE.has(code.toUpperCase());
}
