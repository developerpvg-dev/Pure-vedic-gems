import type { Database } from './database';

export type ProductBase = Database['public']['Tables']['products']['Row'];

export type ProductType =
  | 'simple'
  | 'variation'
  | 'gemstone'
  | 'rudraksha'
  | 'jewelry'
  | 'idol'
  | 'mala'
  | 'service'
  | 'external'
  | 'grouped'
  | 'downloadable';

export type PriceMode = 'fixed' | 'per_carat' | 'on_demand' | 'quote_required' | 'free';
export type StockStatus = 'in_stock' | 'out_of_stock' | 'on_backorder';
export type AvailabilityStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'sold'
  | 'reserved'
  | 'on_demand'
  | 'archived';

export type CertificateStatus =
  | 'not_required'
  | 'available'
  | 'included'
  | 'optional'
  | 'requested'
  | 'pending'
  | 'verified';

export interface ProductDimensionsMm {
  length?: number;
  width?: number;
  depth?: number;
  unit?: 'mm';
}

export interface Week2ProductFields {
  legacy_woo_id: number | null;
  legacy_parent_id: number | null;
  legacy_sku: string | null;
  legacy_slug: string | null;
  legacy_permalink: string | null;
  legacy_status: string | null;
  legacy_created_at: string | null;
  import_batch_id: string | null;
  import_warnings: string[];
  legacy_data: Record<string, unknown>;
  product_type: ProductType;
  tag_number: string | null;
  variation_parent_id: string | null;
  external_url: string | null;
  grouped_product_ids: string[];
  downloadable_files: unknown[];
  price_mode: PriceMode;
  sale_price_starts_at: string | null;
  sale_price_ends_at: string | null;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string | null;
  stock_status: StockStatus;
  availability_status: AvailabilityStatus;
  sold_individually: boolean;
  backorders_allowed: boolean;
  manual_reserve_enabled: boolean;
  reserved_quantity: number;
  reserved_until: string | null;
  reserved_by_customer_id: string | null;
  reserved_by_admin_id: string | null;
  reservation_note: string | null;
  clean_description: string | null;
  legacy_html_description: string | null;
  purchase_note: string | null;
  allow_reviews: boolean;
  meta_keywords: string[];
  canonical_url: string | null;
  og_image: string | null;
  seo_data: Record<string, unknown>;
  legacy_seo: Record<string, unknown>;
  gemstone_name: string | null;
  quality_label: string | null;
  commercial_quality_grade: string | null;
  color_description: string | null;
  clarity_description: string | null;
  treatment_summary: string | null;
  treatment_detail: string | null;
  origin_country: string | null;
  origin_region: string | null;
  origin_display: string | null;
  dimensions_mm: ProductDimensionsMm | null;
  composition: string | null;
  recommendation_category_code: string | null;
  certificate_number: string | null;
  certificate_lab: string | null;
  certificate_status: CertificateStatus;
  certificate_display_enabled: boolean;
  certificate_file_url: string | null;
  rudraksha_type: string | null;
  bead_size_mm: number | null;
  bead_weight: number | null;
  xray_certificate_number: string | null;
  deity: string | null;
  mantra: string | null;
  energization_eligible: boolean;
  jewellery_type: string | null;
  base_metal: string | null;
  metal_purity: string | null;
  metal_weight_grams: number | null;
  size_label: string | null;
  ring_size: string | null;
  design_code: string | null;
  making_charge: number | null;
  ready_stock: boolean;
  service_duration: string | null;
  service_delivery_mode: string | null;
}

export type Product = ProductBase & Partial<Week2ProductFields>;

export interface ProductCategory {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  family: string;
  legacy_names: string[];
  description: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  meta_keywords: string[];
  canonical_path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryAssignment {
  product_id: string;
  category_id: string;
  is_primary: boolean;
  sort_order: number;
  legacy_path: string | null;
  created_at: string;
}

export interface ProductOptionRules {
  product_id: string;
  certificate_enabled: boolean;
  energization_enabled: boolean;
  jewelry_design_enabled: boolean;
  metal_enabled: boolean;
  ring_size_enabled: boolean;
  allowed_setting_types: string[];
  allowed_metals: string[];
  allowed_ring_size_systems: string[];
  allowed_certification_lab_ids: string[];
  allowed_energization_option_ids: string[];
  legacy_certificate_options: unknown[];
  legacy_energization_options: unknown[];
  legacy_metal_options: unknown[];
  legacy_setting_options: unknown[];
  legacy_ring_size_options: unknown[];
  created_at: string;
  updated_at: string;
}

export interface ProductCurrencyPrice {
  product_id: string;
  currency: string;
  price: number;
  compare_price: number | null;
  price_per_carat: number | null;
  source: string;
  rate_snapshot: number | null;
  updated_at: string;
}

// Subset for listing cards — only fields needed in the grid
export type ProductCard = Pick<
  Product,
  | 'id'
  | 'sku'
  | 'slug'
  | 'name'
  | 'category'
  | 'sub_category'
  | 'price'
  | 'price_per_carat'
  | 'compare_price'
  | 'carat_weight'
  | 'ratti_weight'
  | 'origin'
  | 'shape'
  | 'certification'
  | 'images'
  | 'thumbnail_url'
  | 'in_stock'
  | 'featured'
  | 'is_directors_pick'
  | 'treatment'
  | 'planet'
  | 'created_at'
> & {
  configurator_enabled?: boolean;
  product_type?: ProductType;
  tag_number?: string | null;
  availability_status?: AvailabilityStatus;
  price_mode?: PriceMode;
  quality_label?: string | null;
  certificate_lab?: string | null;
  certificate_number?: string | null;
};

// Filter parameters for product listing API
export interface ProductFilters {
  category?: string;
  sub_category?: string;
  product_type?: ProductType;
  availability_status?: AvailabilityStatus;
  min_price?: number;
  max_price?: number;
  min_carat?: number;
  max_carat?: number;
  origin?: string;
  planet?: string;
  certification?: string;
  treatment?: string;
  q?: string;
  sort_by?: 'price' | 'carat' | 'newest';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// Paginated response for product listing
export interface ProductListResponse {
  products: ProductCard[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Single product response with related data
export interface ProductDetailResponse {
  product: Product;
  related_products: ProductCard[];
  expert: {
    id: string;
    name: string;
    title: string | null;
    photo_url: string | null;
    specialty: string | null;
    rating: number;
  } | null;
  review_summary: {
    average_rating: number;
    total_reviews: number;
  };
}

// Search result structure
export type SearchResultType = 'product' | 'category' | 'knowledge' | 'blog' | 'tool' | 'service';

export interface SearchResult {
  id: string;
  type?: SearchResultType;
  slug?: string;
  name: string;
  title?: string;
  href?: string;
  category: string;
  categoryLabel?: string;
  description?: string | null;
  price?: number | null;
  thumbnail_url: string | null;
  origin: string | null;
  planet: string | null;
  tag_number?: string | null;
}

export interface SearchResultGroup {
  type: SearchResultType;
  label: string;
  results: SearchResult[];
}

export interface SearchResponse {
  results: SearchResult[];
  groups?: SearchResultGroup[];
  query: string;
  total: number;
}
