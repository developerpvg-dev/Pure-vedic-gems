/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */

import Link from 'next/link';
import { createOptionalPublicClient } from '@/lib/supabase/public';

export type HomeManagedCategory = {
  id: string;
  name: string;
  slug: string;
  type: 'navaratna' | 'upratna' | 'rudraksha';
  sanskrit_name: string | null;
  planet: string | null;
  image_url: string | null;
  hover_image_url: string | null;
  description: string | null;
  display_locations: string | null;
  color: string | null;
  sort_order: number;
};

type CategoryBucket = {
  navaratna: HomeManagedCategory[];
  upratna: HomeManagedCategory[];
  rudraksha: HomeManagedCategory[];
};

export type HomeCatalogCategory = {
  id: string;
  name: string;
  slug: string;
  family: 'idol' | 'jewelry' | 'mala' | 'rudraksha';
  image_url: string | null;
  hover_image_url: string | null;
  homepage_subtitle: string | null;
  homepage_badge: string | null;
  cta_label: string | null;
  canonical_path: string | null;
  accent_color: string | null;
  homepage_slot: string | null;
  sort_order: number;
};

export type HomeDirectorPick = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  sub_category: string | null;
  price: number;
  carat_weight: number | null;
  origin: string | null;
  shape: string | null;
  treatment: string | null;
  certification: string | null;
  certificate_lab: string | null;
  quality_label: string | null;
  thumbnail_url: string | null;
  images: string[];
  display_order: number;
};

export type HomeSectionCatalog = {
  rudrakshaFeatures: HomeCatalogCategory[];
  exploreIdols: HomeCatalogCategory[];
  exploreJewelry: HomeCatalogCategory[];
  directorPicks: HomeDirectorPick[];
};

type UntypedDb = { from: (table: string) => any };

const CATEGORY_COLUMNS_WITH_LOCATIONS = 'id, name, slug, type, sanskrit_name, planet, image_url, hover_image_url, description, display_locations, color, sort_order';
const CATEGORY_COLUMNS_BASE = 'id, name, slug, type, sanskrit_name, planet, image_url, hover_image_url, description, color, sort_order';

const DEPRECATED_HOME_IMAGE_PREFIXES = [
  '/home/navratnaimg/',
  '/home/upratnas images/',
  '/home/upratnas%20images/',
  '/home/rudrakhshas images/',
  '/home/rudrakhshas%20images/',
];

const NAVARATNA_FALLBACK: HomeManagedCategory[] = [
  { id: 'ruby', name: 'Ruby', slug: 'ruby', type: 'navaratna', sanskrit_name: 'Manik', planet: 'Sun', image_url: null, hover_image_url: null, description: null, display_locations: 'Burma · Mozambique', color: '#DC2626', sort_order: 1 },
  { id: 'pearl', name: 'Pearl', slug: 'pearl', type: 'navaratna', sanskrit_name: 'Moti', planet: 'Moon', image_url: null, hover_image_url: null, description: null, display_locations: 'Basra · Gulf of Mannar', color: '#F5F5F4', sort_order: 2 },
  { id: 'red-coral', name: 'Red Coral', slug: 'red-coral', type: 'navaratna', sanskrit_name: 'Moonga', planet: 'Mars', image_url: null, hover_image_url: null, description: null, display_locations: 'Italy · Japan', color: '#EA580C', sort_order: 3 },
  { id: 'emerald', name: 'Emerald', slug: 'emerald', type: 'navaratna', sanskrit_name: 'Panna', planet: 'Mercury', image_url: null, hover_image_url: null, description: null, display_locations: 'Zambia · Colombia', color: '#16A34A', sort_order: 4 },
  { id: 'yellow-sapphire', name: 'Yellow Sapphire', slug: 'yellow-sapphire', type: 'navaratna', sanskrit_name: 'Pukhraj', planet: 'Jupiter', image_url: null, hover_image_url: null, description: null, display_locations: 'Sri Lanka · Thailand', color: '#CA8A04', sort_order: 5 },
  { id: 'diamond', name: 'Diamond', slug: 'diamond', type: 'navaratna', sanskrit_name: 'Heera', planet: 'Venus', image_url: null, hover_image_url: null, description: null, display_locations: 'South Africa · India', color: '#A8A29E', sort_order: 6 },
  { id: 'blue-sapphire', name: 'Blue Sapphire', slug: 'blue-sapphire', type: 'navaratna', sanskrit_name: 'Neelam', planet: 'Saturn', image_url: null, hover_image_url: null, description: null, display_locations: 'Sri Lanka · Burma · Kashmir', color: '#2563EB', sort_order: 7 },
  { id: 'hessonite', name: 'Hessonite', slug: 'hessonite', type: 'navaratna', sanskrit_name: 'Gomed', planet: 'Rahu', image_url: null, hover_image_url: null, description: null, display_locations: 'Sri Lanka · Africa', color: '#92400E', sort_order: 8 },
  { id: 'cats-eye', name: "Cat's Eye", slug: 'cats-eye', type: 'navaratna', sanskrit_name: 'Lehsuniya', planet: 'Ketu', image_url: null, hover_image_url: null, description: null, display_locations: 'Sri Lanka · Brazil', color: '#65A30D', sort_order: 9 },
];

