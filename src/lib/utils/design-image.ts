/** Jewelry design images are embedded Excel assets — serve originals without Next.js resizing. */

export function designImageSrc(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}
