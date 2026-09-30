import { describe, expect, it } from 'vitest';
import { currencySuggestion } from '../../src/lib/currency/geo';

describe('currencySuggestion', () => {
  it('matches the /api/currency/suggest contract', () => {
    expect(currencySuggestion(new Headers({ 'x-vercel-ip-country': 'IN' }))).toEqual({ currency: 'INR', country: 'IN', rs101_paid: true });
    expect(currencySuggestion(new Headers({ 'x-vercel-ip-country': 'us' }))).toMatchObject({ currency: 'USD', country: 'US', rs101_paid: false });
    expect(currencySuggestion(new Headers({ 'accept-language': 'en-GB,en' }))).toEqual({ currency: 'GBP', country: null, rs101_paid: true });
  });
});
