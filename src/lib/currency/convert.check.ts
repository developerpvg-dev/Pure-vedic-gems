/**
 * Self-check: INR → FX conversion + safe money locales (`.` decimal, never `,`).
 * Run: npx tsx src/lib/currency/convert.check.ts
 */

import assert from 'node:assert/strict';
import { FX_CURRENCY_CODES } from '@/lib/currency/catalog';
import {
  convertFromInr,
  convertToInr,
  localeForCurrency,
  setCurrencyDisplay,
} from './display-store';
import {
  suggestCurrencyFromCountryCode,
  suggestCurrencyFromLanguage,
} from './geo';

setCurrencyDisplay({
  enabled: true,
  currency: 'USD',
  rates: { INR: 1, USD: 83, AED: 22.6, EUR: 107.67 },
});

assert.equal(convertFromInr(8300, 'USD'), 100);
assert.equal(convertFromInr(2260, 'AED'), 100);
assert.equal(convertFromInr(500, 'INR'), 500);
assert.equal(convertToInr(100, 'USD'), 8300);
assert.equal(convertToInr(100, 'AED'), 2260);

// Pearl: ₹2600 ÷ buffered EUR rate ≈ 24.15 (not 2415).
const eur = convertFromInr(2600, 'EUR');
assert.ok(Math.abs(eur - 2600 / 107.67) < 1e-9);
assert.ok(eur > 20 && eur < 30, `EUR total should be ~24, got ${eur}`);

setCurrencyDisplay({ enabled: false, currency: 'USD' });
assert.equal(convertFromInr(8300, 'USD'), 8300); // conversion off → passthrough
assert.equal(convertToInr(100, 'USD'), 100);

assert.equal(suggestCurrencyFromLanguage('en-US'), 'USD');
assert.equal(suggestCurrencyFromLanguage('en-GB'), 'GBP');
assert.equal(suggestCurrencyFromLanguage('hi-IN'), 'INR');
assert.equal(suggestCurrencyFromLanguage('de-DE'), 'EUR');

assert.equal(suggestCurrencyFromCountryCode('US'), 'USD');
assert.equal(suggestCurrencyFromCountryCode('GB'), 'GBP');
assert.equal(suggestCurrencyFromCountryCode('AE'), 'AED');
assert.equal(suggestCurrencyFromCountryCode('IN'), 'INR');
assert.equal(suggestCurrencyFromCountryCode('DE'), 'EUR');
assert.equal(suggestCurrencyFromCountryCode(null), 'INR');

/** Every storefront currency must format with `.` decimal (or none for JPY/INR integers). */
function assertSafeMoneyLocale(code: string) {
  const locale = localeForCurrency(code);
  assert.ok(locale.startsWith('en-'), `${code} locale must be English (got ${locale})`);

  const sample = code === 'JPY' || code === 'INR' ? 2415 : 24.15;
  const maxFrac = code === 'JPY' || code === 'INR' ? 0 : 2;
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: maxFrac,
    maximumFractionDigits: maxFrac,
  }).formatToParts(sample);

  const decimal = parts.find((p) => p.type === 'decimal')?.value;
  if (decimal != null) {
    assert.equal(decimal, '.', `${code} decimal must be "." (got ${JSON.stringify(decimal)})`);
  }

  const label = parts.map((p) => p.value).join('');
  assert.ok(!/,\d{2}(?:\D|$)/.test(label), `${code} label must not look like comma-decimal: ${label}`);
}

assertSafeMoneyLocale('INR');
for (const code of FX_CURRENCY_CODES) assertSafeMoneyLocale(code);

const eurLabel = new Intl.NumberFormat(localeForCurrency('EUR'), {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(24.15);
assert.ok(/24\.15/.test(eurLabel), `EUR label should contain 24.15: ${eurLabel}`);

console.log('currency convert check ok');