const UPRATNA_FALLBACK: HomeManagedCategory[] = [
  { id: 'amethyst', name: 'Amethyst', slug: 'amethyst', type: 'upratna', sanskrit_name: null, planet: 'Saturn', image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#9333EA', sort_order: 1 },
  { id: 'lapis-lazuli', name: 'Lapis Lazuli', slug: 'lapis-lazuli', type: 'upratna', sanskrit_name: null, planet: 'Saturn', image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#1E40AF', sort_order: 2 },
  { id: 'moonstone', name: 'Moonstone', slug: 'moonstone', type: 'upratna', sanskrit_name: null, planet: 'Moon', image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#E0E7FF', sort_order: 3 },
  { id: 'peridot', name: 'Peridot', slug: 'peridot', type: 'upratna', sanskrit_name: null, planet: 'Mercury', image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#65A30D', sort_order: 4 },
  { id: 'rose-quartz', name: 'Rose Quartz', slug: 'rose-quartz', type: 'upratna', sanskrit_name: null, planet: 'Venus', image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#F0A0C0', sort_order: 5 },
  { id: 'citrine', name: 'Citrine', slug: 'citrine', type: 'upratna', sanskrit_name: null, planet: 'Jupiter', image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#F59E0B', sort_order: 6 },
  { id: 'garnet', name: 'Garnet', slug: 'garnet', type: 'upratna', sanskrit_name: null, planet: 'Rahu', image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#B91C1C', sort_order: 7 },
  { id: 'turquoise', name: 'Turquoise', slug: 'turquoise', type: 'upratna', sanskrit_name: null, planet: 'Jupiter', image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#06B6D4', sort_order: 8 },
  { id: 'tiger-eye', name: "Tiger's Eye", slug: 'tiger-eye', type: 'upratna', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#C09840', sort_order: 9 },
  { id: 'malachite', name: 'Malachite', slug: 'malachite', type: 'upratna', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: null, color: '#48C07A', sort_order: 10 },
];

const RUDRAKSHA_FALLBACK: HomeManagedCategory[] = [
  { id: '15-mukhi', name: '15 Mukhi', slug: '15-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Rare', color: null, sort_order: 1 },
  { id: '16-mukhi', name: '16 Mukhi', slug: '16-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Rare', color: null, sort_order: 2 },
  { id: '17-mukhi', name: '17 Mukhi', slug: '17-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Rare', color: null, sort_order: 3 },
  { id: '18-mukhi', name: '18 Mukhi', slug: '18-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Rare', color: null, sort_order: 4 },
  { id: '19-mukhi', name: '19 Mukhi', slug: '19-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Rare', color: null, sort_order: 5 },
  { id: '21-mukhi', name: '21 Mukhi', slug: '21-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Rare', color: null, sort_order: 6 },
  { id: '1-mukhi', name: '1 Mukhi', slug: '1-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Classic', color: null, sort_order: 7 },
  { id: '2-mukhi', name: '2 Mukhi', slug: '2-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Classic', color: null, sort_order: 8 },
  { id: '3-mukhi', name: '3 Mukhi', slug: '3-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Classic', color: null, sort_order: 9 },
  { id: '4-mukhi', name: '4 Mukhi', slug: '4-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Classic', color: null, sort_order: 10 },
  { id: '5-mukhi', name: '5 Mukhi', slug: '5-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Classic', color: null, sort_order: 11 },
  { id: '6-mukhi', name: '6 Mukhi', slug: '6-mukhi', type: 'rudraksha', sanskrit_name: null, planet: null, image_url: null, hover_image_url: null, description: null, display_locations: 'Classic', color: null, sort_order: 12 },
];

const RUDRAKSHA_FEATURE_FALLBACK: HomeCatalogCategory[] = [
  { id: 'rudraksha-mukhi-collection', name: '1-15 Finest Quality Rudrakshas', slug: 'rudraksha-mukhi-collection', family: 'rudraksha', image_url: null, hover_image_url: null, homepage_subtitle: 'Complete Mukhi range', homepage_badge: 'Featured', cta_label: 'Shop All', canonical_path: '/shop/rudraksha', accent_color: null, homepage_slot: 'rudraksha_feature', sort_order: 1 },
  { id: 'exclusive-rudraksha-malas', name: 'Exclusive Rudraksha Malas', slug: 'exclusive-rudraksha-malas', family: 'rudraksha', image_url: null, hover_image_url: null, homepage_subtitle: 'Energized malas', homepage_badge: 'Featured', cta_label: 'Shop Malas', canonical_path: '/shop/exclusive-rudraksha-malas', accent_color: null, homepage_slot: 'rudraksha_feature', sort_order: 2 },
  { id: 'rudraksha-jewelry', name: 'Customised Rudraksha Jewelleries', slug: 'rudraksha-jewelry', family: 'jewelry', image_url: null, hover_image_url: null, homepage_subtitle: 'Custom settings', homepage_badge: 'Featured', cta_label: 'Shop Jewellery', canonical_path: '/shop/rudraksha-jewelry', accent_color: null, homepage_slot: 'rudraksha_feature', sort_order: 3 },
];

const EXPLORE_IDOL_FALLBACK: HomeCatalogCategory[] = [
  { id: 'ganesha', name: 'Ganesh Idol', slug: 'ganesha', family: 'idol', image_url: null, hover_image_url: null, homepage_subtitle: 'Brass · Hand-crafted', homepage_badge: null, cta_label: 'View Category', canonical_path: '/shop/ganesha', accent_color: '#D4AC2C', homepage_slot: 'explore_idol', sort_order: 1 },
  { id: 'shivling', name: 'Shiva Linga', slug: 'shivling', family: 'idol', image_url: null, hover_image_url: null, homepage_subtitle: 'Crystal · Natural', homepage_badge: null, cta_label: 'View Category', canonical_path: '/shop/shivling', accent_color: '#909898', homepage_slot: 'explore_idol', sort_order: 2 },
  { id: 'lakshmi', name: 'Lakshmi Idol', slug: 'lakshmi', family: 'idol', image_url: null, hover_image_url: null, homepage_subtitle: 'Gold Plated · Panchdhatu', homepage_badge: null, cta_label: 'View Category', canonical_path: '/shop/lakshmi', accent_color: '#B8861E', homepage_slot: 'explore_idol', sort_order: 3 },
  { id: 'hanuman', name: 'Hanuman Idol', slug: 'hanuman', family: 'idol', image_url: null, hover_image_url: null, homepage_subtitle: 'Brass · Energized', homepage_badge: null, cta_label: 'View Category', canonical_path: '/shop/hanuman', accent_color: '#E06020', homepage_slot: 'explore_idol', sort_order: 4 },
];

const EXPLORE_JEWELRY_FALLBACK: HomeCatalogCategory[] = [
  { id: 'ring', name: 'Gold Ring Setting', slug: 'ring', family: 'jewelry', image_url: null, hover_image_url: null, homepage_subtitle: '22K Gold · Gem-ready', homepage_badge: null, cta_label: 'View Category', canonical_path: '/shop/ring', accent_color: '#C08C1A', homepage_slot: 'explore_jewelry', sort_order: 1 },
  { id: 'pendant', name: 'Silver Pendant', slug: 'pendant', family: 'jewelry', image_url: null, hover_image_url: null, homepage_subtitle: '925 Silver · Hallmarked', homepage_badge: null, cta_label: 'View Category', canonical_path: '/shop/pendant', accent_color: '#909898', homepage_slot: 'explore_jewelry', sort_order: 2 },
  { id: 'bracelets', name: 'Gold Bracelet', slug: 'bracelets', family: 'jewelry', image_url: null, hover_image_url: null, homepage_subtitle: '18K Gold · Adjustable', homepage_badge: 'SALE!', cta_label: 'View Category', canonical_path: '/shop/bracelets', accent_color: '#9B6E10', homepage_slot: 'explore_jewelry', sort_order: 3 },
  { id: 'malas', name: 'Rudraksha Mala', slug: 'malas', family: 'mala', image_url: null, hover_image_url: null, homepage_subtitle: '108 Beads · Energized', homepage_badge: null, cta_label: 'View Category', canonical_path: '/shop/malas', accent_color: '#8B5E3C', homepage_slot: 'explore_jewelry', sort_order: 4 },
];

const DIRECTOR_PICK_FALLBACK: HomeDirectorPick[] = [
  { id: 'ruby', name: 'Burma Ruby - Manik', slug: 'burma-ruby-manik', category: 'navaratna', sub_category: 'ruby', price: 214200, carat_weight: 3.02, origin: 'Burma', shape: 'Oval Cut', treatment: 'No Heat', certification: 'GIA Cert.', certificate_lab: 'GIA', quality_label: 'Eye Clean', thumbnail_url: null, images: [], display_order: 1 },
  { id: 'blue-sapphire', name: 'Kashmir Blue Sapphire - Neelam', slug: 'kashmir-blue-sapphire-neelam', category: 'navaratna', sub_category: 'blue-sapphire', price: 948000, carat_weight: 4.74, origin: 'Kashmir', shape: 'Cushion', treatment: 'No Heat', certification: 'GRS Cert.', certificate_lab: 'GRS', quality_label: null, thumbnail_url: null, images: [], display_order: 2 },
  { id: 'emerald', name: 'Colombian Emerald - Panna', slug: 'colombian-emerald-panna', category: 'navaratna', sub_category: 'emerald', price: 572800, carat_weight: 3.58, origin: 'Colombia', shape: 'Oval Cut', treatment: 'Minor Oil Only', certification: 'Gubelin', certificate_lab: 'Gubelin', quality_label: null, thumbnail_url: null, images: [], display_order: 3 },
  { id: 'yellow-sapphire', name: 'Ceylon Yellow Sapphire - Pukhraj', slug: 'ceylon-yellow-sapphire-pukhraj', category: 'navaratna', sub_category: 'yellow-sapphire', price: 358400, carat_weight: 5.12, origin: 'Ceylon', shape: 'Oval Cut', treatment: 'No Heat', certification: 'IGI Cert.', certificate_lab: 'IGI', quality_label: null, thumbnail_url: null, images: [], display_order: 4 },
  { id: 'diamond', name: 'Natural Diamond - Heera', slug: 'natural-diamond-heera', category: 'navaratna', sub_category: 'diamond', price: 486000, carat_weight: 1.21, origin: 'South Africa', shape: 'Round Brilliant', treatment: 'Natural', certification: 'IGI Cert.', certificate_lab: 'IGI', quality_label: 'VVS', thumbnail_url: null, images: [], display_order: 5 },
];

const FALLBACK_BUCKETS: CategoryBucket = {
  navaratna: NAVARATNA_FALLBACK,
  upratna: UPRATNA_FALLBACK,
  rudraksha: RUDRAKSHA_FALLBACK,
};

function normalizeCategory(row: Record<string, unknown>): HomeManagedCategory | null {
  const rawType = String(row.type ?? '');
  if (rawType !== 'navaratna' && rawType !== 'upratna' && rawType !== 'rudraksha') return null;

  return {
    id: String(row.id ?? row.slug ?? row.name),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    type: rawType,
    sanskrit_name: row.sanskrit_name ? String(row.sanskrit_name) : null,
    planet: row.planet ? String(row.planet) : null,
    image_url: normalizeManagedImageUrl(row.image_url),
    hover_image_url: normalizeManagedImageUrl(row.hover_image_url),
    description: row.description ? String(row.description) : null,
    display_locations: row.display_locations ? String(row.display_locations) : null,
    color: row.color ? String(row.color) : null,
    sort_order: Number(row.sort_order ?? 0),
  };
}

function normalizeManagedImageUrl(value: unknown) {
  if (!value) return null;
  const url = String(value).trim();
  if (!url) return null;
  const comparableUrl = safeDecodeForComparison(url);
  const isDeprecatedHomeAsset = DEPRECATED_HOME_IMAGE_PREFIXES.some((prefix) => {
    const normalizedPrefix = safeDecodeForComparison(prefix);
    return comparableUrl.startsWith(normalizedPrefix);
  });
  return isDeprecatedHomeAsset ? null : url;
}

function safeDecodeForComparison(value: string) {
  try {
    return decodeURIComponent(value).toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

function mergeWithFallback(items: HomeManagedCategory[], fallback: HomeManagedCategory[]) {
  if (!items.length) return fallback;

  const fallbackBySlug = new Map(fallback.map((item) => [item.slug, item]));
  return items.map((item) => {
    const fallbackItem = fallbackBySlug.get(item.slug);
    return {
      ...item,
      sanskrit_name: item.sanskrit_name ?? fallbackItem?.sanskrit_name ?? null,
      image_url: item.image_url ?? null,
      display_locations: item.display_locations ?? fallbackItem?.display_locations ?? item.description ?? null,
      color: item.color ?? fallbackItem?.color ?? null,
    };
  });
}

export async function getHomeManagedCategories(): Promise<CategoryBucket> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return FALLBACK_BUCKETS;
  const client = supabase;

  async function runQuery(columns: string) {
    return client
      .from('gem_categories')
      .select(columns)
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('sort_order', { ascending: true });
  }

  let { data, error } = await runQuery(CATEGORY_COLUMNS_WITH_LOCATIONS);

  if (error && 'code' in error && error.code === 'PGRST204') {
    const retry = await runQuery(CATEGORY_COLUMNS_BASE);
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) return FALLBACK_BUCKETS;

  const grouped: CategoryBucket = { navaratna: [], upratna: [], rudraksha: [] };
  for (const row of data as unknown as Record<string, unknown>[]) {
    const category = normalizeCategory(row);
    if (category) grouped[category.type].push(category);
  }

  return {
    navaratna: mergeWithFallback(grouped.navaratna, NAVARATNA_FALLBACK),
    upratna: mergeWithFallback(grouped.upratna, UPRATNA_FALLBACK),
    rudraksha: mergeWithFallback(grouped.rudraksha, RUDRAKSHA_FALLBACK),
  };
}

function normalizeCatalogCategory(row: Record<string, unknown>): HomeCatalogCategory | null {
  const family = String(row.family ?? '');
  if (family !== 'idol' && family !== 'jewelry' && family !== 'mala' && family !== 'rudraksha') return null;

  return {
    id: String(row.id ?? row.slug ?? row.name),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    family,
    image_url: normalizeManagedImageUrl(row.image_url),
    hover_image_url: normalizeManagedImageUrl(row.hover_image_url),
    homepage_subtitle: row.homepage_subtitle ? String(row.homepage_subtitle) : row.description ? String(row.description) : null,
    homepage_badge: row.homepage_badge ? String(row.homepage_badge) : null,
    cta_label: row.cta_label ? String(row.cta_label) : null,
    canonical_path: row.canonical_path ? String(row.canonical_path) : null,
    accent_color: row.accent_color ? String(row.accent_color) : null,
    homepage_slot: row.homepage_slot ? String(row.homepage_slot) : null,
    sort_order: Number(row.sort_order ?? 0),
  };
}

function normalizeDirectorPick(row: Record<string, unknown>): HomeDirectorPick {
  const images = Array.isArray(row.images) ? row.images.filter((url): url is string => typeof url === 'string') : [];
  return {
    id: String(row.id ?? row.slug ?? row.name),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    category: row.category ? String(row.category) : null,
    sub_category: row.sub_category ? String(row.sub_category) : null,
    price: Number(row.price ?? 0),
    carat_weight: row.carat_weight === null || row.carat_weight === undefined ? null : Number(row.carat_weight),
    origin: row.origin ? String(row.origin) : null,
    shape: row.shape ? String(row.shape) : null,
    treatment: row.treatment ? String(row.treatment) : null,
    certification: row.certification ? String(row.certification) : null,
    certificate_lab: row.certificate_lab ? String(row.certificate_lab) : null,
    quality_label: row.quality_label ? String(row.quality_label) : null,
    thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
    images,
    display_order: Number(row.display_order ?? 0),
  };
}

function ensureDirectorPickCount(items: HomeDirectorPick[]) {
  if (!items.length) return DIRECTOR_PICK_FALLBACK;

  const seen = new Set(items.map((item) => item.slug || item.id));
  const merged = [...items];
  for (const fallback of DIRECTOR_PICK_FALLBACK) {
    if (merged.length >= 5) break;
    if (seen.has(fallback.slug || fallback.id)) continue;
    merged.push(fallback);
    seen.add(fallback.slug || fallback.id);
  }
  return merged;
}

export async function getHomeSectionCatalog(): Promise<HomeSectionCatalog> {
  const supabase = createOptionalPublicClient();
  if (!supabase) {
    return {
      rudrakshaFeatures: RUDRAKSHA_FEATURE_FALLBACK,
      exploreIdols: EXPLORE_IDOL_FALLBACK,
      exploreJewelry: EXPLORE_JEWELRY_FALLBACK,
      directorPicks: DIRECTOR_PICK_FALLBACK,
    };
  }

  const db = supabase as unknown as UntypedDb;

  const catalogColumns = 'id, slug, name, family, description, image_url, hover_image_url, homepage_subtitle, homepage_badge, show_on_homepage, homepage_slot, cta_label, accent_color, canonical_path, sort_order, is_active';
  const productColumns = 'id, name, slug, category, sub_category, price, carat_weight, origin, shape, treatment, certification, certificate_lab, quality_label, thumbnail_url, images, display_order';

  const [catalogResult, picksResult] = await Promise.all([
    db
      .from('product_categories')
      .select(catalogColumns)
      .eq('is_active', true)
      .eq('show_on_homepage', true)
      .order('sort_order', { ascending: true }),
    db
      .from('products')
      .select(productColumns)
      .eq('is_active', true)
      .eq('is_directors_pick', true)
      .order('display_order', { ascending: true })
      .limit(6),
  ]);

  const categories = catalogResult.error ? [] : ((catalogResult.data ?? []) as Record<string, unknown>[])
    .map(normalizeCatalogCategory)
    .filter((item): item is HomeCatalogCategory => Boolean(item));

  const rudrakshaFeatures = categories.filter((category) => category.homepage_slot === 'rudraksha_feature');
  const exploreIdols = categories.filter((category) => category.homepage_slot === 'explore_idol' || category.family === 'idol');
  const exploreJewelry = categories.filter((category) => category.homepage_slot === 'explore_jewelry' || category.family === 'jewelry' || category.family === 'mala');
  const directorPicks = picksResult.error ? [] : ((picksResult.data ?? []) as Record<string, unknown>[]).map(normalizeDirectorPick);

  return {
    rudrakshaFeatures: rudrakshaFeatures.length ? rudrakshaFeatures : RUDRAKSHA_FEATURE_FALLBACK,
    exploreIdols: exploreIdols.length ? exploreIdols : EXPLORE_IDOL_FALLBACK,
    exploreJewelry: exploreJewelry.length ? exploreJewelry : EXPLORE_JEWELRY_FALLBACK,
    directorPicks: ensureDirectorPickCount(directorPicks),
  };
}

function categoryLabel(category: HomeManagedCategory) {
  return category.sanskrit_name ? `${category.name} (${category.sanskrit_name})` : category.name;
}

function locationLabel(category: HomeManagedCategory) {
  return category.display_locations ?? category.description ?? category.planet ?? '';
}

function fallbackGemBackground(category: HomeManagedCategory) {
  const color = category.color ?? '#B8861E';
  return `radial-gradient(circle at 35% 30%, ${color}, #6B4800 55%, #2A1800 100%)`;
}

function layeredImage(mainUrl: string | null, hoverUrl: string | null, alt: string, fallbackBackground: string, className = '') {
  const mainClassName = ['pvg-main-img', className].filter(Boolean).join(' ');
  const hoverClassName = ['pvg-hover-img', className].filter(Boolean).join(' ');
  return (
    <>
      {mainUrl ? <img className={mainClassName} src={mainUrl} alt={alt} loading="lazy" /> : <span className={mainClassName} role="img" aria-label={alt} style={{ background: fallbackBackground }} />}
      {hoverUrl ? <img className={hoverClassName} src={hoverUrl} alt="" aria-hidden="true" loading="lazy" /> : null}
    </>
  );
}

function categoryHref(category: { canonical_path?: string | null; slug: string }) {
  return category.canonical_path || `/shop/${category.slug}`;
}

function navaratnaLocationLabel() {
  return 'Sri Lankan / Burma / Kashmir';
}

const RUDRAKSHA_IMAGE_BY_SLUG: Record<string, string> = {
  '1-mukhi': '/home/rudrakhshas%20images/1Mukhi-150x150.webp',
  '2-mukhi': '/home/rudrakhshas%20images/2Mukhi-150x150.webp',
  '3-mukhi': '/home/rudrakhshas%20images/3Mukhi-150x150.webp',
  '4-mukhi': '/home/rudrakhshas%20images/4Mukhi-150x150.webp',
  '5-mukhi': '/home/rudrakhshas%20images/5Mukhi-150x150.webp',
  '6-mukhi': '/home/rudrakhshas%20images/6Mukhi-150x150.webp',
  '7-mukhi': '/home/rudrakhshas%20images/7Mukhi-150x150.webp',
  '8-mukhi': '/home/rudrakhshas%20images/8Mukhi-150x150.webp',
  '9-mukhi': '/home/rudrakhshas%20images/9Mukhi-150x150.webp',
  '10-mukhi': '/home/rudrakhshas%20images/10Mukhi-150x150.webp',
  '11-mukhi': '/home/rudrakhshas%20images/11Mukhi-150x150.webp',
  '12-mukhi': '/home/rudrakhshas%20images/12Mukhi-150x150.webp',
  '13-mukhi': '/home/rudrakhshas%20images/13Mukhi-150x150.webp',
  '14-mukhi': '/home/rudrakhshas%20images/14Mukhi-150x150.webp',
  '15-mukhi': '/home/rudrakhshas%20images/15mukhirudraksha.webp',
  '16-mukhi': '/home/rudrakhshas%20images/16Mukhi%20rudraksha.webp',
  '17-mukhi': '/home/rudrakhshas%20images/17Mukhi%20rudraksha.webp',
  '18-mukhi': '/home/rudrakhshas%20images/18Mukhi%20rudraksha.webp',
  '19-mukhi': '/home/rudrakhshas%20images/19Mukhi%20rudraksha.webp',
  '20-mukhi': '/home/rudrakhshas%20images/20Mukhi%20rudraksha.webp',
  '21-mukhi': '/home/rudrakhshas%20images/21Mukhi%20Rudraksha.webp',
};

function rudrakshaImageForSlug(slug: string) {
  return RUDRAKSHA_IMAGE_BY_SLUG[slug] ?? null;
}

function rudrakshaFeatureImage(card: HomeCatalogCategory) {
  if (card.slug.includes('mukhi')) return '/home/rudrakhshas%20images/1-15%20FINEST%20QUALITY%20RUDRAKSHAS.webp';
  if (card.slug.includes('mala')) return '/home/rudrakhshas%20images/EXCLUSIVE%20RUDRAKSHA%20MALAS.webp';
  if (card.slug.includes('jewelry') || card.slug.includes('jeweller')) return '/home/rudrakhshas%20images/CUSTOMISED%20RUDRAKSHA%20JEWELLERIES.webp';
  return '/home/rudrakhshas%20images/CUSTOMISED%20RUDRAKSHA%20JEWELLERIES.webp';
}

function SliderButton({ target, direction, label }: { target: string; direction: 'prev' | 'next'; label: string }) {
  return (
    <button type="button" className={`pvg-slider-btn pvg-slider-btn-${direction}`} data-slider-target={target} data-slider-direction={direction} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} /></svg>
    </button>
  );
}

function IntegratedCategoryCta({
  variant,
  title,
  copy,
  primary,
  secondary,
  image,
  imageAlt,
  imageSide = 'left',
}: {
  variant: 'navaratna' | 'rudraksha' | 'uparatna';
  title: string;
  copy: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  image: string;
  imageAlt: string;
  imageSide?: 'left' | 'right';
}) {
  return (
    <section
      className={`pvg-rcta-v2 pvg-rcta-v2-${variant}${imageSide === 'right' ? ' pvg-rcta-v2-reverse' : ''}`}
      aria-label={title}
    >
      <div className="pvg-rcta-v2-circle" aria-hidden="true" />

      <div className="pvg-rcta-v2-layout">
        <div className="pvg-rcta-v2-person-col" aria-hidden="true">
          <div className="pvg-rcta-v2-person-wrap">
            <img
              className="pvg-rcta-v2-person-img"
              src={image}
              alt={imageAlt}
              loading="lazy"
            />
          </div>
        </div>

        <div className="pvg-rcta-v2-card">
          <div className="pvg-rcta-v2-top">
            <h2 className="pvg-rcta-v2-heading">{title}</h2>
          </div>

          <div className="pvg-rcta-v2-bottom">
            <p className="pvg-rcta-v2-copy">{copy}</p>

            <div className="pvg-rcta-v2-btns">
              <Link href={primary.href} className="pvg-rcta-v2-btn-chat">{primary.label}</Link>
              <Link href={secondary.href} className="pvg-rcta-v2-btn-call">{secondary.label}</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="pvg-rcta-v2-mobile-actions">
        <Link href={primary.href} className="pvg-rcta-v2-btn-mobile pvg-rcta-v2-btn-mobile-primary">{primary.label}</Link>
        <Link href={secondary.href} className="pvg-rcta-v2-btn-mobile pvg-rcta-v2-btn-mobile-secondary">{secondary.label}</Link>
      </div>
    </section>
  );
}

function exploreFallbackBackground(category: HomeCatalogCategory) {
  const color = category.accent_color ?? (category.family === 'idol' ? '#B8861E' : '#8B5E3C');
  return `radial-gradient(circle at 35% 30%, ${color}, #6A4400 55%, #2A1800 100%)`;
}

function formatPriceValue(price: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price || 0);
}

function directorMeta(product: HomeDirectorPick) {
  return [
    product.carat_weight ? `${product.carat_weight} ct` : null,
    product.shape,
    product.quality_label,
    product.treatment,
  ].filter(Boolean).join(' · ');
}

function directorFallbackImage(product: HomeDirectorPick) {
  const comparable = `${product.slug} ${product.name} ${product.sub_category ?? ''}`.toLowerCase();
  if (comparable.includes('ruby') || comparable.includes('manik')) return '/home/navratnaimg/stone1.webp';
  if (comparable.includes('pearl') || comparable.includes('moti')) return '/home/navratnaimg/stone2.webp';
  if (comparable.includes('blue-sapphire') || comparable.includes('blue sapphire') || comparable.includes('neelam')) return '/home/navratnaimg/stone3.webp';
  if (comparable.includes('emerald') || comparable.includes('panna')) return '/home/navratnaimg/stone4.webp';
  if (comparable.includes('yellow-sapphire') || comparable.includes('yellow sapphire') || comparable.includes('pukhraj')) return '/home/navratnaimg/stone5.webp';
  if (comparable.includes('diamond') || comparable.includes('heera')) return '/home/navratnaimg/stone6.webp';
  if (comparable.includes('coral') || comparable.includes('moonga')) return '/home/navratnaimg/stone7.webp';
  if (comparable.includes('hessonite') || comparable.includes('gomed')) return '/home/navratnaimg/stone8.webp';
  if (comparable.includes('eye') || comparable.includes('lehsun')) return '/home/navratnaimg/stone9.webp';
  return '/home/navratnaimg/stone1.webp';
}

function directorNote(product: HomeDirectorPick) {
  const comparable = `${product.slug} ${product.name} ${product.sub_category ?? ''}`.toLowerCase();
  if (comparable.includes('ruby') || comparable.includes('manik')) return 'Excellent clarity & color. Ideal for confidence & leadership.';
  if (comparable.includes('blue-sapphire') || comparable.includes('blue sapphire') || comparable.includes('neelam')) return 'Finest quality with exceptional clarity and brilliance.';
  if (comparable.includes('emerald') || comparable.includes('panna')) return 'Vivid green with natural charm. Enhances wisdom & prosperity.';
  if (comparable.includes('yellow-sapphire') || comparable.includes('yellow sapphire') || comparable.includes('pukhraj')) return 'Bright golden hue. Brings prosperity, health & happiness.';
  if (comparable.includes('coral') || comparable.includes('moonga')) return 'Strong natural vitality. Supports courage & decisive action.';
  if (comparable.includes('pearl') || comparable.includes('moti')) return 'Soft natural lustre. Encourages calm, purity & balance.';
  return 'Personally selected for quality, beauty and Jyotish suitability.';
}

export function NavaratnaHomeSection({ categories }: { categories: HomeManagedCategory[] }) {
  const rows = [categories.slice(0, 5), categories.slice(5, 9)].filter((row) => row.length > 0);

  return (
    <>
      <section className="navratna-section" id="navratna" aria-labelledby="navratna-heading">
        <div className="navratna-bg-text" aria-hidden="true">नवरत्न</div>
        <div className="container">
          <div className="section-head">
            <h2 className="section-title" id="navratna-heading">Navaratna Gemstones</h2>
            <p className="navratna-subtitle">The Nine Sacred Planetary Gemstones</p>
            <div className="section-rule-center" />
          </div>

          {rows.map((row) => (
            <div key={row.map((category) => category.slug).join('-')} className={`gem-row gem-row-${row.length}`}>
              {row.map((category) => (
                <Link key={category.slug} href={`/shop/${category.slug}`} className="gem-card-new">
                  <div className="gem-img-wrap">
                    {layeredImage(category.image_url, category.hover_image_url, category.name, fallbackGemBackground(category))}
                  </div>
                  <div className="gem-name-primary">{categoryLabel(category)}</div>
                  <div className="gem-origin">{navaratnaLocationLabel()}</div>
                </Link>
              ))}
            </div>
          ))}

          <div className="navratna-tablet-grid" aria-label="Navaratna gemstone categories">
            {categories.slice(0, 9).map((category) => (
              <Link key={category.slug} href={`/shop/${category.slug}`} className="gem-card-new">
                <div className="gem-img-wrap">
                  {layeredImage(category.image_url, category.hover_image_url, category.name, fallbackGemBackground(category))}
                </div>
                <div className="gem-name-primary">{categoryLabel(category)}</div>
                <div className="gem-origin">{navaratnaLocationLabel()}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <IntegratedCategoryCta
        variant="navaratna"
        title="Not sure which gemstone is good for you?"
        copy="Share your birth details with our experts and get a clear, horoscope-led gemstone recommendation before you buy."
        primary={{ label: 'Get Gem Recommendation', href: '/configure' }}
        secondary={{ label: 'See Navaratna Collection', href: '/shop/navaratna' }}
        image="/home/ctas/cta1.webp"
        imageAlt="Vedic gemstone consultants preparing a horoscope recommendation"
        imageSide="right"
      />
    </>
  );
}

export function RudrakshaHomeSection({
  categories,
  featureCards = RUDRAKSHA_FEATURE_FALLBACK,
}: {
  categories: HomeManagedCategory[];
  featureCards?: HomeCatalogCategory[];
}) {
  const visibleCategories = categories.slice(0, 12);
  const visibleFeatureCards = featureCards.slice(0, 3);

  return (
    <>
      <section className="rudraksha-section" id="rudraksha" aria-labelledby="rudraksha-heading">
        <div className="rudraksha-bg-text" aria-hidden="true">रुद्राक्ष</div>
        <div className="container">
          <div className="section-head" style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="section-title" id="rudraksha-heading">Rudraksha Beads</h2>
            <p className="rudraksha-subtitle">Sacred Beads of Lord Shiva</p>
            <div className="section-rule-center" />
          </div>

          <div className="rudra-layout">
            <div>
              <div className="rudra-left-carousel" id="rudraCarousel">
                {visibleFeatureCards.map((card, index) => {
                  const featureImage = card.image_url ?? rudrakshaFeatureImage(card);
                  return (
                    <Link key={card.slug} href={categoryHref(card)} className={`rudra-left-card${index === 0 ? ' is-active' : ''}`} data-rudra-card={index}>
                      <img className="rudra-left-img" src={featureImage} alt={card.name} loading="lazy" />
                      <div className="rudra-left-footer">
                        <div className="rudra-left-title">{card.name}</div>
                        <span className="rudra-left-show">{card.cta_label ?? 'Shop Now'}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="rudra-carousel-dots" id="rudraCarouselDots">
                {visibleFeatureCards.map((card, index) => (
                  <button key={card.slug} className={`rudra-c-dot${index === 0 ? ' is-active' : ''}`} data-dot={index} aria-label={`Show ${card.name}`} />
                ))}
              </div>
            </div>

            <div>
              <div className="rudra-grid-right">
                {visibleCategories.map((category) => {
                  const meta = locationLabel(category) || '';
                  const isRare = meta.toLowerCase().includes('rare');
                  const imageUrl = category.image_url ?? rudrakshaImageForSlug(category.slug);
                  return (
                    <Link key={category.slug} href={`/shop/${category.slug}`} className="rudra-item-card">
                      <div className="rudra-circ-wrap">
                        {layeredImage(imageUrl, category.hover_image_url, `${category.name} Rudraksha`, fallbackGemBackground(category), 'rudra-item-img')}
                      </div>
                      <div className="rudra-item-name">{category.name}</div>
                      {isRare ? <div className="rudra-item-meta">Rare</div> : null}
                    </Link>
                  );
                })}
              </div>
              <div className="rudra-right-cta">
                <Link href="/shop/rudraksha" className="btn-outline-maroon" style={{ fontSize: '12px', letterSpacing: '0.08em' }}>Show All Rudrakshas</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <IntegratedCategoryCta
        variant="rudraksha"
        title="Not sure which Rudraksha is right for you?"
        copy="Share your birth details or spiritual goal with our experts and get a clear, mukhi-led Rudraksha recommendation before you buy."
        primary={{ label: 'Get Rudraksha Guidance', href: '/configure' }}
        secondary={{ label: 'See Rudraksha Collection', href: '/shop/rudraksha' }}
        image="/home/ctas/cta2.webp"
        imageAlt="Rudraksha expert offering personalised guidance"
        imageSide="left"
      />
    </>
  );
}

function getExploreCardDetail(category: HomeCatalogCategory) {
  const detail = category.homepage_subtitle ?? category.cta_label;
  const normalizedDetail = detail?.trim().toLowerCase();
  const normalizedName = category.name.trim().toLowerCase();
  if (!detail || !normalizedDetail || normalizedDetail === normalizedName) return null;
  return detail;
}

function ExploreCard({ category }: { category: HomeCatalogCategory }) {
  const hasImage = Boolean(category.image_url);
  const detail = getExploreCardDetail(category);
  return (
    <Link href={categoryHref(category)} className="explore-card">
      <div className="explore-card-img-wrap">
        {category.homepage_badge ? <div className="explore-card-sale">{category.homepage_badge}</div> : null}
        {hasImage ? (
          <div className="explore-card-photo">
            {layeredImage(category.image_url, category.hover_image_url, category.name, category.image_url ?? '')}
          </div>
        ) : (
          <div className="explore-card-art" style={{ background: exploreFallbackBackground(category) }} />
        )}
      </div>
      <div className="explore-card-name">{category.name}</div>
      {detail ? <div className="explore-card-sub">{detail}</div> : null}
    </Link>
  );
}

export function ExploreByCategorySection({
  idols,
  jewelry,
}: {
  idols: HomeCatalogCategory[];
  jewelry: HomeCatalogCategory[];
}) {
  return (
    <section className="explore-section" id="explore-category" aria-label="Explore by category">
      <div className="container">
        <div className="section-head">
          <h2 className="section-title">Explore by Category</h2>
          <p className="navratna-subtitle">Discover our curated sacred collections</p>
          <div className="section-rule-center" />
        </div>

        <div className="explore-tabs" role="tablist">
          <button className="explore-tab is-active" data-tab="spiritual" role="tab" aria-selected="true">Spiritual Idols</button>
          <button className="explore-tab" data-tab="jewellery" role="tab" aria-selected="false">Vedic Jewellery</button>
        </div>

        <div className="explore-panel is-active" id="panel-spiritual">
          <div className="pvg-slider-shell pvg-explore-slider-shell">
            <SliderButton target="exploreScroll1" direction="prev" label="Previous spiritual categories" />
            <div className="explore-scroll" id="exploreScroll1">
              <div className="explore-row">
                {idols.map((category) => <ExploreCard key={category.slug} category={category} />)}
              </div>
            </div>
            <SliderButton target="exploreScroll1" direction="next" label="Next spiritual categories" />
          </div>
          <div className="explore-cta">
            <Link href="/shop/idol" className="btn-outline-maroon">View All Spiritual Idols <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link>
          </div>
        </div>

        <div className="explore-panel" id="panel-jewellery">
          <div className="pvg-slider-shell pvg-explore-slider-shell">
            <SliderButton target="exploreScroll2" direction="prev" label="Previous jewellery categories" />
            <div className="explore-scroll" id="exploreScroll2">
              <div className="explore-row">
                {jewelry.map((category) => <ExploreCard key={category.slug} category={category} />)}
              </div>
            </div>
            <SliderButton target="exploreScroll2" direction="next" label="Next jewellery categories" />
          </div>
          <div className="explore-cta">
            <Link href="/shop/jewelry" className="btn-outline-maroon">View All Vedic Jewellery <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DirectorPickCard({ product }: { product: HomeDirectorPick }) {
  const imageUrl = product.thumbnail_url ?? product.images[0] ?? directorFallbackImage(product);
  return (
    <Link href={`/shop/${product.category ?? 'gemstone'}/${product.slug}`} className="director-pick-card">
      <div className="director-pick-media" style={!imageUrl ? { background: 'linear-gradient(145deg, #faf7ef, #efe3cf)' } : undefined}>
        {imageUrl ? <img src={imageUrl} alt={product.name} loading="lazy" /> : <div className="director-pick-gem-fallback" />}
      </div>
      <div className="director-pick-body">
        <div className="director-pick-info">
          <h4>{product.name}</h4>
          <span className="pick-meta">{directorMeta(product) || product.origin || 'Curated selection'}</span>
          <span className="pick-note">{directorNote(product)}</span>
        </div>
        <span className="pick-price">
          <span className="pick-price-label">Rs.</span>
          <span className="pick-price-value">{formatPriceValue(product.price)}</span>
        </span>
      </div>
    </Link>
  );
}

export function DirectorsPickSection({ products }: { products: HomeDirectorPick[] }) {
  return (
    <section className="directors-section director-section" id="directors-pick" aria-labelledby="director-heading">
      <div className="container">
        <div className="director-layout">
          <aside className="director-profile" aria-label="Personally selected by Shri Vikas Mehra">
            <div className="director-portrait">
              <img src="/home/director%27spick/director%27spick.webp" alt="Shri Vikas Mehra, Director of Pure Vedic Gems" loading="lazy" decoding="async" />
            </div>
            <div className="director-profile-note">Personally selected by Shri Vikas Mehra</div>
          </aside>

          <div className="director-content">
            <div className="director-strip">
              <div className="director-strip-copy">
                <span className="director-mobile-gem" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false"><path d="M6.5 4h11l4 5-9.5 11L2.5 9l4-5zm1.2 1.8L4.9 9.2h3.7l1.7-3.4H7.7zm4.3 0L10.3 9.2h3.4L12 5.8zm4.3 0h-2.6l1.7 3.4h3.7l-2.8-3.4zM9.2 11H5.7l5.1 5.8L9.2 11zm2.8 6 4.9-6h-3.5L12 17zm-1.7-5.8 1.7 6 1.7-6h-3.4z" /></svg>
                </span>
                <h2 className="section-title" id="director-heading">Director&apos;s Pick</h2>
                <span className="director-mobile-rule" aria-hidden="true"><span /></span>
                <p className="section-sub">Premium stones selected for quality, beauty and Jyotish suitability.</p>
              </div>
              <Link href="/shop?directors_pick=true" className="button-outline director-all-link">View All Picks</Link>
            </div>

            <div className="director-mobile-scroll-cue" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
            </div>

            <div className="director-picks">
              {products.slice(0, 5).map((product) => <DirectorPickCard key={product.id} product={product} />)}
            </div>

            <Link href="/shop?directors_pick=true" className="director-mobile-cta">
              <span>View All Picks</span>
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M8 5l8 7-8 7" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SemipreciousHomeSection({ categories }: { categories: HomeManagedCategory[] }) {
  return (
    <>
      <section className="semiprecious-section" id="semi-precious" aria-labelledby="semi-heading">
        <div className="semi-bg-text" aria-hidden="true">उपरत्न</div>
        <div className="container">
          <div className="section-head" style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="section-title" id="semi-heading">Semi-Precious Gemstones</h2>
            <p className="navratna-subtitle">Uparatnas - Vedic Complementary Healing Crystals</p>
            <div className="section-rule-center" />
          </div>

          <div className="pvg-slider-shell pvg-semi-slider-shell">
            <SliderButton target="semiCircleScroll" direction="prev" label="Previous Uparatnas" />
            <div className="semi-circle-scroll" id="semiCircleScroll">
              <div className="semi-circle-row">
                {categories.slice(0, 10).map((category) => (
                  <Link key={category.slug} href={`/shop/${category.slug}`} className="semi-circ-card">
                    <div
                      className="semi-circ-img"
                      style={!category.image_url ? { background: fallbackGemBackground(category) } : undefined}
                    >
                      {category.image_url ? <span className="semi-circ-layer pvg-main-bg" style={{ backgroundImage: `url('${category.image_url}')` }} /> : null}
                      {category.hover_image_url ? <span className="semi-circ-layer pvg-hover-bg" style={{ backgroundImage: `url('${category.hover_image_url}')` }} /> : null}
                    </div>
                    <span className="semi-circ-name">{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            <SliderButton target="semiCircleScroll" direction="next" label="Next Uparatnas" />
          </div>
        </div>
      </section>
      <IntegratedCategoryCta
        variant="uparatna"
        title="Need a practical gemstone alternative?"
        copy="Share your birth details with our experts and get a practical Uparatna recommendation for planetary support, comfort, and budget."
        primary={{ label: 'Get Uparatna Guidance', href: '/configure' }}
        secondary={{ label: 'See Uparatna Collection', href: '/shop?category=upratna' }}
        image="/home/ctas/cta3.webp"
        imageAlt="Vedic astrologer reviewing semi-precious gemstone alternatives"
        imageSide="right"
      />
    </>
  );
}