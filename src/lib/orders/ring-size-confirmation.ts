/**
 * Ring-size diameter photo confirmation — stored on orders.compliance_flags.
 * No new columns.
 */

import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';

export const RING_SIZE_CONFIRM_STATUSES = ['pending', 'submitted'] as const;
export type RingSizeConfirmStatus = (typeof RING_SIZE_CONFIRM_STATUSES)[number];

export type RingSizeConfirmation = {
  status: RingSizeConfirmStatus;
  requested_at: string;
  image_url?: string;
  submitted_at?: string;
};

function asFlagsRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

/** True when any line item is a ring setting (configurator). */
export function orderHasRingItem(items: unknown): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((item) => {
    if (!item || typeof item !== 'object') return false;
    const snap = parseConfigurationSnapshot(
      (item as { configuration_snapshot?: unknown }).configuration_snapshot,
    );
    const setting = snap?.selections?.setting_type?.toLowerCase();
    if (setting === 'ring') return true;
    if (snap?.selections?.ring_size) return true;
    return false;
  });
}

export function parseRingSizeConfirmation(complianceFlags: unknown): RingSizeConfirmation | null {
  const raw = asFlagsRecord(complianceFlags).ring_size_confirmation;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<RingSizeConfirmation>;
  const status = row.status;
  if (!status || !RING_SIZE_CONFIRM_STATUSES.includes(status as RingSizeConfirmStatus)) return null;
  if (!row.requested_at || typeof row.requested_at !== 'string') return null;
  return {
    status: status as RingSizeConfirmStatus,
    requested_at: row.requested_at,
    image_url: row.image_url ? String(row.image_url).trim() : undefined,
    submitted_at: row.submitted_at ? String(row.submitted_at) : undefined,
  };
}

export function mergeRingSizeConfirmation(
  complianceFlags: unknown,
  confirmation: RingSizeConfirmation,
): Record<string, unknown> {
  return { ...asFlagsRecord(complianceFlags), ring_size_confirmation: confirmation };
}

/** Mark that the confirmation email asked for a diameter photo. */
export function beginRingSizeConfirmation(complianceFlags: unknown): {
  flags: Record<string, unknown>;
  confirmation: RingSizeConfirmation;
} {
  const existing = parseRingSizeConfirmation(complianceFlags);
  if (existing) {
    return { flags: asFlagsRecord(complianceFlags), confirmation: existing };
  }
  const confirmation: RingSizeConfirmation = {
    status: 'pending',
    requested_at: new Date().toISOString(),
  };
  return { flags: mergeRingSizeConfirmation(complianceFlags, confirmation), confirmation };
}

/** Customer uploaded the diameter measurement photo. */
export function recordRingSizeConfirmationUpload(
  complianceFlags: unknown,
  imageUrl: string,
): { flags: Record<string, unknown>; confirmation: RingSizeConfirmation } {
  const url = imageUrl.trim();
  if (!url || !/^https?:\/\//i.test(url)) throw new Error('Valid image URL is required');

  const current = parseRingSizeConfirmation(complianceFlags);
  if (!current) throw new Error('Ring size confirmation was not requested for this order');

  const confirmation: RingSizeConfirmation = {
    ...current,
    status: 'submitted',
    image_url: url,
    submitted_at: new Date().toISOString(),
  };
  return { flags: mergeRingSizeConfirmation(complianceFlags, confirmation), confirmation };
}

export const RING_SIZE_CONFIRM_COPY =
  'Regarding your ring size, to re-confirm the accuracy, we request you to please provide us with the measurement of internal diameter in mm (millimetre) of the ring band that fits you perfectly. Since country to country sometimes the ring size measuring equipment\'s accuracy differ so, to be double sure of the ring size accuracy. We request for the internal diameter (measured by a normal/standard scale in mm) of the final ring size, by placing a scale in the centre of the ring size measuring band (as shown in the attachment picture).';

if (process.env.NODE_ENV !== 'production') {
  const items = [
    { configuration_snapshot: { selections: { setting_type: 'ring', ring_size: 'indian:14' } } },
  ];
  console.assert(orderHasRingItem(items) === true);
  console.assert(orderHasRingItem([{ configuration_snapshot: { selections: { setting_type: 'pendant' } } }]) === false);
  const started = beginRingSizeConfirmation({});
  console.assert(started.confirmation.status === 'pending');
  const uploaded = recordRingSizeConfirmationUpload(started.flags, 'https://example.com/ring.jpg');
  console.assert(uploaded.confirmation.status === 'submitted' && uploaded.confirmation.image_url);
}
