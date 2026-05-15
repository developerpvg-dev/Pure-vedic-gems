'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Cart, CartItem, CartAction } from '@/lib/types/cart';
import { useAuth } from '@/lib/hooks/useAuth';

const STORAGE_KEY = 'pvg_cart';
const GUEST_SESSION_KEY = 'pvg_guest_session_id';
const DEFAULT_MAX_CART_QUANTITY = 99;

function getMaxAvailableQuantity(item: Pick<CartItem, 'stock_quantity' | 'in_stock' | 'stock_status' | 'availability_status' | 'sold_individually'>) {
  if (item.in_stock === false || item.stock_status === 'out_of_stock') return 0;
  if (['sold', 'reserved', 'out_of_stock', 'archived'].includes(String(item.availability_status ?? ''))) return 0;

  const stockQuantity = Number(item.stock_quantity);
  const hasKnownStock = Number.isFinite(stockQuantity) && stockQuantity >= 0;
  const availableStock = hasKnownStock ? stockQuantity : DEFAULT_MAX_CART_QUANTITY;
  return item.sold_individually ? Math.min(1, availableStock) : availableStock;
}

function clampCartQuantity(item: CartItem, requestedQuantity: number) {
  const maxQuantity = getMaxAvailableQuantity(item);
  if (maxQuantity <= 0) return 0;
  return Math.min(Math.max(1, requestedQuantity), maxQuantity);
}

// ─── Reducer ────────────────────────────────────────────────────────────────

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'ADD_ITEM': {
      const existing = state.find((i) => i.key === action.payload.key);
      if (existing) {
        const mergedItem = { ...existing, ...action.payload };
        const quantity = clampCartQuantity(mergedItem, existing.quantity + action.payload.quantity);
        if (quantity <= existing.quantity) return state;
        return state.map((i) =>
          i.key === action.payload.key
            ? { ...mergedItem, quantity }
            : i
        );
      }
      const quantity = clampCartQuantity(action.payload, action.payload.quantity);
      if (quantity <= 0) return state;
      return [...state, { ...action.payload, quantity }];
    }

    case 'REMOVE_ITEM':
      return state.filter((i) => i.key !== action.payload.key);

    case 'UPDATE_QTY':
      return state.map((i) =>
        i.key === action.payload.key
          ? { ...i, quantity: clampCartQuantity(i, action.payload.quantity) || i.quantity }
          : i
      );

    case 'CLEAR':
      return [];

    default:
      return state;
  }
}

function deriveCart(items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const item_count = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, subtotal, item_count };
}

function createGuestSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function readOrCreateGuestSessionId() {
  if (typeof window === 'undefined') return null;

  try {
    const existingSessionId = localStorage.getItem(GUEST_SESSION_KEY);
    const sessionId = existingSessionId || createGuestSessionId();
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    return null;
  }
}

