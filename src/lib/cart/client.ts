import type { CartItem } from '@/lib/types/cart';

export const CART_STORAGE_KEY = 'pvg_cart';
export const GUEST_SESSION_KEY = 'pvg_guest_session_id';
export const GUEST_CART_DIRTY_KEY = 'pvg_guest_cart_dirty';
export const DEFAULT_MAX_CART_QUANTITY = 99;

export function deriveCartLineKey(item: {
  product_id: string;
  configuration_id?: string | null;
  key?: string;
}) {
  if (item.key) return item.key;
  return item.configuration_id
    ? `${item.product_id}:cfg:${item.configuration_id}`
    : item.product_id;
}

export function getMaxAvailableQuantity(
  item: Pick<CartItem, 'stock_quantity' | 'in_stock' | 'stock_status' | 'availability_status' | 'sold_individually'>
) {
  if (item.in_stock === false || item.stock_status === 'out_of_stock') return 0;
  if (['sold', 'reserved', 'out_of_stock', 'archived'].includes(String(item.availability_status ?? ''))) {
    return 0;
  }

  const stockQuantity = Number(item.stock_quantity);
  const hasKnownStock = Number.isFinite(stockQuantity) && stockQuantity >= 0;
  const availableStock = hasKnownStock ? stockQuantity : DEFAULT_MAX_CART_QUANTITY;
  return item.sold_individually ? Math.min(1, availableStock) : availableStock;
}

/** Clamp a desired quantity to valid cart bounds. Returns 0 when the item cannot be purchased. */
export function clampCartQuantity(item: CartItem, requestedQuantity: number) {
  const maxQuantity = getMaxAvailableQuantity(item);
  if (maxQuantity <= 0) return 0;
  if (requestedQuantity <= 0) return 0;
  return Math.min(requestedQuantity, maxQuantity);
}

export function canIncreaseQuantity(item: CartItem) {
  return item.quantity < getMaxAvailableQuantity(item);
}

export function readStoredCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const saved: CartItem[] = JSON.parse(raw);
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function markGuestCartDirty() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(GUEST_CART_DIRTY_KEY, '1');
  } catch {
    // ignore
  }
}

export function consumeGuestCartDirtyFlag() {
  if (typeof window === 'undefined') return false;
  try {
    const dirty = sessionStorage.getItem(GUEST_CART_DIRTY_KEY) === '1';
    if (dirty) sessionStorage.removeItem(GUEST_CART_DIRTY_KEY);
    return dirty;
  } catch {
    return false;
  }
}

export function clearStoredCart() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // ignore
  }
}
