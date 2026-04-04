import type { Database } from './database';

// Full product type matching the products table
export type Product = Database['public']['Tables']['products']['Row'];

// Subset for listing cards — only fields needed in the grid
export type ProductCard = Pick<
  Product,
  | 'id'
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
};

// Filter parameters for product listing API
export interface ProductFilters {
  category?: string;
  sub_category?: string;
  min_price?: number;
  max_price?: number;
  min_carat?: number;
  max_carat?: number;
  origin?: string;
  planet?: string;
  certification?: string;
  treatment?: string;
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
export interface SearchResult {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  thumbnail_url: string | null;
  origin: string | null;
  planet: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
}
