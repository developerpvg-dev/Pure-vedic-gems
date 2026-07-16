/** Derived content-completeness flags for catalog products.
 *
 * Migrated gem/rudraksha PDP gallery is usually:
 *   images[0] = product photo
 *   images[1+] = often cert scan (hashed filenames — no role field)
 *   video_url  = dedicated YouTube (play thumb), not an images[] entry
 * Cert file columns are often null; lab/number were migrated from Woo meta.
 */

export type ProductCompletenessRow = {
  id: string;
  sku: string | null;
  tag_number: string | null;
  name: string;
  category: string | null;
  sub_category: string | null;
  is_active: boolean;
  images: unknown;
  short_desc: string | null;
  description: string | null;
  certificate_url: string | null;
  certificate_file_url: string | null;
  certificate_number: string | null;
  certificate_lab: string | null;
  certificate_status: string | null;
  video_url: string | null;
};

export type CompletenessFlags = {
  hasImages: boolean;
  hasDescription: boolean;
  hasCertificate: boolean;
  hasVideo: boolean;
  imageCount: number;
};

const GEM_GALLERY_CATEGORIES = new Set(['navaratna', 'upratna', 'gemstone', 'rudraksha']);

function plainText(value: string | null | undefined) {
  return (value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function mediaUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  const urls: string[] = [];
  for (const item of images) {
    if (typeof item === 'string' && item.trim()) urls.push(item.trim());
    else if (item && typeof item === 'object' && 'url' in item) {
      const url = (item as { url: unknown }).url;
      if (typeof url === 'string' && url.trim()) urls.push(url.trim());
    }
  }
  return urls;
}

function isVideoLikeUrl(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)/i.test(url);
}

function isCertLikeUrl(url: string) {
  // New uploads / rare legacy paths with readable names. Hashed migration URLs won't match.
  return /cert|lab[-_]?report|identification|igi|gia|gtl|gubelin|grs|gii|certificate/i.test(url);
}

export function productCompletenessFlags(row: ProductCompletenessRow): CompletenessFlags {
  const urls = mediaUrls(row.images);
  const photoUrls = urls.filter((u) => !isVideoLikeUrl(u));
  const hasCertUrl = Boolean(row.certificate_url?.trim() || row.certificate_file_url?.trim());
  const hasCertMeta = Boolean(
    row.certificate_number?.trim() ||
      row.certificate_lab?.trim() ||
      (row.certificate_status && row.certificate_status !== 'not_required'),
  );
  // ponytail: hashed gallery certs have no role; gem family with 2+ photos ≈ product + cert scan (false + if multi-angle only)
  const hasGalleryCert =
    photoUrls.some(isCertLikeUrl) ||
    (Boolean(row.category && GEM_GALLERY_CATEGORIES.has(row.category)) && photoUrls.length >= 2);

  return {
    hasImages: photoUrls.length > 0,
    hasDescription: Boolean(plainText(row.short_desc) || plainText(row.description)),
    hasCertificate: hasCertUrl || hasCertMeta || hasGalleryCert,
    hasVideo: Boolean(row.video_url?.trim()) || urls.some(isVideoLikeUrl),
    imageCount: photoUrls.length,
  };
}

export type CompletenessGap = 'images' | 'description' | 'certificate' | 'video' | 'any' | 'complete';

export function productHasGap(flags: CompletenessFlags, gap: CompletenessGap) {
  if (gap === 'complete') {
    return flags.hasImages && flags.hasDescription && flags.hasCertificate && flags.hasVideo;
  }
  if (gap === 'any') {
    return !(flags.hasImages && flags.hasDescription && flags.hasCertificate && flags.hasVideo);
  }
  if (gap === 'images') return !flags.hasImages;
  if (gap === 'description') return !flags.hasDescription;
  if (gap === 'certificate') return !flags.hasCertificate;
  return !flags.hasVideo;
}
