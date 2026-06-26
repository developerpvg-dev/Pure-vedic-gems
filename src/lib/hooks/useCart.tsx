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
import { toast } from 'sonner';
import type { Cart, CartItem, CartAction } from '@/lib/types/cart';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  CART_STORAGE_KEY,
  GUEST_SESSION_KEY,
  clampCartQuantity,
  clearStoredCart,
  consumeGuestCartDirtyFlag,
  deriveCartLineKey,
  markGuestCartDirty,
  readStoredCartItems,
} from '@/lib/cart/client';

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
          i.key === action.payload.key ? { ...mergedItem, quantity } : i
        );
      }
      const quantity = clampCartQuantity(action.payload, action.payload.quantity);
      if (quantity <= 0) return state;
      return [...state, { ...action.payload, quantity }];
    }

    case 'REMOVE_ITEM':
      return state.filter((i) => i.key !== action.payload.key);

    case 'UPDATE_QTY': {
      const existing = state.find((i) => i.key === action.payload.key);
      if (!existing) return state;
      const quantity = clampCartQuantity(existing, action.payload.quantity);
      if (quantity <= 0) return state.filter((i) => i.key !== action.payload.key);
      return state.map((i) =>
        i.key === action.payload.key ? { ...i, quantity } : i
      );
    }

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

async function safeJsonCart(response: Response): Promise<Cart | null> {
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as Cart | null;
  if (!data || !Array.isArray(data.items)) return null;
  return data;
}

async function fetchServerCart(): Promise<Cart | null> {
  try {
    const response = await fetch('/api/cart', { cache: 'no-store' });
    return await safeJsonCart(response);
  } catch {
    return null;
  }
}

