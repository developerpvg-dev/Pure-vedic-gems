export const BROADCAST_METADATA_FLAG = 'broadcast';

export type BroadcastMetadata = {
  broadcast?: boolean;
  is_active?: boolean;
  expires_at?: string | null;
  created_by?: string;
  created_by_email?: string | null;
};

export type BroadcastRecord = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  created_at: string;
  audience?: string;
  recipient_user_id?: string | null;
  metadata?: BroadcastMetadata | Record<string, unknown> | null;
  is_active?: boolean;
  expires_at?: string | null;
};

export function getBroadcastMetadata(row: BroadcastRecord): BroadcastMetadata {
  if (!row.metadata || typeof row.metadata !== 'object') return {};
  return row.metadata as BroadcastMetadata;
}

export function isBroadcastRow(row: BroadcastRecord) {
  if (row.audience === 'public') return true;
  const metadata = getBroadcastMetadata(row);
  return metadata.broadcast === true && !row.recipient_user_id;
}

export function getBroadcastIsActive(row: BroadcastRecord) {
  if (typeof row.is_active === 'boolean') return row.is_active;
  const metadata = getBroadcastMetadata(row);
  return metadata.is_active !== false;
}

export function getBroadcastExpiresAt(row: BroadcastRecord) {
  if (row.expires_at) return row.expires_at;
  const metadata = getBroadcastMetadata(row);
  return typeof metadata.expires_at === 'string' ? metadata.expires_at : null;
}

export function isActiveBroadcast(row: BroadcastRecord) {
  if (!isBroadcastRow(row)) return false;
  if (!getBroadcastIsActive(row)) return false;
  const expiresAt = getBroadcastExpiresAt(row);
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return false;
  return true;
}

export function toBroadcastView(row: BroadcastRecord) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    href: row.href,
    is_active: getBroadcastIsActive(row),
    expires_at: getBroadcastExpiresAt(row),
    created_at: row.created_at,
  };
}

export function buildBroadcastMetadata(
  input: {
    expiresAt?: string | null;
    metadata?: Record<string, unknown>;
    isActive?: boolean;
  } = {}
): BroadcastMetadata {
  return {
    broadcast: true,
    is_active: input.isActive ?? true,
    expires_at: input.expiresAt ?? null,
    ...(input.metadata ?? {}),
  };
}
