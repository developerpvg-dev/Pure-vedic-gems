import { headers } from 'next/headers';
import { countryCodeFromHeaders, isRs101PaidCountry } from '@/lib/consultation/rs101-eligibility';

export async function getRs101PaidFromHeaders(): Promise<boolean> {
  const h = await headers();
  return isRs101PaidCountry(countryCodeFromHeaders(h));
}
