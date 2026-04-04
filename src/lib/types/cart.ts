/**
 * Cart types for PureVedicGems
 * Supports regular products AND configured jewelry items.
 */

export interface CartItem {
  /** Line-item key — product_id, or product_id+configuration_id for configured items */
  key: string;
  product_id: string;
  sku: string;
  name: string;
  category: string;
  image_url: string;
  /** Unit price (server-validated for configured items) */
  price: number;
  quantity: number;
  carat_weight: number | null;
  origin: string | null;
  /** Present only for Gem-to-Jewelry configured items */
  configuration_id?: string;
  /** Human-readable config summary, e.g. "Yellow Sapphire · Gold Ring · GIA · Energized" */
  configuration_summary?: string;
}

export interface Cart {
  items: CartItem[];
  /** Sum of item.price × item.quantity */
  subtotal: number;
  /** Total number of individual units across all lines */
  item_count: number;
}

/** Actions dispatched to the cart reducer */
export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { key: string } }
  | { type: 'UPDATE_QTY'; payload: { key: string; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; payload: CartItem[] };
