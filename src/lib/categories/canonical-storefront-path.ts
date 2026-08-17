import { RUDRAKSHA_STOREFRONT_SLUGS } from '@/lib/constants/rudraksha-subcategories';

/** Keys must stay in sync with KNOWN_GEM_SUBCATEGORIES in shop.ts. */
export const NAVARATNA_STOREFRONT_SLUGS = new Set([
  'ruby',
  'pearl',
  'red-coral',
  'emerald',
  'yellow-sapphire',
  'diamond',
  'blue-sapphire',
  'hessonite',
  'cats-eye',
  'white-sapphire',
  'exclusive-gems',
  'pitambari',
]);

export const UPRATNA_STOREFRONT_SLUGS = new Set([
  'amethyst',
  'lapis-lazuli',
  'moonstone',
  'peridot',
  'rose-quartz',
  'citrine',
  'garnet',
  'turquoise',
  'aquamarine',
  'tiger-eye',
  'malachite',
  'opal',
  'tanzanite',
  'blue-topaz',
  'white-topaz',
  'zircon',
  'iolite',
  'tourmaline',
  'diopside',
  'kyanite',
  'sunstone',
  'hakik',
  'white-coral',
  'spinel',
  'chrysoberyl',
]);

export const RUDRAKSHA_STOREFRONT_SLUG_SET = new Set<string>(RUDRAKSHA_STOREFRONT_SLUGS);

const GROUP_ALIAS: Record<string, 'navaratna' | 'upratna' | 'rudraksha'> = {
  navaratna: 'navaratna',
  navratna: 'navaratna',
  navratan: 'navaratna',
  navratana: 'navaratna',
  navratnas: 'navaratna',
  upratna: 'upratna',
  upratan: 'upratna',
  uparatna: 'upratna',
  rudraksha: 'rudraksha',
  rudrakhas: 'rudraksha',
  rudrakshas: 'rudraksha',
};

/** Exact WP category slugs only — never substring-replace inside a product SKU. */
const STOREFRONT_SLUG_ALIAS: Record<string, string> = {
  catseye: 'cats-eye',
};

function resolveStorefrontSlug(slug: string) {
  return STOREFRONT_SLUG_ALIAS[slug] ?? slug;
}

export type MigratedStorefrontGroup = 'navaratna' | 'upratna' | 'rudraksha';

export function barePathname(pathname: string) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function parentForMigratedSlug(slug: string): MigratedStorefrontGroup | null {
  const resolved = resolveStorefrontSlug(slug);
  if (NAVARATNA_STOREFRONT_SLUGS.has(resolved)) return 'navaratna';
  if (UPRATNA_STOREFRONT_SLUGS.has(resolved)) return 'upratna';
  if (RUDRAKSHA_STOREFRONT_SLUG_SET.has(resolved)) return 'rudraksha';
  return null;
}

export function canonicalGroupHref(group: MigratedStorefrontGroup) {
  return group === 'rudraksha' ? '/rudraksha' : `/gemstones/${group}`;
}

export function canonicalSubcategoryHref(slug: string) {
  const resolved = resolveStorefrontSlug(slug);
  const parent = parentForMigratedSlug(resolved);
  return parent ? `${canonicalGroupHref(parent)}/${resolved}` : null;
}

function join(parts: string[]) {
  return `/${parts.filter(Boolean).join('/')}`.replace(/\/{2,}/g, '/');
}

function underGroup(group: MigratedStorefrontGroup, rest: string[]) {
  const base = canonicalGroupHref(group);
  if (!rest.length) return base;
  const child = resolveStorefrontSlug(rest[0]);
  return rest.length === 1 ? `${base}/${child}` : `${base}/${[child, ...rest.slice(1)].join('/')}`;
}

/**
 * Public canonical path for a storefront URL. Identity for /shop, jewelry, SEO landings, knowledge.
 * Product slug tails are preserved. Spelling aliases collapse to navaratna / upratna / rudraksha.
 */
export function toCanonicalStorefrontPath(pathname: string) {
  const bare = barePathname(pathname);
  const parts = bare.split('/').filter(Boolean);
  if (parts.length === 0) return '/';

  if (parts[0] === 'gemstones') {
    if (parts.length === 1) return '/gemstones/navaratna';
    const group = GROUP_ALIAS[parts[1]];
    if (group === 'navaratna' || group === 'upratna') {
      const rest = parts.slice(2);
      if (rest[0]) {
        const childParent = parentForMigratedSlug(rest[0]);
        if (childParent) return underGroup(childParent, rest);
      }
      return underGroup(group, rest);
    }
    const shortParent = parentForMigratedSlug(parts[1]);
    if (shortParent) return underGroup(shortParent, parts.slice(1));
    return join(parts);
  }

  if (GROUP_ALIAS[parts[0]] === 'rudraksha') {
    return underGroup('rudraksha', parts.slice(1));
  }

  if (parts[0] !== 'shop') return join(parts);

  if (parts.length === 1) return '/shop';

  const seg1 = parts[1];
  if (seg1 === 'gemstones') {
    return toCanonicalStorefrontPath(join(['gemstones', ...parts.slice(2)]));
  }

  const group = GROUP_ALIAS[seg1];
  if (group === 'navaratna' || group === 'upratna' || group === 'rudraksha') {
    const rest = parts.slice(2);
    if (rest.length === 0) return canonicalGroupHref(group);
    const childParent = parentForMigratedSlug(rest[0]) ?? group;
    return underGroup(childParent, rest);
  }

  const parent = parentForMigratedSlug(seg1);
  if (parent) return underGroup(parent, [resolveStorefrontSlug(seg1), ...parts.slice(2)]);

  return join(parts);
}

/**
 * Internal App Router path for a public facade URL, or null if the request is already internal.
 * Known stone/mukhi slugs flatten to /shop/{slug}; unknown children stay under the group.
 */
export function toInternalShopPath(pathname: string): string | null {
  const parts = barePathname(pathname).split('/').filter(Boolean);
  if (parts[0] === 'gemstones') {
    const group = GROUP_ALIAS[parts[1]];
    if (group !== 'navaratna' && group !== 'upratna') return null;
    if (parts.length === 2) return `/shop/${group}`;
    const child = resolveStorefrontSlug(parts[2]);
    const rest = parts.slice(3);
    if (parentForMigratedSlug(parts[2]) === group) {
      return rest.length ? join(['shop', child, ...rest]) : `/shop/${child}`;
    }
    return join(['shop', group, ...parts.slice(2)]);
  }

  if (parts[0] === 'rudraksha') {
    if (parts.length === 1) return '/shop/rudraksha';
    const child = parts[1];
    const rest = parts.slice(2);
    if (RUDRAKSHA_STOREFRONT_SLUG_SET.has(child)) {
      return rest.length ? join(['shop', child, ...rest]) : `/shop/${child}`;
    }
    return join(['shop', 'rudraksha', ...parts.slice(1)]);
  }

  return null;
}

/** True when this public path is served by rewriting onto /shop/... */
export function isStorefrontFacadePath(pathname: string) {
  return toInternalShopPath(pathname) != null;
}
