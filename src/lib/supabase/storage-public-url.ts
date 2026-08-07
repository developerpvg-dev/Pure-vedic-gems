const DELETABLE_BUCKETS = ['products', 'custom-uploads'] as const;

/** Parse Supabase public object URL → { bucket, path } when it is ours. */
export function storageObjectFromPublicUrl(
  url: string,
): { bucket: (typeof DELETABLE_BUCKETS)[number]; path: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  for (const bucket of DELETABLE_BUCKETS) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) continue;
    const path = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    if (!path || path.includes('..')) return null;
    return { bucket, path };
  }
  return null;
}

if (process.env.NODE_ENV !== 'production') {
  const base = 'https://xyz.supabase.co/storage/v1/object/public';
  const ok = storageObjectFromPublicUrl(`${base}/products/order-media/a/images/1.jpg`);
  console.assert(ok?.bucket === 'products' && ok.path === 'order-media/a/images/1.jpg');
  const ring = storageObjectFromPublicUrl(`${base}/custom-uploads/ring-size/o/1.jpg`);
  console.assert(ring?.bucket === 'custom-uploads' && ring.path === 'ring-size/o/1.jpg');
  console.assert(storageObjectFromPublicUrl('https://cdn.example.com/x.jpg') === null);
  console.assert(storageObjectFromPublicUrl(`${base}/products/../secret`) === null);
}
