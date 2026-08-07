/**
 * Ring-size diameter photo confirmation — stored on orders.compliance_flags.
 * No new columns. Supports multiple revision rounds (admin requests re-upload).
 */

import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';

export const RING_SIZE_CONFIRM_STATUSES = ['pending', 'submitted'] as const;
export type RingSizeConfirmStatus = (typeof RING_SIZE_CONFIRM_STATUSES)[number];

export type RingSizeConfirmRound = {
  round: number;
  status: RingSizeConfirmStatus;
  requested_at: string;
  notified_at?: string;
  image_url?: string;
  submitted_at?: string;
  /** Admin note when requesting a clearer / corrected photo */
  admin_remarks?: string;
};

export type RingSizeConfirmation = RingSizeConfirmRound & {
  history: RingSizeConfirmRound[];
};

export const RING_SIZE_CONFIRM_STATUS_LABELS: Record<RingSizeConfirmStatus, string> = {
  pending: 'Awaiting customer photo',
  submitted: 'Photo submitted',
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

function parseRound(raw: unknown): RingSizeConfirmRound | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<RingSizeConfirmRound>;
  const status = row.status;
  if (!status || !RING_SIZE_CONFIRM_STATUSES.includes(status as RingSizeConfirmStatus)) return null;
  if (!row.requested_at || typeof row.requested_at !== 'string') return null;
  const round = Number(row.round);
  // ponytail: legacy rows omit round — treat as round 1
  const safeRound = Number.isInteger(round) && round >= 1 ? round : 1;
  return {
    round: safeRound,
    status: status as RingSizeConfirmStatus,
    requested_at: row.requested_at,
    notified_at: row.notified_at ? String(row.notified_at) : undefined,
    image_url: row.image_url ? String(row.image_url).trim() : undefined,
    submitted_at: row.submitted_at ? String(row.submitted_at) : undefined,
    admin_remarks: row.admin_remarks ? String(row.admin_remarks).trim() : undefined,
  };
}

export function parseRingSizeConfirmation(complianceFlags: unknown): RingSizeConfirmation | null {
  const raw = asFlagsRecord(complianceFlags).ring_size_confirmation;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<RingSizeConfirmation> & { history?: unknown };
  const current = parseRound(row);
  if (!current) return null;
  const history = Array.isArray(row.history)
    ? row.history.map(parseRound).filter((r): r is RingSizeConfirmRound => Boolean(r))
    : [];
  return { ...current, history };
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
  const now = new Date().toISOString();
  const confirmation: RingSizeConfirmation = {
    round: 1,
    status: 'pending',
    requested_at: now,
    notified_at: now,
    history: [],
  };
  return { flags: mergeRingSizeConfirmation(complianceFlags, confirmation), confirmation };
}

/**
 * Admin: photo is wrong — archive current round, open a new pending round with remarks, notify.
 * If already waiting (pending, no new image yet), refresh remarks + timestamp without bumping round.
 */
export function beginRingSizeConfirmationNotify(
  complianceFlags: unknown,
  remarks: string,
): { flags: Record<string, unknown>; confirmation: RingSizeConfirmation } {
  const note = remarks.trim();
  if (!note) throw new Error('Describe what is wrong with the photo');

  const current = parseRingSizeConfirmation(complianceFlags);
  if (!current) {
    throw new Error('Ring size confirmation was not started for this order');
  }

  const now = new Date().toISOString();

  // Still waiting on this round — resend same round with updated guidance
  if (current.status === 'pending') {
    const confirmation: RingSizeConfirmation = {
      ...current,
      admin_remarks: note,
      notified_at: now,
      requested_at: now,
    };
    return { flags: mergeRingSizeConfirmation(complianceFlags, confirmation), confirmation };
  }

  // submitted → archive and open next round
  const history = [...current.history];
  const { history: _h, ...past } = current;
  history.push(past);

  const confirmation: RingSizeConfirmation = {
    round: current.round + 1,
    status: 'pending',
    requested_at: now,
    notified_at: now,
    admin_remarks: note,
    history,
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
  if (current.status !== 'pending') {
    throw new Error('This upload link is no longer active — wait for a new request from us');
  }

  const confirmation: RingSizeConfirmation = {
    ...current,
    status: 'submitted',
    image_url: url,
    submitted_at: new Date().toISOString(),
  };
  return { flags: mergeRingSizeConfirmation(complianceFlags, confirmation), confirmation };
}

/**
 * Admin: remove a diameter photo URL from the current round or history.
 * Current round with no photo left → pending so the customer can upload again.
 */
export function clearRingSizeConfirmationImage(
  complianceFlags: unknown,
  imageUrl: string,
): { flags: Record<string, unknown>; confirmation: RingSizeConfirmation; clearedUrl: string } {
  const url = imageUrl.trim();
  if (!url) throw new Error('Image URL is required');

  const current = parseRingSizeConfirmation(complianceFlags);
  if (!current) throw new Error('Ring size confirmation was not started for this order');

  if (current.image_url === url) {
    const confirmation: RingSizeConfirmation = {
      ...current,
      status: 'pending',
      image_url: undefined,
      submitted_at: undefined,
    };
    return {
      flags: mergeRingSizeConfirmation(complianceFlags, confirmation),
      confirmation,
      clearedUrl: url,
    };
  }

  let found = false;
  const history = current.history.map((past) => {
    if (past.image_url !== url) return past;
    found = true;
    const { image_url: _drop, submitted_at: _s, ...rest } = past;
    return rest;
  });
  if (!found) throw new Error('That ring size photo is not on this order');

  const confirmation: RingSizeConfirmation = { ...current, history };
  return {
    flags: mergeRingSizeConfirmation(complianceFlags, confirmation),
    confirmation,
    clearedUrl: url,
  };
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
  console.assert(started.confirmation.status === 'pending' && started.confirmation.round === 1);
  const uploaded = recordRingSizeConfirmationUpload(started.flags, 'https://example.com/ring.jpg');
  console.assert(uploaded.confirmation.status === 'submitted' && uploaded.confirmation.image_url);
  const rerequest = beginRingSizeConfirmationNotify(uploaded.flags, 'Scale is not centred — please retake');
  console.assert(rerequest.confirmation.round === 2 && rerequest.confirmation.status === 'pending');
  console.assert(rerequest.confirmation.history.length === 1);
  console.assert(rerequest.confirmation.admin_remarks?.includes('centred'));
  const clearedHistory = clearRingSizeConfirmationImage(
    rerequest.flags,
    'https://example.com/ring.jpg',
  );
  console.assert(!clearedHistory.confirmation.history[0]?.image_url);
  const uploaded2 = recordRingSizeConfirmationUpload(clearedHistory.flags, 'https://example.com/ring2.jpg');
  const clearedCurrent = clearRingSizeConfirmationImage(uploaded2.flags, 'https://example.com/ring2.jpg');
  console.assert(clearedCurrent.confirmation.status === 'pending' && !clearedCurrent.confirmation.image_url);
  // legacy shape (no round / history)
  const legacy = parseRingSizeConfirmation({
    ring_size_confirmation: {
      status: 'submitted',
      requested_at: '2024-01-01T00:00:00.000Z',
      image_url: 'https://example.com/old.jpg',
    },
  });
  console.assert(legacy?.round === 1 && legacy.history.length === 0);
}
