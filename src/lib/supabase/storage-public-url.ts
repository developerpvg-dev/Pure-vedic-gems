import { parsePublicMediaUrl } from '@/lib/media/public-url';

const DELETABLE_BUCKETS = ['products', 'custom-uploads', 'certificates', 'jewelry-designs', 'reviews'] as const;

/** Parse our public object URL → { bucket, path } for delete (CDN or Supabase). */
export function storageObjectFromPublicUrl(
  url: string,
): { bucket: (typeof DELETABLE_BUCKETS)[number]; path: string } | null {
  const parsed = parsePublicMediaUrl(url);
  if (parsed && (DELETABLE_BUCKETS as readonly string[]).includes(parsed.bucket)) {
    return { bucket: parsed.bucket as (typeof DELETABLE_BUCKETS)[number], path: parsed.path };
  }

  // custom-uploads may still be Supabase-only public URLs
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const marker = '/storage/v1/object/public/custom-uploads/';
  const idx = u.pathname.indexOf(marker);
  if (idx === -1) return null;
  const path = decodeURIComponent(u.pathname.slice(idx + marker.length));
  if (!path || path.includes('..')) return null;
  return { bucket: 'custom-uploads', path };
}

if (process.env.NODE_ENV !== 'production') {
  const prev = process.env.NEXT_PUBLIC_CDN_URL;
  process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.purevedicgems.com';
  const ok = storageObjectFromPublicUrl(
    'https://cdn.purevedicgems.com/products/order-media/a/images/1.jpg',
  );
  console.assert(ok?.bucket === 'products' && ok.path === 'order-media/a/images/1.jpg');
  const ring = storageObjectFromPublicUrl(
    'https://xyz.supabase.co/storage/v1/object/public/custom-uploads/ring-size/o/1.jpg',
  );
  console.assert(ring?.bucket === 'custom-uploads' && ring.path === 'ring-size/o/1.jpg');
  process.env.NEXT_PUBLIC_CDN_URL = prev;
}
