/**
 * Legacy HTML description → sanitised `clean_description`.
 *
 * Rules:
 *   - Keep raw HTML in `legacy_html_description` verbatim (no mutation).
 *   - Produce `clean_description` that is safe to render directly with
 *     `dangerouslySetInnerHTML`:
 *       * strip <script>, <style>, <iframe>, <object>, <embed>, <link>, <meta>
 *       * strip on* event attributes and style="" attributes
 *       * strip WordPress / WooCommerce shortcodes ([shortcode...])
 *       * unwrap empty <p> / <span> / <div>
 *       * normalise heading levels: collapse H1 → H2 inside body, keep H2/H3 as is
 *       * rewrite legacy image URLs to Supabase Storage URLs (done in
 *         06-upsert.ts using stg_media_url_map; here we only emit the
 *         placeholder URLs unchanged)
 *       * collapse triple+ <br> into a single paragraph break
 *   - Return a list of warnings: shortcodes seen, scripts stripped,
 *     image hosts seen that are not whitelisted.
 *
 * PR-3 implements. Until then, callers MUST NOT promote this output to
 * `public.products.clean_description`.
 */

export interface CleanDescriptionResult {
  cleanHtml: string;
  warnings: string[];
  shortcodesSeen: string[];
  externalImageHosts: string[];
}

const DROP_TAGS = ['script', 'style', 'object', 'embed', 'link', 'meta', 'noscript'];
const YOUTUBE_VIMEO_RE = /(?:youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com)/i;

/**
 * Extracts the first YouTube/Vimeo video URL referenced by an <iframe> in the HTML, if any.
 */
export function extractLegacyVideoUrl(html: string): string | null {
  if (!html) return null;
  const re = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (YOUTUBE_VIMEO_RE.test(src)) return src;
  }
  return null;
}

export function cleanLegacyDescription(html: string): CleanDescriptionResult {
  const warnings: string[] = [];
  const shortcodesSeen = new Set<string>();
  const externalImageHosts = new Set<string>();

  if (!html || html.trim() === '') {
    return { cleanHtml: '', warnings, shortcodesSeen: [], externalImageHosts: [] };
  }

  let out = html;

  // Preserve YouTube/Vimeo iframes; drop all other iframes (and other unsafe tags).
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (match) => {
    const srcMatch = match.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && YOUTUBE_VIMEO_RE.test(srcMatch[1])) return match;
    warnings.push('stripped <iframe>');
    return '';
  });
  out = out.replace(/<iframe\b[^>]*\/?>/gi, (match) => {
    const srcMatch = match.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && YOUTUBE_VIMEO_RE.test(srcMatch[1])) return match;
    warnings.push('stripped <iframe>');
    return '';
  });

  for (const tag of DROP_TAGS) {
    const before = out.length;
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, 'gi'), '');
    out = out.replace(new RegExp(`<${tag}\\b[^>]*/?>`, 'gi'), '');
    if (out.length !== before) warnings.push(`stripped <${tag}>`);
  }

  out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '');
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '');
  out = out.replace(/\s+style\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\s+style\s*=\s*'[^']*'/gi, '');

  out = out.replace(/\[([a-z0-9_-]+)(?:\s[^\]]*)?\][\s\S]*?\[\/\1\]/gi, (_m, name) => {
    shortcodesSeen.add(String(name).toLowerCase());
    return '';
  });
  out = out.replace(/\[([a-z0-9_-]+)(?:\s[^\]]*)?\]/gi, (_m, name) => {
    shortcodesSeen.add(String(name).toLowerCase());
    return '';
  });

  out.replace(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi, (_m, src: string) => {
    try {
      externalImageHosts.add(new URL(src).host);
    } catch { /* relative URL */ }
    return _m;
  });

  for (let i = 0; i < 2; i++) {
    out = out.replace(/<(p|span|div|strong|em)>\s*<\/\1>/gi, '');
  }
  out = out.replace(/(?:\s*<br\s*\/?>\s*){3,}/gi, '</p><p>');
  out = out.replace(/[ \t]{2,}/g, ' ');
  out = out.replace(/\n{3,}/g, '\n\n');

  return {
    cleanHtml: out.trim(),
    warnings,
    shortcodesSeen: [...shortcodesSeen],
    externalImageHosts: [...externalImageHosts],
  };
}
