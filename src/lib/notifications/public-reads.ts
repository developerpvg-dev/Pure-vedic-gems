const PUBLIC_READS_KEY = 'pvg_public_notification_reads_v1';

export function getPublicNotificationReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(PUBLIC_READS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function markPublicNotificationsRead(ids: string[]) {
  if (typeof window === 'undefined' || !ids.length) return;
  const current = getPublicNotificationReadIds();
  ids.forEach((id) => current.add(id));
  try {
    window.localStorage.setItem(PUBLIC_READS_KEY, JSON.stringify([...current]));
  } catch {
    // Ignore quota / private browsing failures.
  }
}
