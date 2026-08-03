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
import { useCart } from '@/lib/hooks/useCart';
import {
  buildConfiguratorStateFromCartItem,
  productConfiguratorStorageKey,
  writeConfiguratorDraft,
} from '@/lib/configurator/seed-from-cart';
import ConfiguratorWrapper from '@/components/configurator/ConfiguratorWrapper';
import type { ConfiguredOrderResult } from '@/components/configurator/PriceSummary';
import type { ProductCard } from '@/lib/types/product';
import type { ConfiguratorState, GemCategory } from '@/lib/types/configurator';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';
import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';
import type { JewelrySettingMetalProfiles } from '@/lib/utils/jewelry-setting-metal-profiles';
import { createClient } from '@/lib/supabase/client';
import type {
  CertificationLab,
  EnergizationOption,
  JewelryDesign,
} from '@/lib/types/database';

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

  // Upgrade cart-seeded stubs (id+name) to full rows so pricing is correct.
  useEffect(() => {
    const designId = initialState.selected_design?.id;
    const labId = initialState.selected_lab?.id;
    const energizationId = initialState.selected_energization?.id;
    if (!designId && !labId && !energizationId) return;

    let cancelled = false;
    const supabase = createClient();

    async function enrich() {
      if (designId) {
        const { data } = await supabase
          .from('jewelry_designs')
          .select('*')
          .eq('id', designId)
          .maybeSingle();
        if (!cancelled && data) {
          dispatch({ type: 'SET_DESIGN', payload: data as JewelryDesign });
        }
      }
      if (labId) {
        const { data } = await supabase
          .from('certification_labs')
          .select('*')
          .eq('id', labId)
          .maybeSingle();
        if (!cancelled && data) {
          dispatch({ type: 'SET_LAB', payload: data as CertificationLab });
        }
      }
      if (energizationId) {
        const { data } = await supabase
          .from('energization_options')
          .select('*')
          .eq('id', energizationId)
          .maybeSingle();
        if (!cancelled && data) {
          dispatch({ type: 'SET_ENERGIZATION', payload: data as EnergizationOption });
        }
      }
    }

    void enrich();
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    initialState.selected_design?.id,
    initialState.selected_energization?.id,
    initialState.selected_lab?.id,
  ]);

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
  const { getCartItem } = useCart();
  const cartItem = preselectedProduct ? getCartItem(preselectedProduct.id) : null;
  const cartConfigured = Boolean(cartItem?.configuration_id);

  const session = useMemo(() => {
    if (!preselectedProduct) {
      return {
        key: 'full',
        initialState: createConfiguratorState(),
        startStep: 1,
        storageKey: 'pvg_configurator:full',
        comboIds: comboProductIds,
      };
    }

    const rudraksha = isRudrakshaConfiguratorContext(null, preselectedProduct);
    const category: GemCategory = rudraksha
      ? 'rudraksha'
      : preselectedProduct.sub_category || preselectedProduct.category || 'other';

    const storageKey = productConfiguratorStorageKey(preselectedProduct.id, Boolean(onConfigured));
    const fromCart =
      cartConfigured && cartItem && !onConfigured
        ? buildConfiguratorStateFromCartItem(preselectedProduct, cartItem)
        : null;

    const initialState =
      fromCart ??
      createConfiguratorState({
        current_step: rudraksha ? 4 : 3,
        gem_category: category,
        selected_product: preselectedProduct,
        ...(rudraksha ? { setting_type: 'pendant' as const } : {}),
      });

    // Cart is source of truth when editing — overwrite any stale draft before hydrate.
    if (fromCart) {
      writeConfiguratorDraft(storageKey, fromCart);
    }

    const comboFromCart =
      parseConfigurationSnapshot(cartItem?.configuration_snapshot)?.selections
        ?.rudraksha_combo_product_ids ?? [];

    return {
      key: `product:${preselectedProduct.id}:${cartItem?.configuration_id ?? 'new'}`,
      initialState,
      startStep: 3,
      storageKey,
      comboIds: [...new Set([...comboProductIds, ...comboFromCart])],
    };
  }, [preselectedProduct, onConfigured, cartConfigured, cartItem, comboProductIds]);

  return (
    <ConfiguratorSession
      key={session.key}
      initialState={session.initialState}
      startStep={session.startStep}
      storageKey={session.storageKey}
      comboProductIds={session.comboIds}
      onConfigured={onConfigured}
      submitLabel={submitLabel}
    />
  );
}
