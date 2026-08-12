/** Offload allowlist for proxy redirects (kept in src so Edge can bundle it). */
export const SITE_STATIC_BUCKET = 'site-static';

export const SITE_STATIC_TOP_DIRS = [
  'legacy-geo',
  'rudraksha-knowledge',
  'pendant-designs',
  'gems-knowledge',
  'aboutus',
  'rudraksha-designs',
  'ring-designs',
  'bracelet-designs',
  'legacy',
  'testimonial',
  'astrology',
  'knowledge',
  'whychooseus',
  'treatments',
  'office',
  'our_expets_img',
  'config_img',
  'geo',
] as const;

export const SITE_STATIC_HOME_SUBDIRS = [
  'certificates',
  'configuratorsteps',
  'ctas',
  "director'spick",
  'gemrecomndation',
  'heri',
  'imgandicon',
  'navratnaimg',
  'ourservicesimg',
  'remediesrec',
  'rudrakhshas images',
  'rudraksha-cards',
  'testimonial',
  'upratna-cards',
  'VedicRemedies',
  'whoweare',
] as const;

const topDirs = new Set<string>(SITE_STATIC_TOP_DIRS);
const homeSubs = new Set<string>(SITE_STATIC_HOME_SUBDIRS);
const ASSET_EXT = /\.(?:webp|jpg|jpeg|png|gif|svg|avif|css)$/i;

function decodeSeg(seg: string) {
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

/** Brand / LCP assets kept in public/ — never redirect these. */
export function isKeepLocalAssetPath(pathname: string): boolean {
  const p = pathname.split('?')[0] ?? pathname;
  if (
    p === '/pvg-emblem.webp' ||
    p === '/pvg-logo.png' ||
    p === '/ringsizeguide.png' ||
    p === '/Algerian.webp' ||
    p === '/PVG NEW LOGO DESIGN.webp' ||
    p === '/PVG%20NEW%20LOGO%20DESIGN.webp'
  ) {
    return true;
  }
  return (
    p.startsWith('/home/hero/') ||
    p.startsWith('/email/') ||
    p.startsWith('/labslogo/') ||
    p.startsWith('/flags/') ||
    p.startsWith('/favicon') ||
    p === '/apple-icon.png' ||
    p === '/og-default.png' ||
    p === '/placeholder-gem.png'
  );
}

/** True when this site path was offloaded to Supabase Storage. */
export function isOffloadedSiteAssetPath(pathname: string): boolean {
  const p = pathname.split('?')[0] ?? pathname;
  if (!p.startsWith('/') || isKeepLocalAssetPath(p)) return false;
  // ponytail: never send HTML routes (/knowledge, /knowledge/gemstones) to Storage
  if (!ASSET_EXT.test(p)) return false;
  const rel = p.slice(1);
  const slash = rel.indexOf('/');
  const top = slash === -1 ? rel : rel.slice(0, slash);
  if (topDirs.has(top) || topDirs.has(decodeSeg(top))) return true;
  if ((top === 'home' || decodeSeg(top) === 'home') && slash !== -1) {
    const sub = rel.slice('home/'.length).split('/')[0] ?? '';
    return homeSubs.has(sub) || homeSubs.has(decodeSeg(sub));
  }
  return false;
}

/** Fully-encoded public Supabase URL for an offloaded site path, or null. */
export function siteStaticPublicUrl(pathname: string, supabaseUrl: string): string | null {
  const p = pathname.split('?')[0] ?? pathname;
  if (!isOffloadedSiteAssetPath(p)) return null;
  const base = supabaseUrl.replace(/\/$/, '');
  const encoded = p
    .replace(/^\//, '')
    .split('/')
    .map((seg) => encodeURIComponent(decodeSeg(seg)))
    .join('/');
  return `${base}/storage/v1/object/public/${SITE_STATIC_BUCKET}/${encoded}`;
}
