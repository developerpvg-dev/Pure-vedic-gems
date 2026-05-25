export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 240);
}

export function extractYouTubeId(urlOrId: string) {
  const value = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{6,40}$/.test(value)) return value;

  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] ?? '';
    if (url.searchParams.get('v')) return url.searchParams.get('v') ?? '';
    const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    return embedMatch?.[1] ?? '';
  } catch {
    return '';
  }
}
