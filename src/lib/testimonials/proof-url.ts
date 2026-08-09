/** True when proof_image_url can be opened (Supabase/CDN). Local /legacy paths were removed from public/. */
export function isViewableProofUrl(url: string | null | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url.trim());
}