interface CartContextValue {
  cart: Cart;
  addItem: (item: Omit<CartItem, 'key'> & { key?: string }) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, configurationId?: string) => boolean;
  getItemQty: (productId: string, configurationId?: string) => number;
  getItemKey: (productId: string, configurationId?: string) => string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [] as CartItem[], readStoredCartItems);
  const [guestSessionId] = useState<string | null>(readOrCreateGuestSessionId);
  const { user, isLoading: authLoading } = useAuth();
  const previousUserIdRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage might be full — ignore
    }
  }, [items]);

  // Clear local cart when the user signs out so guest merge does not duplicate server lines.
  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    if (previousUserId && !user) {
      dispatch({ type: 'CLEAR' });
      clearStoredCart();
    }
    previousUserIdRef.current = user?.id ?? null;
  }, [user]);

  // Authenticated users: merge guest cart once, then always hydrate from the server.
  useEffect(() => {
    if (authLoading || !user || syncInFlightRef.current) return;

    let cancelled = false;
    syncInFlightRef.current = true;

    const syncWithServer = async () => {
      const itemsBeforeSync = JSON.stringify(itemsRef.current);
      try {
        const shouldMergeGuestCart = consumeGuestCartDirtyFlag();
        if (shouldMergeGuestCart) {
          const guestItems = readStoredCartItems();
          if (guestItems.length > 0) {
            await fetch('/api/cart/merge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                guest_session_id: guestSessionId ?? undefined,
                items: guestItems.map((item) => ({
                  key: item.key,
                  product_id: item.product_id,
                  slug: item.slug,
                  sku: item.sku,
                  tag_number: item.tag_number,
                  name: item.name,
                  category: item.category,
                  image_url: item.image_url,
                  price: item.price,
                  quantity: item.quantity,
                  stock_quantity: item.stock_quantity,
                  stock_status: item.stock_status,
                  availability_status: item.availability_status,
                  in_stock: item.in_stock,
                  sold_individually: item.sold_individually,
                  carat_weight: item.carat_weight,
                  origin: item.origin,
                  configuration_id: item.configuration_id,
                  configuration_summary: item.configuration_summary,
                  configuration_snapshot: item.configuration_snapshot,
                  configuration_edit_url: item.configuration_edit_url,
                  delivery_eta_label: item.delivery_eta_label,
                })),
              }),
            });
          }
        }

        const serverCart = await fetchServerCart();
        if (!cancelled && serverCart && JSON.stringify(itemsRef.current) === itemsBeforeSync) {
          dispatch({ type: 'HYDRATE', payload: serverCart.items });
        }
      } catch {
        if (!cancelled) {
          toast.error('Could not sync your cart. Showing the last saved version.');
        }
      } finally {
        syncInFlightRef.current = false;
      }
    };

    void syncWithServer();

    return () => {
      cancelled = true;
    };
  }, [authLoading, guestSessionId, user]);

  const sendGuestEvent = useCallback(
    (
      eventType: 'cart_item_added' | 'cart_item_updated' | 'cart_item_removed' | 'cart_cleared',
      item?: CartItem,
      quantity?: number
    ) => {
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
    async (path: string, init: RequestInit, rollbackItems: CartItem[]) => {
      if (!user) return;

      try {
        const response = await fetch(path, init);
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          dispatch({ type: 'HYDRATE', payload: rollbackItems });
          toast.error(data?.error ?? 'Could not update your cart.');
          return;
        }

        const serverCart = await safeJsonCart(response);
        if (serverCart) {
          dispatch({ type: 'HYDRATE', payload: serverCart.items });
          return;
        }

        const refreshedCart = await fetchServerCart();
        if (refreshedCart) {
          dispatch({ type: 'HYDRATE', payload: refreshedCart.items });
        } else {
          dispatch({ type: 'HYDRATE', payload: rollbackItems });
          toast.error('Could not refresh your cart.');
        }
      } catch {
        dispatch({ type: 'HYDRATE', payload: rollbackItems });
        toast.error('Could not update your cart.');
      }
    },
    [user]
  );

  const addItem = useCallback(
    (rawItem: Omit<CartItem, 'key'> & { key?: string }) => {
      const key = deriveCartLineKey(rawItem);
      const existing = items.find((cartItem) => cartItem.key === key);
      const mergedItem = existing ? { ...existing, ...rawItem, key } : { ...rawItem, key };
      const nextQuantity = clampCartQuantity(
        mergedItem,
        (existing?.quantity ?? 0) + rawItem.quantity
      );
      const quantityToAdd = existing ? nextQuantity - existing.quantity : nextQuantity;

      if (quantityToAdd <= 0) {
        if (existing && nextQuantity <= existing.quantity) {
          toast.info(
            existing.sold_individually
              ? 'This item can only be purchased once.'
              : `Only ${nextQuantity || existing.quantity} unit(s) available.`
          );
        } else {
          toast.error('This product is currently unavailable.');
        }
        return;
      }

      const rollbackItems = items;
      const item = { ...mergedItem, quantity: quantityToAdd };
      dispatch({ type: 'ADD_ITEM', payload: item });

      if (user) {
        void syncAuthenticatedCart(
          '/api/cart',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guest_session_id: guestSessionId ?? undefined, item }),
          },
          rollbackItems
        );
      } else {
        markGuestCartDirty();
        sendGuestEvent(existing ? 'cart_item_updated' : 'cart_item_added', { ...mergedItem, quantity: nextQuantity }, nextQuantity);
      }
    },
    [guestSessionId, items, sendGuestEvent, syncAuthenticatedCart, user]
  );

  const removeItem = useCallback(
    (key: string) => {
      const existing = items.find((item) => item.key === key);
      if (!existing) return;

      const rollbackItems = items;
      dispatch({ type: 'REMOVE_ITEM', payload: { key } });

      if (user) {
        void syncAuthenticatedCart(
          `/api/cart/${encodeURIComponent(key)}`,
          { method: 'DELETE' },
          rollbackItems
        );
      } else {
        markGuestCartDirty();
        sendGuestEvent('cart_item_removed', existing);
      }
    },
    [items, sendGuestEvent, syncAuthenticatedCart, user]
  );

  const updateQty = useCallback(
    (key: string, quantity: number) => {
      const existing = items.find((item) => item.key === key);
      if (!existing) return;

      const rollbackItems = items;

      if (quantity <= 0) {
        dispatch({ type: 'REMOVE_ITEM', payload: { key } });
        if (user) {
          void syncAuthenticatedCart(
            `/api/cart/${encodeURIComponent(key)}`,
            { method: 'DELETE' },
            rollbackItems
          );
        } else {
          markGuestCartDirty();
          sendGuestEvent('cart_item_removed', existing);
        }
        return;
      }

      const nextQuantity = clampCartQuantity(existing, quantity);
      if (nextQuantity <= 0) {
        toast.error('This product is currently unavailable.');
        return;
      }
      if (nextQuantity < quantity) {
        toast.info(`Only ${nextQuantity} unit${nextQuantity > 1 ? 's' : ''} available.`);
      }

      dispatch({ type: 'UPDATE_QTY', payload: { key, quantity: nextQuantity } });

      if (user) {
        void syncAuthenticatedCart(
          `/api/cart/${encodeURIComponent(key)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: nextQuantity }),
          },
          rollbackItems
        );
      } else {
        markGuestCartDirty();
        sendGuestEvent('cart_item_updated', existing, nextQuantity);
      }
    },
    [items, sendGuestEvent, syncAuthenticatedCart, user]
  );

  const clearCart = useCallback(() => {
    const previousCart = deriveCart(items);
    const rollbackItems = items;
    dispatch({ type: 'CLEAR' });

    if (user) {
      void syncAuthenticatedCart('/api/cart', { method: 'DELETE' }, rollbackItems);
    } else {
      markGuestCartDirty();
      sendGuestEvent('cart_cleared', undefined, previousCart.item_count);
    }
  }, [items, sendGuestEvent, syncAuthenticatedCart, user]);

  const isInCart = useCallback(
    (productId: string, configurationId?: string) =>
      items.some(
        (item) =>
          item.product_id === productId &&
          (configurationId ? item.configuration_id === configurationId : !item.configuration_id)
      ),
    [items]
  );

  const getItemQty = useCallback(
    (productId: string, configurationId?: string) =>
      items
        .filter(
          (item) =>
            item.product_id === productId &&
            (configurationId ? item.configuration_id === configurationId : !item.configuration_id)
        )
        .reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const getItemKey = useCallback(
    (productId: string, configurationId?: string) => {
      const match = items.find(
        (item) =>
          item.product_id === productId &&
          (configurationId ? item.configuration_id === configurationId : !item.configuration_id)
      );
      return match?.key ?? null;
    },
    [items]
  );

  const cart = deriveCart(items);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, updateQty, clearCart, isInCart, getItemQty, getItemKey }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
