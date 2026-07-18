/** Build PDP gallery slides from dedicated media fields (not a mixed upload bag). */

function isVideoLikeUrl(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)|\.webm(\?|$)/i.test(url);
}

function isPdfUrl(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}

/** Certificate file URLs that can render as a gallery image slide. */
export function isGalleryCertificateUrl(url: string | null | undefined): boolean {
  const u = url?.trim();
  if (!u) return false;
  if (isVideoLikeUrl(u) || isPdfUrl(u)) return false;
  return true;
}

/** Product photos + optional cert scan (PDFs stay on the Certificate tab only). */
export function buildProductGalleryImages(
  images: string[],
  certificateUrl?: string | null,
): string[] {
  const out = images.filter((u) => typeof u === 'string' && u.trim() && !isVideoLikeUrl(u));
  const cert = certificateUrl?.trim();
  if (cert && isGalleryCertificateUrl(cert) && !out.includes(cert)) out.push(cert);
  return out;
}
