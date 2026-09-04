import { publicCdnOrigin } from '@/lib/site-static';

/** Public catalog buckets served via R2 when NEXT_PUBLIC_CDN_URL is set. */
export const PUBLIC_MEDIA_BUCKETS = [
  'products',
  'product-images',
  'certificates',
  'jewelry-designs',
  'reviews',
  'site-static',
] as const;

export type PublicMediaBucket = (typeof PUBLIC_MEDIA_BUCKETS)[number];

export function isPublicMediaBucket(name: string): name is PublicMediaBucket {
  return (PUBLIC_MEDIA_BUCKETS as readonly string[]).includes(name);
}

/** Encode object key path segments for a public URL. */
export function encodeObjectKey(path: string): string {
  return path
    .replace(/^\/+/, '')
    .split('/')
    .map((seg) => {
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch {
        return encodeURIComponent(seg);
      }
    })
    .join('/');
}

/** CDN URL: `{cdn}/{bucket}/{path}` */
export function cdnObjectUrl(bucket: string, objectPath: string, cdn = publicCdnOrigin()): string | null {
  if (!cdn) return null;
  return `${cdn}/${bucket}/${encodeObjectKey(objectPath)}`;
}

/** Supabase public object URL (fallback / private stay). */
export function supabaseObjectUrl(bucket: string, objectPath: string, supabaseUrl?: string): string {
  const base = (supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${bucket}/${encodeObjectKey(objectPath)}`;
}

/** Prefer CDN when configured. */
export function publicObjectUrl(bucket: string, objectPath: string): string {
  return cdnObjectUrl(bucket, objectPath) ?? supabaseObjectUrl(bucket, objectPath);
}

export type ParsedPublicObject = { bucket: string; path: string; via: 'cdn' | 'supabase' };

/**
 * Parse our public media URL (CDN or Supabase Storage).
 * CDN shape: https://cdn…/{bucket}/{path}
 * Supabase: …/storage/v1/object/public/{bucket}/{path}
 */
export function parsePublicMediaUrl(url: string): ParsedPublicObject | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;

  const cdn = publicCdnOrigin();
  if (cdn && parsed.origin === cdn) {
    const parts = parsed.pathname.replace(/^\/+/, '').split('/');
    const bucket = parts[0] ?? '';
    const path = parts
      .slice(1)
      .map((s) => {
        try {
          return decodeURIComponent(s);
        } catch {
          return s;
        }
      })
      .join('/');
    if (!bucket || !path || path.includes('..') || !isPublicMediaBucket(bucket)) return null;
    return { bucket, path, via: 'cdn' };
  }

  const marker = '/storage/v1/object/public/';
  const idx = parsed.pathname.indexOf(marker);
  if (idx === -1) return null;
  if (!parsed.hostname.endsWith('.supabase.co')) return null;
  const rest = parsed.pathname.slice(idx + marker.length);
  const slash = rest.indexOf('/');
  if (slash <= 0) return null;
  const bucket = decodeURIComponent(rest.slice(0, slash));
  const path = decodeURIComponent(rest.slice(slash + 1));
  if (!bucket || !path || path.includes('..')) return null;
  return { bucket, path, via: 'supabase' };
}

if (process.env.NODE_ENV !== 'production') {
  const prev = process.env.NEXT_PUBLIC_CDN_URL;
  process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.purevedicgems.com';
  console.assert(
    publicObjectUrl('products', 'images/a.webp') ===
      'https://cdn.purevedicgems.com/products/images/a.webp',
  );
  const p = parsePublicMediaUrl('https://cdn.purevedicgems.com/products/images/a%20b.webp');
  console.assert(p?.bucket === 'products' && p.path === 'images/a b.webp');
  const s = parsePublicMediaUrl(
    'https://xyz.supabase.co/storage/v1/object/public/products/images/1.jpg',
  );
  console.assert(s?.bucket === 'products' && s.path === 'images/1.jpg' && s.via === 'supabase');
  process.env.NEXT_PUBLIC_CDN_URL = prev;
}
