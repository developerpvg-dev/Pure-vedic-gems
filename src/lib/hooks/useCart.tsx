'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Cart, CartItem, CartAction } from '@/lib/types/cart';

const STORAGE_KEY = 'pvg_cart';

// ─── Reducer ────────────────────────────────────────────────────────────────

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'ADD_ITEM': {
      const existing = state.find((i) => i.key === action.payload.key);
      if (existing) {
        return state.map((i) =>
          i.key === action.payload.key
            ? { ...i, quantity: i.quantity + action.payload.quantity }
            : i
        );
      }
      return [...state, action.payload];
    }

    case 'REMOVE_ITEM':
      return state.filter((i) => i.key !== action.payload.key);

    case 'UPDATE_QTY':
      return state.map((i) =>
        i.key === action.payload.key
          ? { ...i, quantity: Math.max(1, action.payload.quantity) }
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
  const [items, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useReducer(() => true, false);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: CartItem[] = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          dispatch({ type: 'HYDRATE', payload: saved });
        }
      }
    } catch {
      // corrupt storage — ignore
    }
    setHydrated();
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage might be full — ignore
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (rawItem: Omit<CartItem, 'key'> & { key?: string }) => {
      const key = rawItem.key ?? rawItem.product_id;
      dispatch({ type: 'ADD_ITEM', payload: { ...rawItem, key } });
    },
    []
  );

  const removeItem = useCallback((key: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { key } });
  }, []);

  const updateQty = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: { key } });
    } else {
      dispatch({ type: 'UPDATE_QTY', payload: { key, quantity } });
    }
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

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
