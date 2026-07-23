/** Hardcoded company accounts for customer bank-transfer checkout. */

export const BANK_ACCOUNTS = [
  {
    id: 'icici',
    label: 'ICICI Bank',
    account_name: 'Pure Vedic Gems Private Limited',
    account_number: '017105007932',
    branch: 'E-30, Saket, New Delhi - 110017',
    ifsc: 'ICIC0000171',
    micr: '110229014',
    swift: 'ICICNBBCTS',
  },
  {
    id: 'hdfc',
    label: 'HDFC Bank',
    account_name: 'Pure Vedic Gems Private Limited',
    account_number: '50200030752400',
    branch: 'M-1, Saket, New Delhi - 110017',
    ifsc: 'HDFC0002005',
    micr: '110240238',
    swift: 'HDFCINBBDEL',
  },
  {
    id: 'indusind',
    label: 'IndusInd Bank',
    account_name: 'Pure Vedic Gems Private Limited',
    account_number: '201004218815',
    branch: 'C, Sector 48, Noida, Uttar Pradesh - 201304',
    ifsc: 'INDB0000565',
    micr: '110234055',
    swift: null as string | null,
  },
] as const;

export type BankAccountId = (typeof BANK_ACCOUNTS)[number]['id'];

export function getBankAccount(id: string) {
  return BANK_ACCOUNTS.find((b) => b.id === id) ?? null;
}

export const BANK_TRANSFER_HOLD_MS = 72 * 60 * 60 * 1000;

// ponytail: `npx tsx -e "import { __bankAccountsSelfCheck } from './src/lib/constants/bank-accounts.ts'; __bankAccountsSelfCheck()"`
export function __bankAccountsSelfCheck() {
  console.assert(BANK_ACCOUNTS.length === 3, 'three banks');
  console.assert(getBankAccount('icici')?.ifsc === 'ICIC0000171', 'icici ifsc');
  console.assert(getBankAccount('nope') === null, 'unknown bank');
  console.log('bank-accounts self-check ok');
}
