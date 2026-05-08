export const PRODUCT_CATEGORIES = [
  'navaratna',
  'upratna',
  'gemstone',
  'rudraksha',
  'idol',
  'mala',
  'jewelry',
] as const;

export const PRODUCT_TYPES = [
  'simple',
  'variation',
  'gemstone',
  'rudraksha',
  'jewelry',
  'idol',
  'mala',
  'service',
  'external',
  'grouped',
  'downloadable',
] as const;

export const CATALOG_FAMILIES = [
  'navaratna',
  'upratna',
  'gemstone',
  'rudraksha',
  'jewelry',
  'mala',
  'idol',
  'service',
  'collection',
  'uncategorized',
] as const;

export const SORT_BY = ['price', 'carat', 'newest'] as const;
export const SORT_ORDER = ['asc', 'desc'] as const;

export const PLANETS = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
] as const;

export const CERTIFICATIONS = [
  'GIA',
  'IGI',
  'GJEPC',
  'IIGJ',
  'GRS',
  'Gubelin',
  'SSEF',
  'AGL',
  'HRD Antwerp',
  'GII',
  'GFCO',
  'None',
] as const;

export const TREATMENTS = [
  'none',
  'Natural',
  'Unheated',
  'Heated',
  'Minor Oil',
  'No Oil',
  'No Treatment',
  'heated',
  'unheated',
  'minor_oil',
  'no_oil',
] as const;

export const PRICE_MODES = ['fixed', 'per_carat', 'on_demand', 'quote_required', 'free'] as const;
export const STOCK_STATUSES = ['in_stock', 'out_of_stock', 'on_backorder'] as const;
export const AVAILABILITY_STATUSES = [
  'in_stock',
  'out_of_stock',
  'sold',
  'reserved',
  'on_demand',
  'archived',
] as const;

export const CERTIFICATE_STATUSES = [
  'not_required',
  'available',
  'included',
  'optional',
  'requested',
  'pending',
  'verified',
] as const;

export const TAX_STATUSES = ['taxable', 'shipping', 'none'] as const;
export const SETTING_TYPES = ['ring', 'pendant', 'bracelet', 'loose', 'necklace', 'earring'] as const;
export const RING_SIZE_SYSTEMS = ['india', 'us', 'uk_au', 'eu'] as const;
export const JEWELLERY_TYPES = [
  'ring',
  'pendant',
  'bracelet',
  'mala',
  'necklace',
  'earring',
  'ready_stock',
  'custom',
] as const;

export const METAL_SLUGS = [
  'silver_925',
  'panchdhatu',
  'gold_14k',
  'gold_18k',
  'gold_22k',
  'platinum',
  'copper',
] as const;

export const CANONICAL_CATEGORY_OPTIONS = [
  { value: 'navaratna', label: 'Navaratna (Sacred Nine Gems)' },
  { value: 'upratna', label: 'Upratna (Semi-Precious Gems)' },
  { value: 'gemstone', label: 'Other Gemstones' },
  { value: 'rudraksha', label: 'Rudraksha' },
  { value: 'idol', label: 'Spiritual Idols' },
  { value: 'mala', label: 'Malas' },
  { value: 'jewelry', label: 'Jewellery' },
] as const;

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'gemstone', label: 'Gemstone' },
  { value: 'rudraksha', label: 'Rudraksha' },
  { value: 'jewelry', label: 'Jewellery' },
  { value: 'idol', label: 'Spiritual Idol' },
  { value: 'mala', label: 'Mala' },
  { value: 'service', label: 'Service / Pooja' },
  { value: 'external', label: 'External / On Demand' },
  { value: 'grouped', label: 'Grouped Product' },
  { value: 'downloadable', label: 'Downloadable' },
  { value: 'variation', label: 'Variation' },
  { value: 'simple', label: 'Simple Physical Product' },
] as const;

export const AVAILABILITY_STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'sold', label: 'Sold' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'on_demand', label: 'On demand' },
  { value: 'archived', label: 'Archived' },
] as const;