function readInitialCartItems(initialItems: CartItem[]): CartItem[] {
  void initialItems;
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const saved: CartItem[] = JSON.parse(raw);
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

async function safeJsonCart(response: Response): Promise<Cart | null> {
  if (!response.ok) return null;
  const data = await response.json().catch(() => null) as Cart | null;
  if (!data || !Array.isArray(data.items)) return null;
  return data;
}

// ─── Context ────────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: Cart;
  addItem: (item: Omit<CartItem, 'key'> & { key?: string }) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQty: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [] as CartItem[], readInitialCartItems);
  const [guestSessionId] = useState<string | null>(readOrCreateGuestSessionId);
  const { user, isLoading: authLoading } = useAuth();
  const mergedForUserRef = useRef<string | null>(null);

  // Persist to localStorage whenever items change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage might be full — ignore
    }
  }, [items]);

  useEffect(() => {
    if (authLoading || !user || mergedForUserRef.current === user.id) return;

    mergedForUserRef.current = user.id;
    const mergeCart = async () => {
      try {
        const response = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guest_session_id: guestSessionId ?? undefined,
            items,
          }),
        });
        const serverCart = await safeJsonCart(response);
        if (serverCart) {
          dispatch({ type: 'HYDRATE', payload: serverCart.items });
        }
      } catch {
        mergedForUserRef.current = null;
      }
    };

    void mergeCart();
  }, [authLoading, guestSessionId, items, user]);

  const sendGuestEvent = useCallback(
    (eventType: 'cart_item_added' | 'cart_item_updated' | 'cart_item_removed' | 'cart_cleared', item?: CartItem, quantity?: number) => {
      if (!guestSessionId || user) return;
      void fetch('/api/cart/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_session_id: guestSessionId,
          event_type: eventType,
          product_id: item?.product_id,
          quantity: quantity ?? item?.quantity ?? 0,
          value: item ? item.price * (quantity ?? item.quantity) : 0,
        }),
      }).catch(() => undefined);
    },
    [guestSessionId, user]
  );

  const syncAuthenticatedCart = useCallback(
    (path: string, init: RequestInit, onServerCart?: (cart: Cart) => void) => {
      if (!user) return;
      void fetch(path, init)
        .then(async (response) => {
          const serverCart = await safeJsonCart(response);
          if (serverCart) return serverCart;
          return fetch('/api/cart').then(safeJsonCart).catch(() => null);
        })
        .then((serverCart) => {
          if (serverCart) {
            onServerCart?.(serverCart);
          }
        })
        .catch(() => undefined);
    },
    [user]
  );

  const addItem = useCallback(
    (rawItem: Omit<CartItem, 'key'> & { key?: string }) => {
      const key = rawItem.key ?? (
        rawItem.configuration_id
          ? `${rawItem.product_id}:cfg:${rawItem.configuration_id}`
          : rawItem.product_id
      );
      const existing = items.find((cartItem) => cartItem.key === key);
      const mergedItem = existing ? { ...existing, ...rawItem, key } : { ...rawItem, key };
      const nextQuantity = clampCartQuantity(mergedItem, (existing?.quantity ?? 0) + rawItem.quantity);
      const quantityToAdd = existing ? nextQuantity - existing.quantity : nextQuantity;
      if (quantityToAdd <= 0) return;

      const item = { ...mergedItem, quantity: quantityToAdd };
      dispatch({ type: 'ADD_ITEM', payload: item });

      if (user) {
        syncAuthenticatedCart(
          '/api/cart',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guest_session_id: guestSessionId ?? undefined, item }),
          },
          (serverCart) => dispatch({ type: 'HYDRATE', payload: serverCart.items })
        );
      } else {
        sendGuestEvent(existing ? 'cart_item_updated' : 'cart_item_added', item, nextQuantity);
      }
    },
    [guestSessionId, items, sendGuestEvent, syncAuthenticatedCart, user]
  );

  const removeItem = useCallback((key: string) => {
    const existing = items.find((item) => item.key === key);
    dispatch({ type: 'REMOVE_ITEM', payload: { key } });

    if (user) {
      syncAuthenticatedCart(
        `/api/cart/${encodeURIComponent(key)}`,
        { method: 'DELETE' },
        (serverCart) => dispatch({ type: 'HYDRATE', payload: serverCart.items })
      );
    } else if (existing) {
      sendGuestEvent('cart_item_removed', existing);
    }
  }, [items, sendGuestEvent, syncAuthenticatedCart, user]);

  const updateQty = useCallback((key: string, quantity: number) => {
    const existing = items.find((item) => item.key === key);
    const nextQuantity = existing ? clampCartQuantity(existing, quantity) : quantity;
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: { key } });
    } else if (nextQuantity <= 0) {
      return;
    } else {
      dispatch({ type: 'UPDATE_QTY', payload: { key, quantity: nextQuantity } });
    }

    if (user) {
      syncAuthenticatedCart(
        `/api/cart/${encodeURIComponent(key)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: nextQuantity }),
        },
        (serverCart) => dispatch({ type: 'HYDRATE', payload: serverCart.items })
      );
    } else if (existing) {
      sendGuestEvent(quantity <= 0 ? 'cart_item_removed' : 'cart_item_updated', existing, nextQuantity);
    }
  }, [items, sendGuestEvent, syncAuthenticatedCart, user]);

  const clearCart = useCallback(() => {
    const previousCart = deriveCart(items);
    dispatch({ type: 'CLEAR' });
    if (user) {
      syncAuthenticatedCart('/api/cart', { method: 'DELETE' });
    } else {
      sendGuestEvent('cart_cleared', undefined, previousCart.item_count);
    }
  }, [items, sendGuestEvent, syncAuthenticatedCart, user]);

  const isInCart = useCallback(
    (productId: string) => items.some((i) => i.product_id === productId),
    [items]
  );

  const getItemQty = useCallback(
    (productId: string) =>
      items.filter((i) => i.product_id === productId).reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  const cart = deriveCart(items);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, updateQty, clearCart, isInCart, getItemQty }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
