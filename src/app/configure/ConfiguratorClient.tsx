'use client';

/**
 * Configurator Client Page — wraps the state machine hook + components.
 * Product-routed sessions start at "Choose Setting Type" with the stone pre-selected.
 */

import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { useManualMetalPrices } from '@/lib/hooks/useManualMetalPrices';
import {
  createConfiguratorState,
  useConfigurator,
} from '@/lib/hooks/useConfigurator';
import ConfiguratorWrapper from '@/components/configurator/ConfiguratorWrapper';
import type { ConfiguredOrderResult } from '@/components/configurator/PriceSummary';
import type { ProductCard } from '@/lib/types/product';
import type { ConfiguratorState, GemCategory } from '@/lib/types/configurator';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';
import type { JewelrySettingMetalProfiles } from '@/lib/utils/jewelry-setting-metal-profiles';

interface ConfiguratorClientProps {
  /** Pre-selected product (routed from PDP "Configure" button) */
  preselectedProduct?: ProductCard | null;
  /** Additional Rudraksha product IDs for multi-bead pendant configuration */
  comboProductIds?: string[];
  /** Admin POS: return saved config instead of adding to cart */
  onConfigured?: (result: ConfiguredOrderResult) => void;
  submitLabel?: string;
}

interface ConfiguratorSessionProps {
  initialState: ConfiguratorState;
  startStep: number;
  storageKey: string;
  comboProductIds?: string[];
  onConfigured?: (result: ConfiguredOrderResult) => void;
  submitLabel?: string;
}

function ConfiguratorSession({
  initialState,
  startStep,
  storageKey,
  comboProductIds = [],
  onConfigured,
  submitLabel,
}: ConfiguratorSessionProps) {
  const { metalPrices, laborRates, pricingModes, ratesBySlug } = useManualMetalPrices();
  const { data: profileData } = useSWR<{ profiles: JewelrySettingMetalProfiles }>(
    '/api/jewelry/setting-profiles',
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  );
  const { state, dispatch, canGoToStep, canProceed, isComplete, reset } =
    useConfigurator(metalPrices, {
      initialState,
      storageKey,
      laborRates,
      pricingModes,
      ratesBySlug,
      settingProfiles: profileData?.profiles ?? null,
    });

  useEffect(() => {
    if (!comboProductIds.length || !initialState.selected_product) return;

    let cancelled = false;

    async function loadComboProducts() {
      const extraIds = comboProductIds.filter((id) => id !== initialState.selected_product?.id);
      if (!extraIds.length) return;

      const products = await Promise.all(
        extraIds.map(async (id) => {
          const res = await fetch(`/api/products/${id}`);
          if (!res.ok) return null;
          const data = (await res.json()) as { product?: ProductCard };
          return data.product ?? null;
        })
      );

      if (cancelled) return;
      const valid = products.filter((product): product is ProductCard => product !== null);
      if (valid.length > 0) {
        dispatch({ type: 'SET_RUDRAKSHA_COMBO', payload: valid });
      }
    }

    void loadComboProducts();
    return () => {
      cancelled = true;
    };
  }, [comboProductIds, dispatch, initialState.selected_product]);

  return (
    <ConfiguratorWrapper
      state={state}
      dispatch={dispatch}
      canGoToStep={canGoToStep}
      canProceed={canProceed}
      isComplete={isComplete}
      reset={reset}
      goldRate={metalPrices}
      laborRates={laborRates}
      pricingModes={pricingModes}
      ratesBySlug={ratesBySlug}
      settingProfiles={profileData?.profiles ?? null}
      startStep={startStep}
      onConfigured={onConfigured}
      submitLabel={submitLabel}
    />
  );
}

export default function ConfiguratorClient({
  preselectedProduct,
  comboProductIds = [],
  onConfigured,
  submitLabel,
}: ConfiguratorClientProps) {
  const session = useMemo(() => {
    if (!preselectedProduct) {
      return {
        key: 'full',
        initialState: createConfiguratorState(),
        startStep: 1,
        storageKey: 'pvg_configurator:full',
      };
    }

    const rudraksha = isRudrakshaConfiguratorContext(null, preselectedProduct);
    const category: GemCategory = rudraksha
      ? 'rudraksha'
      : preselectedProduct.sub_category || preselectedProduct.category || 'other';

    return {
      key: `product:${preselectedProduct.id}`,
      initialState: createConfiguratorState({
        current_step: rudraksha ? 4 : 3,
        gem_category: category,
        selected_product: preselectedProduct,
        ...(rudraksha ? { setting_type: 'pendant' as const } : {}),
      }),
      startStep: 3,
      storageKey: onConfigured
        ? `pvg_configurator:admin-pos:${preselectedProduct.id}`
        : `pvg_configurator:product:${preselectedProduct.id}`,
    };
  }, [preselectedProduct, onConfigured]);

  return (
    <ConfiguratorSession
      key={session.key}
      initialState={session.initialState}
      startStep={session.startStep}
      storageKey={session.storageKey}
      comboProductIds={comboProductIds}
      onConfigured={onConfigured}
      submitLabel={submitLabel}
    />
  );
}
