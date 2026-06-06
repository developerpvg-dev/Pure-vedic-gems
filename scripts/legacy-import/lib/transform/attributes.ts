/**
 * Parse legacy WooCommerce per-product attribute option strings into
 * structured option rules.
 *
 * Examples of source strings (one per attribute "value", pipe-separated in
 * the CSV / postmeta):
 *
 *   "Lab Certificate - GTL Jaipur (+3 Days) .....+Rs1,200.00"
 *   "Energization Pooja (+5 Days) .....+Rs2,100.00"
 *   "Sterling Silver | 14K Yellow Gold (+Rs8,500.00) | 18K Yellow Gold (+Rs14,000.00)"
 *   "Ring | Pendant (+Rs500.00) | Bracelet (+Rs1,200.00)"
 *
 * PR-3 implements. Contract is documented here so 03-transform and tests can
 * be written against it.
 */

export type OptionKind = 'certificate' | 'energization' | 'metal' | 'mount' | 'size' | 'size_system';

export interface ParsedOption {
  kind: OptionKind;
  optionLabel: string;
  optionSlug?: string;
  priceDelta?: number;
  turnaroundDays?: number;
  labCode?: string;
  raw: string;
}

export function parseAttributeValues(_kind: OptionKind, _rawValue: string): ParsedOption[] {
  throw new Error('parseAttributeValues: not yet implemented (PR-3).');
}
