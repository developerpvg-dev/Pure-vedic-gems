import {
  countryCodeFromHeaders,
  isRs101GemRecommendation,
  isRs101PaidCountry,
  RS101_PAID_COUNTRY_CODE,
} from '@/lib/consultation/rs101-eligibility';

if (RS101_PAID_COUNTRY_CODE !== 'IN') throw new Error('paid country must be IN');
if (isRs101PaidCountry('IN') !== true) throw new Error('IN must be paid');
if (isRs101PaidCountry('US') !== false) throw new Error('US must be free');
if (isRs101PaidCountry('GB') !== false) throw new Error('GB must be free');
if (isRs101PaidCountry(null) !== true) throw new Error('unknown geo must default paid');
if (isRs101PaidCountry('XX') !== true) throw new Error('XX must default paid');

const headers = new Headers({ 'x-vercel-ip-country': 'US' });
if (countryCodeFromHeaders(headers) !== 'US') throw new Error('header parse US');
if (isRs101PaidCountry(countryCodeFromHeaders(headers)) !== false) throw new Error('US header free');

if (!isRs101GemRecommendation({ plan_id: null, plan_title_snapshot: 'Gem Recommendation', amount_inr: 0 })) {
  throw new Error('free rs101 classify');
}
if (!isRs101GemRecommendation({ plan_id: null, plan_title_snapshot: 'Gem Recommendation', amount_inr: 101 })) {
  throw new Error('paid rs101 classify');
}

console.log('rs101-eligibility self-check ok');
