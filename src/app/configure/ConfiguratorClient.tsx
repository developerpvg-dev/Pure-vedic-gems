'use client';

/**
 * Configurator Client Page — wraps the state machine hook + components.
 * Product-routed sessions start at "Choose Setting Type" with the stone pre-selected.
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import { useManualMetalPrices } from '@/lib/hooks/useManualMetalPrices';
import {
  createConfiguratorState,
  useConfigurator,
} from '@/lib/hooks/useConfigurator';
import ConfiguratorWrapper from '@/components/configurator/ConfiguratorWrapper';
import type { ProductCard } from '@/lib/types/product';
import type { ConfiguratorState, GemCategory } from '@/lib/types/configurator';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';
import type { JewelrySettingMetalProfiles } from '@/lib/utils/jewelry-setting-metal-profiles';

interface ConfiguratorClientProps {
  /** Pre-selected product (routed from PDP "Configure" button) */
  preselectedProduct?: ProductCard | null;
}

interface ConfiguratorSessionProps {
  initialState: ConfiguratorState;
  startStep: number;
  storageKey: string;
}

function ConfiguratorSession({
  initialState,
  startStep,
  storageKey,
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
    />
  );
}

export default function ConfiguratorClient({
  preselectedProduct,
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
      storageKey: `pvg_configurator:product:${preselectedProduct.id}`,
    };
  }, [preselectedProduct]);

  return (
    <ConfiguratorSession
      key={session.key}
      initialState={session.initialState}
      startStep={session.startStep}
      storageKey={session.storageKey}
    />
  );
}
