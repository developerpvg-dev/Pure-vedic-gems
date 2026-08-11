import type { CartItem } from '@/lib/types/cart';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { getRudrakshaProductIdsFromSnapshot } from '@/lib/utils/rudraksha-order-display';

export const CART_STORAGE_KEY = 'pvg_cart';
export const GUEST_SESSION_KEY = 'pvg_guest_session_id';
export const GUEST_CART_DIRTY_KEY = 'pvg_guest_cart_dirty';
// ponytail: each catalog piece is unique — never more than 1 in cart
export const DEFAULT_MAX_CART_QUANTITY = 1;

export const CART_UNIQUE_PIECE_MESSAGE =
  'This rudraksha is already in your cart as part of a jewellery piece.';

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

/** Primary + combo bead IDs from a configured line; else the line product_id. */
export function collectCartItemProductIds(
  item: Pick<CartItem, 'product_id'> & { configuration_snapshot?: unknown },
): string[] {
  const fromSnap = getRudrakshaProductIdsFromSnapshot(item.configuration_snapshot);
  if (fromSnap.length > 0) return fromSnap;
  return item.product_id ? [item.product_id] : [];
}

export function isProductOccupiedInCart(
  items: Array<
    Pick<CartItem, 'product_id' | 'key'> & {
      configuration_snapshot?: unknown;
    }
  >,
  productId: string,
  options?: { excludeLineKey?: string },
): boolean {
  for (const item of items) {
    if (options?.excludeLineKey && item.key === options.excludeLineKey) continue;
    if (collectCartItemProductIds(item).includes(productId)) return true;
  }
  return false;
}

/**
 * Block loose add when the piece is already inside a configured jewellery line.
 * Configured → configured is allowed: stripOverlappingCartLines replaces the old line
 * (edit-from-cart uses a new configuration_id / line key).
 */
export function getUniquePieceAddConflict(
  state: Array<
    Pick<CartItem, 'product_id' | 'key' | 'configuration_id'> & {
      configuration_snapshot?: unknown;
    }
  >,
  incoming: Pick<CartItem, 'product_id' | 'key' | 'configuration_id'> & {
    configuration_snapshot?: unknown;
  },
): string | null {
  // Configured add replaces overlapping lines via stripOverlappingCartLines.
  if (incoming.configuration_id) return null;

  const incomingIds = new Set(collectCartItemProductIds(incoming));
  for (const item of state) {
    if (item.key === incoming.key) continue;
    if (!item.configuration_id) continue;
    if (collectCartItemProductIds(item).some((id) => incomingIds.has(id))) {
      return CART_UNIQUE_PIECE_MESSAGE;
    }
  }
  return null;
}

/** Drop lines that share any piece ID with incoming (siblings + absorbed loose combos). */
export function stripOverlappingCartLines<
  T extends Pick<CartItem, 'product_id' | 'key'> & { configuration_snapshot?: unknown },
>(state: T[], incoming: Pick<CartItem, 'product_id' | 'key'> & { configuration_snapshot?: unknown }): T[] {
  const incomingIds = new Set(collectCartItemProductIds(incoming));
  return state.filter((item) => {
    if (item.key === incoming.key) return false;
    if (item.product_id === incoming.product_id) return false;
    return !collectCartItemProductIds(item).some((id) => incomingIds.has(id));
  });
}

/**
 * One physical piece ⇒ one cart line. Configured lines claim combo bead IDs so a
 * standalone bead cannot sit beside the jewellery that already includes it.
 */
export function dedupeCartByProductId(items: CartItem[]): CartItem[] {
  // Configured first so multi-bead jewellery absorbs combo SKUs; later wins within class.
  const indices = items.map((_, index) => index).sort((ai, bi) => {
    const aCfg = Number(Boolean(items[ai]?.configuration_id));
    const bCfg = Number(Boolean(items[bi]?.configuration_id));
    if (bCfg !== aCfg) return bCfg - aCfg;
    return bi - ai;
  });

  const claimed = new Set<string>();
  const keep = new Set<number>();
  for (const index of indices) {
    const ids = collectCartItemProductIds(items[index]!);
    if (ids.some((id) => claimed.has(id))) continue;
    for (const id of ids) claimed.add(id);
    keep.add(index);
  }
  return items.filter((_, index) => keep.has(index));
}

export function getMaxAvailableQuantity(
  item: Pick<CartItem, 'stock_quantity' | 'in_stock' | 'stock_status' | 'availability_status' | 'sold_individually'>
) {
  if (item.in_stock === false || item.stock_status === 'out_of_stock') return 0;
  if (['sold', 'reserved', 'out_of_stock', 'archived'].includes(String(item.availability_status ?? ''))) {
    return 0;
  }

  const stockQuantity = Number(item.stock_quantity);
  if (Number.isFinite(stockQuantity) && stockQuantity <= 0) return 0;
  return 1;
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
    if (!Array.isArray(saved)) return [];
    // Clamp legacy carts that allowed qty > 1 before unique-piece rule
    return dedupeCartByProductId(
      saved
        .map((row) => {
          const quantity = clampCartQuantity(row, Number(row.quantity) || 0);
          return quantity > 0
            ? { ...row, quantity, name: formatProductDisplayName(row.name) }
            : null;
        })
        .filter((row): row is CartItem => row != null)
    );
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
