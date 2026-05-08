'use client';

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

type ToggleStatus = 'added' | 'removed' | 'auth_required' | 'error';

interface SavedItemsContextValue {
  savedIds: Set<string>;
  isLoading: boolean;
  isSaved: (productId: string) => boolean;
  toggleSaved: (productId: string) => Promise<{ status: ToggleStatus; error?: string }>;
}

const SavedItemsContext = createContext<SavedItemsContextValue | null>(null);

export function SavedItemsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (authLoading) return;

    if (!user) {
      startTransition(() => {
        setSavedIds(new Set());
        setIsLoading(false);
      });
      return;
    }

    startTransition(() => setIsLoading(true));
    fetch('/api/saved-items', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { product_ids: [] }))
      .then((data: { product_ids?: string[] }) => {
        if (!active) return;
        setSavedIds(new Set(data.product_ids ?? []));
      })
      .catch(() => {
        if (active) setSavedIds(new Set());
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const isSaved = useCallback((productId: string) => savedIds.has(productId), [savedIds]);

  const toggleSaved = useCallback(
    async (productId: string): Promise<{ status: ToggleStatus; error?: string }> => {
      if (!user) return { status: 'auth_required' };

      const wasSaved = savedIds.has(productId);
      const nextIds = new Set(savedIds);
      if (wasSaved) {
        nextIds.delete(productId);
      } else {
        nextIds.add(productId);
      }
      setSavedIds(nextIds);

      const response = await fetch('/api/saved-items', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      }).catch(() => null);

      if (!response?.ok) {
        setSavedIds(savedIds);
        return { status: 'error', error: 'Unable to update saved gems right now.' };
      }

      return { status: wasSaved ? 'removed' : 'added' };
    },
    [savedIds, user]
  );

  const value = useMemo(
    () => ({ savedIds, isLoading, isSaved, toggleSaved }),
    [savedIds, isLoading, isSaved, toggleSaved]
  );

  return <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>;
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error('useSavedItems must be used inside SavedItemsProvider');
  }
  return context;
}